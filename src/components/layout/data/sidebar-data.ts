import { Download, FileOutput, Plus } from "lucide-react";

export interface SidebarItem {
  title: string;
  items: {
    key: string;
    title: string;
    icon: React.ElementType;
    type: "link" | "action";
    url?: string;
  }[];
}
export const sidebarData: SidebarItem[] = [
  {
    title: "Tools",
    items: [
      {
        title: "export labels",
        key: "exportLabels",
        icon: Download,
        type: "action",
        url: "/export-labels",
      },
      {
        title: "export image",
        key: "exportImage",
        icon: FileOutput,
        type: "action",
      },
    ],
  },
  {
    title: "Projects",
    items: [
      {
        title: "create project",
        key: "createProject",
        icon: Plus,
        type: "link",
        url: "/",
      },
    ],
  },
];
