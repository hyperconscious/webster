import { z } from 'zod';
import { PaginationDto } from './pagination.dto';

const projectSortFields = ['createdAt', 'updatedAt', 'name'] as const;

const baseProjectFields = {
  name: z
    .string({ required_error: 'Project name is required.' })
    .min(1, { message: 'Project name must be at least 1 character long.' })
    .max(256, { message: 'Project name must be at most 256 characters long.' }),

  data: z
    .string({ required_error: 'Project data is required.' })
    .min(1, { message: 'Project data must be at least 1 character long.' }),

  isTemplate: z
    .boolean()
    .default(false)
    .optional(),
};

const filtersSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name filter must be at least 1 character long.' })
    .optional(),
  isTemplate: z.preprocess((val) => {
    if (typeof val === "string") return val.toLowerCase() === "true";
    return val;
  }, z.boolean().optional().default(false)),
});

export const createProjectDto = z.object({
  ...baseProjectFields,
});

export const updateProjectDto = z
  .object({
    ...baseProjectFields,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update the project.',
  });

export const projectQueryDto = PaginationDto.extend({
  sortBy: z
    .enum(projectSortFields, {
      errorMap: () => ({
        message:
          'sortBy must be one of the following: name, createdAt, updatedAt.',
      }),
    })
    .default('createdAt')
    .optional(),
  filters: filtersSchema.optional(),
}).strict();

export type ProjectQueryDto = z.infer<typeof projectQueryDto>;