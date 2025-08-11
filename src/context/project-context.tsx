import React, { useRef } from "react";
import type { Project } from "./data/schema";

interface ProjectContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addProject: (project: Project) => void;
  getProject: (id: string) => Project | null;
  projectRef: React.RefObject<{ handleExport: () => void } | null>;
  exportImage: () => void;
}

const ProjectContext = React.createContext<ProjectContextType | null>(null)

interface Props {
  children: React.ReactNode;
}

export default function ProjectProvider({ children }: Props) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const projectRef = useRef<{ handleExport: () => void }>(null);

  // 从 localStorage 加载项目数据
  React.useEffect(() => {
    const loadProjects = () => {
      const projectIds = Object.keys(localStorage).filter(id => id.startsWith('__project__'));
      const loadedProjects = projectIds
        .map(id => {
          try {
            const projectData = localStorage.getItem(id);
            return projectData ? JSON.parse(projectData) as Project : null;
          } catch (e) {
            console.error('Error parsing project data:', e);
            return null;
          }
        })
        .filter((project): project is Project => project !== null);
      setProjects(loadedProjects);
    };

    loadProjects();
  }, []);

  const addProject = React.useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
    localStorage.setItem(project.id, JSON.stringify(project));
  }, []);

  const getProject = React.useCallback((id: string) => {
    return projects.find(p => p.id === id) || null;
  }, [projects]);

  const exportImage = () => {
    projectRef.current?.handleExport();
  }

  return (
    <ProjectContext.Provider value={{
      projects,
      setProjects,
      addProject,
      getProject,
      projectRef,
      exportImage
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