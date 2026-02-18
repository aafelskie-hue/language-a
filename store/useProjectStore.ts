import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  migrationComplete: boolean;

  // Project CRUD
  createProject: (name: string, description?: string) => Promise<Project>;
  createProjectFromTemplate: (templateId: string) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;

  // Pattern operations
  addPattern: (projectId: string, patternId: number) => Promise<void>;
  removePattern: (projectId: string, patternId: number) => Promise<void>;
  updatePatternStatus: (projectId: string, patternId: number, status: ProjectPatternStatus) => Promise<void>;
  updatePatternNotes: (projectId: string, patternId: number, notes: string) => Promise<void>;

  // Helpers
  getActiveProject: () => Project | undefined;
  isPatternInProject: (projectId: string, patternId: number) => boolean;
  exportProject: (id: string) => string;

  // Auth methods
  setAuthenticated: (authenticated: boolean) => void;
  loadProjects: () => Promise<void>;
  migrateLocalToCloud: (localProjects: Project[]) => Promise<number>;
  clearLocalProjects: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const STORAGE_KEY = 'language-a-projects';

// Helper to get localStorage projects directly (for migration)
// Must be called BEFORE setAuthenticated(true) since partialize will clear localStorage
export function getLocalStorageProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed?.state?.projects ?? [];
  } catch {
    return [];
  }
}

// Helper to clear localStorage projects (after migration)
function clearLocalStorageProjects(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isAuthenticated: false,
      isLoading: false,
      isSyncing: false,
      migrationComplete: false,

      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
      },

      loadProjects: async () => {
        const { isAuthenticated } = get();
        if (!isAuthenticated) return;

        set({ isLoading: true });
        try {
          const response = await fetch('/api/projects');
          if (response.ok) {
            const projects = await response.json();
            set({ projects, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      migrateLocalToCloud: async (localProjects: Project[]) => {
        const { isAuthenticated } = get();
        if (!isAuthenticated) return 0;

        if (localProjects.length === 0) {
          set({ migrationComplete: true });
          // Load existing cloud projects
          await get().loadProjects();
          return 0;
        }

        set({ isSyncing: true });
        let migratedCount = 0;

        try {
          for (const project of localProjects) {
            const response = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: project.name,
                description: project.description,
                patterns: project.patterns,
              }),
            });

            if (response.ok) {
              migratedCount++;
            }
          }

          // Clear localStorage after successful migration
          if (migratedCount > 0) {
            clearLocalStorageProjects();
          }

          // Reload projects from cloud
          await get().loadProjects();
          set({ isSyncing: false, migrationComplete: true });
          return migratedCount;
        } catch {
          set({ isSyncing: false, migrationComplete: true });
          return migratedCount;
        }
      },

      clearLocalProjects: () => {
        clearLocalStorageProjects();
      },

      createProject: async (name, description = '') => {
        const { isAuthenticated } = get();
        const now = new Date().toISOString();

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, description }),
            });

            if (response.ok) {
              const project = await response.json();
              set(state => ({
                projects: [...state.projects, project],
                activeProjectId: project.id,
                isSyncing: false,
              }));
              return project;
            }
          } catch {
            // Fall through to local creation
          }
          set({ isSyncing: false });
        }

        // Local creation (anonymous or fallback)
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

      createProjectFromTemplate: async (templateId) => {
        const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return null;

        const { isAuthenticated } = get();
        const now = new Date().toISOString();
        const patterns: ProjectPattern[] = template.patternIds.map(patternId => ({
          patternId,
          status: 'not_started' as ProjectPatternStatus,
          notes: '',
          addedAt: now,
        }));

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: template.name,
                description: template.description,
                patterns: patterns,
              }),
            });

            if (response.ok) {
              const project = await response.json();
              set(state => ({
                projects: [...state.projects, project],
                activeProjectId: project.id,
                isSyncing: false,
              }));
              return project;
            }
          } catch {
            // Fall through to local creation
          }
          set({ isSyncing: false });
        }

        // Local creation (anonymous or fallback)
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

      updateProject: async (id, updates) => {
        const { isAuthenticated } = get();

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch(`/api/projects/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });

            if (response.ok) {
              const updatedProject = await response.json();
              set(state => ({
                projects: state.projects.map(p =>
                  p.id === id ? updatedProject : p
                ),
                isSyncing: false,
              }));
              return;
            }
          } catch {
            // Fall through to local update
          }
          set({ isSyncing: false });
        }

        // Local update
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: async (id) => {
        const { isAuthenticated } = get();

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch(`/api/projects/${id}`, {
              method: 'DELETE',
            });

            if (response.ok) {
              set(state => ({
                projects: state.projects.filter(p => p.id !== id),
                activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
                isSyncing: false,
              }));
              return;
            }
          } catch {
            // Fall through to local delete
          }
          set({ isSyncing: false });
        }

        // Local delete
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      addPattern: async (projectId, patternId) => {
        const { isAuthenticated } = get();
        const project = get().projects.find(p => p.id === projectId);
        if (!project || project.patterns.some(pp => pp.patternId === patternId)) return;

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch(`/api/projects/${projectId}/patterns`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patternId }),
            });

            if (response.ok) {
              const newPattern = await response.json();
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
                isSyncing: false,
              }));
              return;
            }
          } catch {
            // Fall through to local add
          }
          set({ isSyncing: false });
        }

        // Local add
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

      removePattern: async (projectId, patternId) => {
        const { isAuthenticated } = get();

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch(`/api/projects/${projectId}/patterns/${patternId}`, {
              method: 'DELETE',
            });

            if (response.ok) {
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
                isSyncing: false,
              }));
              return;
            }
          } catch {
            // Fall through to local remove
          }
          set({ isSyncing: false });
        }

        // Local remove
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

      updatePatternStatus: async (projectId, patternId, status) => {
        const { isAuthenticated } = get();

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch(`/api/projects/${projectId}/patterns/${patternId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            });

            if (response.ok) {
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
                isSyncing: false,
              }));
              return;
            }
          } catch {
            // Fall through to local update
          }
          set({ isSyncing: false });
        }

        // Local update
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

      updatePatternNotes: async (projectId, patternId, notes) => {
        const { isAuthenticated } = get();

        if (isAuthenticated) {
          set({ isSyncing: true });
          try {
            const response = await fetch(`/api/projects/${projectId}/patterns/${patternId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes }),
            });

            if (response.ok) {
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
                isSyncing: false,
              }));
              return;
            }
          } catch {
            // Fall through to local update
          }
          set({ isSyncing: false });
        }

        // Local update
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
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist when not authenticated
      partialize: (state) => {
        if (state.isAuthenticated) {
          // Don't persist projects to localStorage when authenticated
          return {
            activeProjectId: state.activeProjectId,
            isAuthenticated: false,
            isLoading: false,
            isSyncing: false,
            migrationComplete: state.migrationComplete,
            projects: [],
          };
        }
        return {
          projects: state.projects,
          activeProjectId: state.activeProjectId,
        };
      },
    }
  )
);
