import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectPattern, ProjectPatternStatus } from '@/lib/types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  patternIds: number[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'cold-climate-home',
    name: 'Cold Climate Home',
    description: 'Essential patterns for building in northern climates where winters reach -30°C.',
    patternIds: [6, 16, 22, 23, 24, 58, 59, 60, 61, 62, 63, 64, 69],
  },
  {
    id: 'neighborhood-retrofit',
    name: 'Neighborhood Retrofit',
    description: 'Patterns for transforming car-dependent areas into walkable, livable neighborhoods.',
    patternIds: [1, 2, 4, 12, 29, 40, 41, 42, 43, 50, 72, 96],
  },
  {
    id: 'resilient-renovation',
    name: 'Resilient Renovation',
    description: 'Patterns for upgrading existing buildings for durability, efficiency, and longevity.',
    patternIds: [22, 28, 31, 45, 46, 47, 49, 56, 69, 84],
  },
];

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;

  // Project CRUD
  createProject: (name: string, description?: string) => Project;
  createProjectFromTemplate: (templateId: string) => Project | null;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  // Pattern operations
  addPattern: (projectId: string, patternId: number) => void;
  removePattern: (projectId: string, patternId: number) => void;
  updatePatternStatus: (projectId: string, patternId: number, status: ProjectPatternStatus) => void;
  updatePatternNotes: (projectId: string, patternId: number, notes: string) => void;

  // Helpers
  getActiveProject: () => Project | undefined;
  isPatternInProject: (projectId: string, patternId: number) => boolean;
  exportProject: (id: string) => string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name, description = '') => {
        const now = new Date().toISOString();
        const project: Project = {
          id: generateId(),
          name,
          description,
          createdAt: now,
          updatedAt: now,
          patterns: [],
        };

        set(state => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
        }));

        return project;
      },

      createProjectFromTemplate: (templateId) => {
        const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return null;

        const now = new Date().toISOString();
        const patterns: ProjectPattern[] = template.patternIds.map(patternId => ({
          patternId,
          status: 'not_started' as ProjectPatternStatus,
          notes: '',
          addedAt: now,
        }));

        const project: Project = {
          id: generateId(),
          name: template.name,
          description: template.description,
          createdAt: now,
          updatedAt: now,
          patterns,
        };

        set(state => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
        }));

        return project;
      },

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      addPattern: (projectId, patternId) => {
        const project = get().projects.find(p => p.id === projectId);
        if (!project || project.patterns.some(pp => pp.patternId === patternId)) return;

        const newPattern: ProjectPattern = {
          patternId,
          status: 'not_started',
          notes: '',
          addedAt: new Date().toISOString(),
        };

        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  patterns: [...p.patterns, newPattern],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      removePattern: (projectId, patternId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  patterns: p.patterns.filter(pp => pp.patternId !== patternId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updatePatternStatus: (projectId, patternId, status) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  patterns: p.patterns.map(pp =>
                    pp.patternId === patternId ? { ...pp, status } : pp
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updatePatternNotes: (projectId, patternId, notes) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  patterns: p.patterns.map(pp =>
                    pp.patternId === patternId ? { ...pp, notes } : pp
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find(p => p.id === activeProjectId);
      },

      isPatternInProject: (projectId, patternId) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.patterns.some(pp => pp.patternId === patternId) ?? false;
      },

      exportProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (!project) return '';
        return JSON.stringify(project, null, 2);
      },
    }),
    {
      name: 'language-a-projects',
    }
  )
);
