import type React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Eye, EyeOff, Pencil, Plus, Shell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "../ui/badge";
import { useLabels } from "./context/labels-context";

import { sidebarData } from "./data/sidebar-data";
import { NavGroup } from "./components/nav-group";

import { EditProjectDialog } from "@/features/project/edit-project-dialog";
import { useProjects } from "@/context/project-context";
import { useParams } from "@tanstack/react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    setOpen,
    setCurrentLabel,
    labels,
    currentLabel,
    toggleLabelHidden,
    isLabelHidden,
  } = useLabels();
  const { getProject, editProjectOpen, setEditProjectOpen } = useProjects();
  const { labelId } = useParams({ strict: false }) as { labelId?: string };
  const project = labelId ? getProject(labelId) : null;

  return (
    <Sidebar collapsible="icon" variant="floating" side="right" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuButton size="lg" asChild>
            <Link to="/">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Shell className="size-4" />
              </div>
              <div className="grid flex-1 items-center">
                <span className="truncate font-semibold">Labeling</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Labels</SidebarGroupLabel>
          <SidebarGroupAction
            title="Add Label"
            onClick={() => setOpen("create")}
          >
            <Plus /> <span className="sr-only">Add Label</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {labels.map((label, index) => (
                <SidebarMenuItem key={label.id}>
                  <SidebarMenuButton
                    isActive={label.id === currentLabel?.id}
                    onClick={() => {
                      setCurrentLabel(label);
                    }}
                  >
                    <Badge
                      style={{ backgroundColor: label.color }}
                      className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
                    >
                      {index + 1}
                    </Badge>
                    <span className="max-w-52 text-wrap">{label.name}</span>
                  </SidebarMenuButton>

                  <SidebarMenuAction
                    onClick={() => {
                      setOpen("edit");
                      setCurrentLabel(label);
                    }}
                    className="mr-6"
                  >
                    <Pencil />
                  </SidebarMenuAction>
                  <SidebarMenuAction
                    title={
                      isLabelHidden(label.id)
                        ? "Show Polygons"
                        : "Hide Polygons"
                    }
                    onClick={() => toggleLabelHidden(label.id)}
                  >
                    {isLabelHidden(label.id) ? <EyeOff /> : <Eye />}
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {sidebarData.map((item) => (
          <NavGroup key={item.title} {...item} />
        ))}
      </SidebarContent>
      <EditProjectDialog
        project={project}
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
      />
    </Sidebar>
  );
}
