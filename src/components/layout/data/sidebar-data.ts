import {
  Download,
  FileOutput,
  FlipHorizontal,
  FlipVertical,
  Plus,
} from "lucide-react";

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
        title: "flip image X axis",
        key: "flipImageX",
        icon: FlipHorizontal,
        type: "action",
      },
      {
        title: "flip image Y axis",
        key: "flipImageY",
        icon: FlipVertical,
        type: "action",
      },
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
