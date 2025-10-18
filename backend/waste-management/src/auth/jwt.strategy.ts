import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // user id
  role: string;
  email?: string;
  name?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface ValidatedUser {
  _id: string;
  userId: string;
  email?: string;
  name?: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is missing. Add it to your .env');
    }

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    };

    super(opts);
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    // Validate token type
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Return user info directly from JWT payload
    // This becomes req.user - no database call needed!
    return {
      _id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}