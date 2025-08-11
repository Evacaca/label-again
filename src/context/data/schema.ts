import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const projectSchema = z.object({
  id: z.string(),
  type: z.enum(["Labeling", "Matching"]),
  file: z.instanceof(File),
  matrixData: z.array(z.array(z.number())),
  matrixColor: z.string(),
  image: z.instanceof(File).optional(),
});

export type Project = z.infer<typeof projectSchema>;
