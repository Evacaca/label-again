import { createFileRoute } from "@tanstack/react-router";
import Labeling from "@/features/labeling";

export const Route = createFileRoute('/(label)/$labelId')({
  component: Labeling,
})