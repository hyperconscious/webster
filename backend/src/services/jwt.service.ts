import jwt from 'jsonwebtoken';
import { BadRequestError, UnauthorizedError } from '../utils/http-errors';
import { User } from '../entities/user.entity';
import config from '../config/env.config';

export type TokenType = 'access' | 'refresh' | 'email';

interface TokenPayload {
  id: number;
  role: string;
  email?: string;
}

interface IJWTService {
  generateAccessToken(user: User): string;
  generateRefreshToken(user: User): string;
  generateEmailToken(user: User): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
  verifyEmailToken(token: string): TokenPayload;
  getUserFromToken(token: string, type: 'access' | 'refresh' | 'email'): User;
}

export class JWTService implements IJWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private emailTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  private mailTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = config.JWT.accessTokenSecret;
    this.refreshTokenSecret = config.JWT.refreshTokenSecret;
    this.emailTokenSecret = config.JWT.emailTokenSecret;

    this.accessTokenExpiry = config.JWT.accessTokenExpiry as string;
    this.refreshTokenExpiry = config.JWT.refreshTokenExpiry;
    this.mailTokenExpiry = config.JWT.emailTokenExpiry;
  }

  public generateAccessToken(user: User): string {
    return jwt.sign(
      { id: user.id},
      this.accessTokenSecret,
      { expiresIn: '1d' }
    );
  }

  public generateRefreshToken(user: User): string {
    return jwt.sign(
      { id: user.id},
      this.refreshTokenSecret,
      { expiresIn: '7d' }
    );
  }

  public generateEmailToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email },
      this.emailTokenSecret,
      { expiresIn: '15m' }
    );
  }

  public verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired access token.');
    }
  }

  public verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }
  }

  public verifyEmailToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.emailTokenSecret) as TokenPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired email token.');
    }
  }

  public getUserFromToken(token: string, type: TokenType): User {
    let payload: TokenPayload;

    switch (type) {
      case 'access':
        payload = this.verifyAccessToken(token);
        break;
      case 'refresh':
        payload = this.verifyRefreshToken(token);
        break;
      case 'email':
        payload = this.verifyEmailToken(token);
        break;
      default:
        throw new BadRequestError('Invalid token type.');
    }
    return { id: payload.id, email: payload.email } as User;
  }
}
