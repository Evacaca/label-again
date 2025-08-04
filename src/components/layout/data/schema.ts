import { z } from "zod";

const labelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Label name is required" }),
  color: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  polygon: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
      })
    )
    .optional(),
  finished: z.boolean().optional(),
  scale: z.number().optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  selectedFigureId: z.string().optional().nullable(),
});

export type Label = z.infer<typeof labelSchema>;
export const labelListSchema = z.array(labelSchema);
