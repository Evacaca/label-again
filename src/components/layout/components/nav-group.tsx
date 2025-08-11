import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { SidebarItem } from "../data/sidebar-data";
import { useProjects } from "@/context/project-context";
import { useLabels } from "../context/labels-context";
import { useNavigate } from "@tanstack/react-router";

export function NavGroup({ title, items }: SidebarItem) {
  const { labels } = useLabels()
  const { exportImage } = useProjects()
  const navigate = useNavigate();

  const exportLabels = () => {
    if (labels.length === 0) {
      return;
    }
    const json = JSON.stringify(labels);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labels.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleClickButton = (item: SidebarItem['items'][0]) => {
    if (item.type === 'action') {
      switch (item.key) {
        case 'exportLabels':
          exportLabels();
          break;
        case 'exportImage':
          exportImage();
          break;
        default:
          break;
      }
    } else if (item.type === 'link') {
      navigate({ to: item.url })
    }
  }

  return <SidebarGroup>
    <SidebarGroupLabel>{title}</SidebarGroupLabel>

    <SidebarGroupContent>
      <SidebarMenu>
        {
          items.map((item) => (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton onClick={() => handleClickButton(item)}>
                <item.icon />
                <span className="max-w-52 text-wrap">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        }
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
}