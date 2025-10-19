import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export interface Token {
  token: string;
  expires: Date;
  blacklisted: boolean;
}

export type Role =
  | 'HOUSEHOLD'
  | 'SME'
  | 'DRIVER'
  | 'RECYCLER'
  | 'COUNCIL'
  | 'ADMIN';
export type UserDocument = HydratedDocument<User> & IUser;

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  passwordHash?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  isEmailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role?: Role;
  tokens?: Token[];
  comparePassword?: (candidatePassword: string) => Promise<boolean>;
}

@Schema({ timestamps: true })
export class User implements IUser {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  email?: string;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop({
    required: true,
    enum: ['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'],
    default: 'HOUSEHOLD',
    index: true,
  })
  role: Role;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, select: false })
  emailVerificationToken?: string;

  @Prop({ type: Date, select: false })
  emailVerificationExpires?: Date;

  @Prop({ type: String, select: false })
  resetPasswordToken?: string;

  @Prop({ type: Date, select: false })
  resetPasswordExpires?: Date;

  @Prop({ type: [Object], select: false })
  tokens: Array<{
    token: string;
    expires: Date;
    type: string;
    blacklisted: boolean;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure stable JSON: expose id as string and remove sensitive/internal fields
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if (ret._id) {
      ret.id = ret._id.toString();
      ret._id = ret._id.toString();
    }
    delete ret.passwordHash;
    delete ret.tokens;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

UserSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if (ret._id) {
      ret.id = ret._id.toString();
      ret._id = ret._id.toString();
    }
    delete ret.passwordHash;
    delete ret.tokens;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});
