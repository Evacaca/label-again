import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const projectSchema = z.object({
  id: z.string(),
  type: z.enum(["Labeling", "Matching"]),
  file: z.instanceof(File).optional(),
  matrixData: z.array(z.array(z.number())),
  matrixColor: z.string(),
  imageData: z.string().optional(),
});

export type Project = z.infer<typeof projectSchema>;
