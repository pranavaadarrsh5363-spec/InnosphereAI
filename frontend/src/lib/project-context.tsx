'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  isLoadingProjects: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const refreshProjects = async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0) {
        const storedId = localStorage.getItem('innosphere_active_project');
        if (storedId && data.some((p: Project) => p.id === Number(storedId))) {
          setActiveProjectId(Number(storedId));
        } else if (!activeProjectId || !data.some((p: Project) => p.id === activeProjectId)) {
          setActiveProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshProjects();
    }
  }, [user]);

  const handleSetActiveProjectId = (id: number | null) => {
    setActiveProjectId(id);
    if (id) {
      localStorage.setItem('innosphere_active_project', String(id));
    } else {
      localStorage.removeItem('innosphere_active_project');
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        setActiveProjectId: handleSetActiveProjectId,
        isLoadingProjects,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
}
