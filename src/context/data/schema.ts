import { z } from "zod";

const stageStateSchema = z.object({
  scale: z.number(),
  position: z.object({ x: z.number(), y: z.number() }),
});

const imageTransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  flipX: z.boolean(),
  flipY: z.boolean(),
  offsetX: z.number(),
  offsetY: z.number(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Labeling", "Matching"]),
  file: z.instanceof(File),
  matrixData: z.array(z.array(z.number())),
  matrixColor: z.string(),
  image: z.instanceof(File).optional(),
  createdAt: z.date(),
  // 保存时的状态：labels、stage 变换、image 变换
  labels: z.array(z.any()).optional(),
  stage: stageStateSchema.optional(),
  imageTransform: imageTransformSchema.optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type StageState = z.infer<typeof stageStateSchema>;
export type ImageTransformState = z.infer<typeof imageTransformSchema>;
