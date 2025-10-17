import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserType {
  sub: string;        // Standard JWT subject claim (user ID)
  userId: string;     // Alias for sub
  role: string;
  email?: string;
  name?: string;
}

/**
 * Custom decorator to get the current authenticated user.
 * Returns a fully typed object (never null or any).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest();

    // Safely extract and normalize user information
    const user = request.user ?? {};

    return {
      sub: user.sub ?? '',
      userId: user.sub ?? user.userId ?? '',
      role: user.role ?? 'guest',
      email: user.email,
      name: user.name,
    };
  },
);
