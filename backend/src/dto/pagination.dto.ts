import { z } from 'zod';

const numberFromString = z
  .union([z.string().regex(/^\d+$/), z.number()])
  .transform((val) => Number(val))
  .pipe(z.number().min(1));

export const PaginationDto = z.object({
  page:
    numberFromString
    .default(1)
    .optional(),

  limit:
    numberFromString
    .default(10)
    .optional(),

  sortDirection: z
    .string()
    .toUpperCase()
    .refine((val) => val === 'ASC' || val === 'DESC', {
      message: 'Sort direction must be either ASC or DESC.',
    })
    .default('ASC')
});

export type PaginationDtoType = z.infer<typeof PaginationDto>;
