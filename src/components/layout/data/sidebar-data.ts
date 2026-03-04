import {
  Download,
  FileOutput,
  FlipHorizontal,
  FlipVertical,
  Plus,
  ListCheck,
  HelpCircle,
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
        title: "Flip Horizontally",
        key: "flipImageX",
        icon: FlipHorizontal,
        type: "action",
      },
      {
        title: "Flip Vertically",
        key: "flipImageY",
        icon: FlipVertical,
        type: "action",
      },
      {
        title: "Export Labels",
        key: "exportLabels",
        icon: Download,
        type: "action",
        url: "/export-labels",
      },
      {
        title: "Export Image",
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
        title: "New Project",
        key: "createProject",
        icon: Plus,
        type: "link",
        url: "/",
      },
      {
        title: "All Projects",
        key: "allProjects",
        icon: ListCheck,
        type: "link",
        url: "/projects",
      },
    ],
  },
  {
    title: "Other",
    items: [
      {
        title: "Keyboard Shortcuts",
        key: "showShortcuts",
        icon: HelpCircle,
        type: "action",
      },
    ],
  },
];
