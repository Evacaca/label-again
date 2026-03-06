import { type Project } from "@/context/data/schema";
import {
  Download,
  FileOutput,
  FlipHorizontal,
  FlipVertical,
  Plus,
  ListCheck,
  HelpCircle,
  PencilLine,
  Lock,
  Unlock,
  Save,
} from "lucide-react";

export interface SidebarState {
  project: Project | null;
  hasImage: boolean;
  isImageLocked: boolean;
  hasLabels: boolean;
}

export interface SidebarItem {
  title: string;
  items: {
    key: string;
    title: string | ((state: SidebarState) => string);
    icon: React.ElementType | ((state: SidebarState) => React.ElementType);
    type: "link" | "action";
    url?: string;
    disabled?: (state: SidebarState) => boolean;
    isActive?: (state: SidebarState) => boolean;
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
        disabled: (s) => !s.hasImage,
      },
      {
        title: "Flip Vertically",
        key: "flipImageY",
        icon: FlipVertical,
        type: "action",
        disabled: (s) => !s.hasImage,
      },
      {
        title: (s) =>
          s.isImageLocked ? "Unlock Image Layer" : "Lock Image Layer",
        key: "lockImageLayer",
        icon: (s: SidebarState) => (s.isImageLocked ? Unlock : Lock),
        type: "action",
        disabled: (s) => !s.hasImage,
      },
      {
        title: "Export Labels",
        key: "exportLabels",
        icon: Download,
        type: "action",
      },
      {
        title: "Export Image",
        key: "exportImage",
        icon: FileOutput,
        type: "action",
        disabled: (s) => !s.hasImage,
      },
    ],
  },
  {
    title: "Projects",
    items: [
      {
        title: "Save",
        key: "saveProject",
        icon: Save,
        type: "action",
      },
      {
        title: "Edit",
        key: "editProject",
        icon: PencilLine,
        type: "action",
      },
      {
        title: "New",
        key: "createProject",
        icon: Plus,
        type: "link",
        url: "/",
      },
      {
        title: "All",
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
