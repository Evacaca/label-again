import Project from '@/features/project'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Project,
})

