import { z } from "zod";

const polygon = z.object({
  points: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
    })
  ),
  id: z.string(),
  finished: z.boolean(),
  color: z.string().optional(),
});

const labelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Label name is required" }),
  matrixData: z.array(z.array(z.number())),
  matrixColor: z.string(),
  file: z.instanceof(File).optional(),
  color: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  polygons: z.array(polygon).optional(),
  scale: z.number().optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  selectedFigureId: z.string().optional().nullable(),
});

const projectSchema = z.object({
  type: z.enum(["labeling", "matching"]),
  file: z.instanceof(File).optional(),
  matrixData: z.array(z.array(z.number())),
  matrixColor: z.string(),
  imageData: z.string().optional(),
});

export type Polygon = z.infer<typeof polygon>;
export type Label = z.infer<typeof labelSchema>;
export const labelListSchema = z.array(labelSchema);
