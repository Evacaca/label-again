import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '@/components/layout/layout'

export const Route = createFileRoute('/(label)')({
  component: Layout,
})

