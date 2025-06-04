import { z } from 'zod';

export interface RegisterData {
  login: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  countryCode: string;
  full_name: string;
}

export interface LoginData {
  loginOrEmail: string;
  password: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface ResetPasswordData {
  password: string;
  passwordConfirmation: string;
}

export interface UpdateUserData {
  login?: string;
  password?: string;
  passwordConfirmation?: string;
  full_name?: string;
  email?: string;
  verified?: boolean;
  avatar?: string;
  role?: string;
}

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const fullNameRegex = /^[A-ZА-Я][a-zа-яё]+ [A-ZА-Я][a-zа-яё]+$/;

export const registerSchema = z
  .object({
    login: z
      .string()
      .min(4, 'Login must be at least 4 characters long.')
      .max(20, 'Login must be at most 20 characters long.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      ),
    passwordConfirmation: z.string(),
    full_name: z
      .string()
      .regex(
        fullNameRegex,
        'Full name must consist of two words, each starting with a capital letter.'
      ),
    email: z
      .string()
      .email('Email must be a valid email address.'),
    countryCode: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Password confirmation does not match password.',
  });

export const loginSchema = z.object({
  loginOrEmail: z.string({ required_error: 'login or email is required.' }),
  password: z.string({ required_error: 'Password is required.' }),
});

export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      ),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Password confirmation does not match password.',
  });

export const updateUserDto = z
  .object({
    login: z
      .string()
      .min(4, 'Login must be at least 4 characters long.')
      .max(20, 'Login must be at most 20 characters long.')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      )
      .optional()
      .or(z.literal('')),
    passwordConfirmation: z
      .string()
      .optional()
      .or(z.literal('')),
    full_name: z
      .string()
      .regex(
        fullNameRegex,
        'Full name must consist of two words, each starting with a capital letter.'
      )
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .email('Email must be a valid email address.')
      .optional(),
    verified: z.boolean().optional().default(false),
    role: z.enum(['admin', 'user']).optional().default('user'),
  })
  .refine(
    (data) =>
      data.password === undefined ||
      data.password === '' ||
      data.password === data.passwordConfirmation,
    {
      path: ['passwordConfirmation'],
      message: 'Password confirmation does not match password.',
    }
  )
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });
