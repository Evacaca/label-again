import React, { useRef } from "react";
import type { Project, ImageTransformState, StageState } from "./data/schema";
import { set, values, del } from 'idb-keyval';

export interface CanvasStateRefValue {
  getStageState: () => StageState | null;
}

export interface ProjectRefValue {
  handleExport: () => void;
  handleFlipX: () => void;
  handleFlipY: () => void;
  getImageTransform?: () => ImageTransformState | null;
}

interface ProjectContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addProject: (project: Project) => Promise<void>;
  getProject: (id: string) => Project | null;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  projectRef: React.RefObject<ProjectRefValue | null>;
  canvasStateRef: React.RefObject<CanvasStateRefValue | null>;
  exportImage: () => void;
  flipImageX: () => void;
  flipImageY: () => void;
  editProjectOpen: boolean;
  setEditProjectOpen: (open: boolean) => void;
  isImageLocked: boolean;
  toggleImageLock: () => void;
}

const ProjectContext = React.createContext<ProjectContextType | null>(null)

interface Props {
  children: React.ReactNode;
}

export default function ProjectProvider({ children }: Props) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const projectRef = useRef<ProjectRefValue | null>(null);
  const canvasStateRef = useRef<CanvasStateRefValue | null>(null);
  const [editProjectOpen, setEditProjectOpen] = React.useState(false);
  const [isImageLocked, setIsImageLocked] = React.useState(false);

  // 从 IndexedDB 加载项目数据
  React.useEffect(() => {
    const loadProjects = async () => {
      const allProjects = await values<Project>();
      setProjects(allProjects);
    };

    loadProjects();
  }, []);

  const updateProject = React.useCallback(async (project: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p))
    );
    await set(project.id, project);
  }, []);

  const deleteProject = React.useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await del(id);
  }, []);

  const addProject = React.useCallback(async (project: Project) => {
    setProjects(prev => [...prev, project]);
    await set(project.id, project);
  }, []);

  const getProject = React.useCallback((id: string) => {
    return projects.find(p => p.id === id) || null;
  }, [projects]);

  const exportImage = () => {
    projectRef.current?.handleExport();
  }

  const flipImageX = () => {
    projectRef.current?.handleFlipX();
  }

  const flipImageY = () => {
    projectRef.current?.handleFlipY();
  }

  const toggleImageLock = () => {
    setIsImageLocked(prev => !prev);
  }

  return (
    <ProjectContext.Provider value={{
      projects,
      setProjects,
      addProject,
      getProject,
      updateProject,
      deleteProject,
      projectRef,
      canvasStateRef,
      exportImage,
      flipImageX,
      flipImageY,
      editProjectOpen,
      setEditProjectOpen,
      isImageLocked,
      toggleImageLock,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjects = () => {
  const projectContext = React.useContext(ProjectContext)

  if (!projectContext) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return projectContext;
}