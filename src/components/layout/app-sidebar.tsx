import type React from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Pencil, Plus, Shell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "../ui/badge";
import { useLabels } from "./context/labels-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpen, setCurrentLabel, labels } = useLabels()
  return <Sidebar collapsible='icon' variant='floating' {...props}>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuButton size='lg' asChild>
          <Link to="/">

            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
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
        <SidebarGroupAction title="Add Label" onClick={() => setOpen('create')}>
          <Plus /> <span className="sr-only">Add Label</span>
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {
              labels.map((label, index) => (
                <SidebarMenuItem key={label.id}>
                  <Link to="/$labelId" params={{ labelId: label.id }}>
                    <SidebarMenuButton>
                      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">{index + 1}</Badge>
                      <span className="max-w-52 text-wrap">{label.name}</span>
                    </SidebarMenuButton>
                  </Link>
                  <SidebarMenuAction onClick={() => { setOpen('edit'); setCurrentLabel(label) }}>
                    <Pencil />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))
            }
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar >
}