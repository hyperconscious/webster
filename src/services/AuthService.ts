import axios from '../api/axios';
import type { LoginData, RegisterData, ResetPasswordData, Tokens } from '../validation/schemas';

class AuthService {
  static async register(data: RegisterData): Promise<Tokens> {
    const response = await axios.post('/api/auth/register', data);
    return response.data;
  }

  static async login(credentials: LoginData): Promise<Tokens> {
    const response = await axios.post('/api/auth/login', credentials);
    return response.data;
  }

  static async googleLogin(credential: string): Promise<Tokens> {
    const response = await axios.post('/api/auth/google', { credential });
    return response.data;
  }

  static async refreshTokens(refreshToken: string): Promise<Tokens> {
    const response = await axios.post('/api/auth/refresh', { refreshToken });
    return response.data;
  }

  static async sendVerificationEmail(email: string) {
    const host = window.location.origin;
    const callbackUrl = `${host}/auth/verify-email`;
    const response = await axios.post('/api/auth/send-verification-email', { email }, {
      headers: {
        'X-Callback-Url': callbackUrl,
      },
    });
    return response.data;
  }

  static async verifyEmail(token: string) {
    const response = await axios.post(`/api/auth/verify-email?token=${token}`);
    return response.data;
  }

  static async sendPasswordReset(email: string) {
    const host = window.location.origin;
    const callbackUrl = `${host}/auth/reset-password`;
    const response = await axios.post('/api/auth/forgot-password', { email }, {
      headers: {
        'X-Callback-Url': callbackUrl,
      }
    });
    return response.data;
  }

  static async resetPassword(token: string, data: ResetPasswordData) {
    const response = await axios.post(`/api/auth/password-reset?token=${token}`, data);
    return response.data;
  }
}

export default AuthService;
