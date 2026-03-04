import { z } from "zod";

const polygon = z.object({
  labelId: z.string(),
  points: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
    })
  ),
  id: z.string(),
  finished: z.boolean(),
  color: z.string(),
  radius: z.number().optional(),
});

const labelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Label name is required" }),
  color: z.string(),
  pointRadius: z.number().optional(),
  minRadius: z.number().optional(),
  maxRadius: z.number().optional(),
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


export type Polygon = z.infer<typeof polygon>;
export type Label = z.infer<typeof labelSchema>;
export const labelListSchema = z.array(labelSchema);
