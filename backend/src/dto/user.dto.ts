import { z } from 'zod';
import { PaginationDto } from './pagination.dto';

const userSortFields = ['createdAt', 'updatedAt', 'login', 'id', 'full_name', 'email'] as const;

const fullNameRegex = /^[A-ZА-Я][a-zа-яё]+ [A-ZА-Я][a-zа-яё]+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const baseUserFields = {
  login: z
    .string({ required_error: 'Login is required.' })
    .min(4, { message: 'Login must be at least 4 characters long.' })
    .max(20, { message: 'Login must be at most 20 characters long.' }),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(passwordRegex, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    }),
  passwordConfirmation: z
    .string()
    .min(8, { message: 'Password confirmation must be at least 8 characters long.' })
    .regex(passwordRegex, {
      message:
        'Password confirmation must contain at least one uppercase letter, one lowercase letter, and one number.',
    })
    .optional(),

  full_name: z
    .string({ required_error: 'Full name is required.' })
    .regex(fullNameRegex, {
      message:
        'Full name must consist of two words, each starting with a capital letter.',
    }),

  email: z
    .string({ required_error: 'Email is required.' })
    .email({ message: 'Email must be a valid email address.' }),

  verified: z.boolean({ invalid_type_error: 'Verified must be a boolean value.' }).default(false),

  avatar: z.string().nullable().optional(),

};

export const createUserDto = z.object({
  ...baseUserFields,
});

export const updateUserDto = z
  .object({
    ...baseUserFields,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update the user.',
  });

const filtersSchema = z.object({
  login: z.string().min(1).optional(),
  email: z.string().optional(),
  verified: z.preprocess(
    (val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    },
    z.boolean().optional()
  ),
  full_name: z.string().min(1).optional(),
});

export const userQueryDto = PaginationDto.extend({
  sortBy: z
    .enum(userSortFields, {
      errorMap: () => ({
        message:
          'sortBy must be one of the following: createdAt, updatedAt, login, id, full_name, email.',
      }),
    })
    .default('createdAt')
    .optional(),
  filters: filtersSchema.optional(),
}).strict();

export type UserQueryDto = z.infer<typeof userQueryDto>;
