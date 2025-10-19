/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios, { AxiosInstance } from 'axios';
import { ContaminationNotificationService } from '../notifications/contamination-notification.service';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

type GeminiOut = {
  score: number;
  label: 'Clean' | 'Low' | 'Moderate' | 'High';
  rationale: string;
};

const LABELS = [
  { min: 1, max: 2, label: 'Clean' as const },
  { min: 3, max: 4, label: 'Low' as const },
  { min: 5, max: 7, label: 'Moderate' as const },
  { min: 8, max: 10, label: 'High' as const },
];

@Injectable()
export class ContaminationClient {
  private http: AxiosInstance;
  private readonly geminiKey?: string;
  private readonly geminiModelId: string;
  private readonly alertThreshold: number; // 1..10 scale
  private readonly provider: 'external' | 'gemini';

  private genAI?: GoogleGenerativeAI;
  private geminiModel?: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(
    private readonly config: ConfigService,
    @Inject(ContaminationNotificationService)
    private readonly notificationService: ContaminationNotificationService,
  ) {
    const baseURL = this.config.get<string>('CONTAMINATION_API_URL') || '';
    const apiToken = this.config.get<string>('CONTAMINATION_API_TOKEN');

    this.http = axios.create({
      baseURL,
      timeout: 10000,
      headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
    });

    // Gemini setup
    this.geminiKey = this.config.get<string>('GEMINI_API_KEY');
    this.geminiModelId =
      this.config.get<string>('GEMINI_MODEL_ID') || 'gemini-2.5-flash';
    this.alertThreshold = Number(
      this.config.get<string>('CONTAMINATION_ALERT_THRESHOLD') ?? 6,
    );

    // Provider selection: explicit wins; otherwise prefer gemini if key exists
    const explicitProvider = this.config.get<string>('CONTAMINATION_PROVIDER');
    this.provider = (explicitProvider as any) === 'external' ? 'external' : 'gemini';
    if (!explicitProvider) {
      this.provider = this.geminiKey ? 'gemini' : baseURL ? 'external' : 'gemini';
    }

    if (this.provider === 'gemini' && this.geminiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiKey);
      this.geminiModel = this.genAI.getGenerativeModel({
        model: this.geminiModelId,
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              score: {
                type: SchemaType.INTEGER,
                description: '1 (clean) to 10 (heavily contaminated)',
              },
              label: {
                type: SchemaType.STRING,
                format: 'enum',
                enum: ['Clean', 'Low', 'Moderate', 'High'],
              },
              rationale: { type: SchemaType.STRING },
            },
            required: ['score', 'label', 'rationale'],
          },
        },
      });
    }
  }

  // ---------- Public API ----------

  async scoreImageByUrl(imageUrl: string, wasteType: string, location: string) {
    if (this.usingExternalApi()) {
      return this.scoreViaExternalUrl(imageUrl, wasteType, location);
    }
    return this.scoreViaGeminiUrl(imageUrl, wasteType, location);
  }

  async scoreByBuffer(
    buffer: Buffer,
    filename: string,
    wasteType: string,
    location: string,
  ) {
    if (this.usingExternalApi()) {
      return this.scoreViaExternalBuffer(buffer, filename, wasteType, location);
    }
    return this.scoreViaGeminiBuffer(buffer, filename, wasteType, location);
  }

  // ---------- External API path (legacy behavior) ----------

  private async scoreViaExternalUrl(
    imageUrl: string,
    wasteType: string,
    location: string,
  ) {
    const { data } = await this.http.post('', { imageUrl });

    const rawScore =
      data.score ?? data.contamination_score ?? data.prediction ?? 0;
    const score = this.normalizeScore(rawScore);
    const label = this.labelFor(score) ?? data.label ?? data.class ?? 'unknown';

    await this.maybeNotify({ score, label, wasteType, location, imageUrl });

    return { score, label };
  }

  private async scoreViaExternalBuffer(
    buffer: Buffer,
    filename: string,
    wasteType: string,
    location: string,
  ) {
    const form = new FormData();
    form.append('file', buffer, { filename });
    const { data } = await this.http.post('', form, {
      headers: form.getHeaders(),
    });

    const rawScore =
      data.score ?? data.contamination_score ?? data.prediction ?? 0;
    const score = this.normalizeScore(rawScore);
    const label = this.labelFor(score) ?? data.label ?? data.class ?? 'unknown';

    await this.maybeNotify({ score, label, wasteType, location });

    return { score, label };
  }

  // ---------- Gemini path ----------

  private async scoreViaGeminiUrl(
    imageUrl: string,
    wasteType: string,
    location: string,
  ) {
    const { data, headers } = await axios.get<ArrayBuffer>(imageUrl, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(data as any);
    const mimeType = this.pickMime(headers['content-type'], imageUrl);
    const out = await this.runGemini(buffer, mimeType);

    await this.maybeNotify({
      score: out.score,
      label: out.label,
      wasteType,
      location,
      imageUrl,
    });
    return { score: out.score, label: out.label };
  }

  private async scoreViaGeminiBuffer(
    buffer: Buffer,
    filename: string,
    wasteType: string,
    location: string,
  ) {
    const mimeType = this.pickMime('', filename);
    const out = await this.runGemini(buffer, mimeType);

    await this.maybeNotify({
      score: out.score,
      label: out.label,
      wasteType,
      location,
    });
    return { score: out.score, label: out.label };
  }

  private async runGemini(
    buffer: Buffer,
    mimeType: string,
  ): Promise<GeminiOut> {
    if (!this.geminiModel) {
      throw new InternalServerErrorException(
        'Gemini not configured. Set GEMINI_API_KEY or CONTAMINATION_PROVIDER=external.',
      );
    }

    const base64 = buffer.toString('base64');

    const prompt = `
You are a waste contamination inspector.
Rate visible contamination from 1 (clean) to 10 (severely contaminated).
Consider: visible litter, food/oil stains, liquids/soiling, mixed/non-recyclable materials, and overall surface coverage.
Be strict. Map to label: 1–2=Clean, 3–4=Low, 5–7=Moderate, 8–10=High.
Return ONLY JSON matching the schema.`;

    const res = await this.geminiModel.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } },
    ]);

    // Parse and harden
    let parsed: GeminiOut;
    try {
      parsed = JSON.parse(res.response.text()) as GeminiOut;
    } catch {
      throw new InternalServerErrorException('Failed to parse Gemini response');
    }

    const score = this.clampInt(parsed.score, 1, 10);
    const label = this.labelFor(score);
    return {
      score,
      label: label ?? parsed.label ?? 'Moderate',
      rationale: parsed.rationale ?? '',
    };
  }

  // ---------- Helpers ----------

  private usingExternalApi(): boolean {
    return this.provider === 'external';
  }

  private clampInt(n: number, min: number, max: number): number {
    const x = Math.round(Number(n) || 0);
    return Math.max(min, Math.min(max, x));
  }

  /** Accepts 0–1, 0–100, or 1–10 and normalizes to 1–10 integer */
  private normalizeScore(raw: unknown): number {
    const n = Number(raw) || 0;
    let scaled: number;

    if (n <= 1) {
      // assume 0..1
      scaled = n * 10;
    } else if (n > 10) {
      // assume 0..100
      scaled = n / 10;
    } else {
      // assume already 1..10 (or 0..10)
      scaled = n;
    }
    return this.clampInt(scaled, 1, 10);
  }

  private labelFor(score: number) {
    return LABELS.find((r) => score >= r.min && score <= r.max)?.label;
  }

  private async maybeNotify(args: {
    score: number;
    label: string;
    wasteType: string;
    location: string;
    imageUrl?: string;
  }) {
    // Notify if score >= threshold (1..10 scale)
    if (args.score >= this.alertThreshold) {
      await this.notificationService.sendContaminationAlert({
        wasteType: args.wasteType,
        location: args.location,
        score: Number(args.score),
        label: args.label,
        detectedAt: new Date(),
        imageUrl: args.imageUrl,
      });
    }
  }

  private pickMime(contentType?: string, filenameOrUrl?: string): string {
    if (contentType && /^image\//.test(contentType)) return contentType;
    const lower = (filenameOrUrl || '').toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return 'image/jpeg';
  }
}
