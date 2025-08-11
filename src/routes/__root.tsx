import ProjectProvider from "@/context/project-context";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <ProjectProvider>
      <Outlet />
    </ProjectProvider>
  )
})