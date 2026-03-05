import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { SidebarItem } from "../data/sidebar-data";
import { useProjects } from "@/context/project-context";
import { useLabels } from "../context/labels-context";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function NavGroup({ title, items }: SidebarItem) {
  const { labels } = useLabels()
  const { exportImage, flipImageX, flipImageY, getProject, setEditProjectOpen, toggleImageLock, isImageLocked } = useProjects()
  const navigate = useNavigate();
  const { labelId } = useParams({ strict: false }) as { labelId?: string };
  const project = labelId ? getProject(labelId) : null;
  const hasImage = !!project?.image;

  // 构建当前状态快照，用于传递给配置中的判断函数
  const stateSnapshot = {
    project,
    hasImage,
    isImageLocked,
    hasLabels: labels.length > 0,
  };

  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);

  const exportLabels = () => {
    if (labels.length === 0) {
      setAlertOpen(true);
      return;
    }
    const json = JSON.stringify(labels);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LA-labels.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleClickButton = (item: SidebarItem['items'][0]) => {
    const isDisabled = item.disabled?.(stateSnapshot);
    if (isDisabled) return;

    if (item.type === 'action') {
      switch (item.key) {
        case 'exportLabels':
          exportLabels();
          break;
        case 'exportImage':
          exportImage();
          break;
        case 'flipImageX':
          flipImageX();
          break;
        case 'flipImageY':
          flipImageY();
          break;
        case 'lockImageLayer':
          toggleImageLock();
          break;
        case 'editProject':
          setEditProjectOpen(true);
          break;
        case 'showShortcuts':
          setShortcutsOpen(!shortcutsOpen);
          break;
        default:
          break;
      }
    } else if (item.type === 'link') {
      navigate({ to: item.url })
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>{title}</SidebarGroupLabel>

        <SidebarGroupContent>
          <SidebarMenu>
            {
              items.map((item) => {
                const isShortcuts = item.key === 'showShortcuts';
                const isDisabled = item.disabled?.(stateSnapshot);
                const isActive = item.isActive?.(stateSnapshot);

                // 解析图标和标题（可能是函数也可能是静态值）
                const Icon = typeof item.icon === 'function' ? item.icon(stateSnapshot) : item.icon;
                const itemTitle = typeof item.title === 'function' ? item.title(stateSnapshot) : item.title;

                const button = (
                  <SidebarMenuButton
                    onClick={() => handleClickButton(item)}
                    disabled={isDisabled}
                    isActive={isActive}
                  >
                    <Icon />
                    <span className="max-w-52 text-wrap">{itemTitle}</span>
                  </SidebarMenuButton>
                );

                if (isShortcuts) {
                  return (
                    <SidebarMenuItem key={item.key}>
                      <Tooltip open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
                        <TooltipTrigger asChild>
                          {button}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="p-4 w-72 bg-popover text-popover-foreground border shadow-xl">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center text-xs">
                              <span className="text-muted-foreground">Delete Figure</span>
                              <KbdGroup className="justify-end gap-1"><Kbd>Del</Kbd> / <Kbd>⌫</Kbd></KbdGroup>

                              <span className="text-muted-foreground">Zoom In</span>
                              <KbdGroup className="justify-end gap-1"><Kbd>+</Kbd> / <Kbd>=</Kbd></KbdGroup>

                              <span className="text-muted-foreground">Zoom Out</span>
                              <KbdGroup className="justify-end gap-1"><Kbd>-</Kbd> / <Kbd>_</Kbd></KbdGroup>

                              <span className="text-muted-foreground">Undo</span>
                              <KbdGroup className="justify-end gap-1"><Kbd>⌘</Kbd><Kbd>Z</Kbd></KbdGroup>

                              <span className="text-muted-foreground">Redo</span>
                              <KbdGroup className="justify-end gap-1"><Kbd>⌘</Kbd><Kbd>Y</Kbd> / <Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>Z</Kbd></KbdGroup>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.key}>
                    {button}
                  </SidebarMenuItem>
                )
              })
            }
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Labels Found</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Please add at least one label before exporting.
          </div>
          <DialogFooter>
            <Button onClick={() => setAlertOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}