'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProjectStore, PROJECT_TEMPLATES } from '@/store/useProjectStore';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetail } from '@/components/projects/ProjectDetail';
import { SignInGate } from '@/components/projects/SignInGate';

export default function ProjectsPage() {
  const {
    projects,
    activeProjectId,
    createProject,
    createProjectFromTemplate,
    deleteProject,
    setActiveProject,
    addPattern,
    removePattern,
    updatePatternStatus,
    updatePatternNotes,
    updateProject,
    exportProject,
    isLoading,
    isSyncing,
  } = useProjectStore();

  const { data: session } = useSession();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showSignInGate, setShowSignInGate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    createProject(newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setShowNewForm(false);
  };

  const handleExportMarkdown = () => {
    if (!activeProjectId) return;
    const data = exportProject(activeProjectId);
    const blob = new Blob([data], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = (activeProject?.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.download = `${slug}-language-a.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!activeProjectId) return;

    if (!session?.user) {
      setShowSignInGate(true);
      return;
    }

    setIsPdfExporting(true);
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/export/pdf`, {
        method: 'POST',
      });

      if (response.status === 401) {
        setShowSignInGate(true);
        return;
      }

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = (activeProject?.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.download = `${slug}-language-a.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail — user sees loading state end
    } finally {
      setIsPdfExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-slate">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Syncing indicator */}
      {isSyncing && (
        <div className="fixed top-16 right-4 z-40 bg-charcoal/90 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Saving...</span>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-3">
          Build Your Pattern Language
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-3">
          Projects
        </h1>
        <p className="text-slate max-w-2xl">
          Create projects to collect and track patterns for your design work.
          Mark patterns as applied, add notes, and export your selections.
        </p>
      </header>

      <div className="lg:flex lg:gap-8">
        {/* Sidebar - Project List */}
        <aside className="lg:w-80 flex-shrink-0 mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-xs uppercase tracking-widest text-steel">
                Your Projects
              </h2>
              <button
                onClick={() => session?.user ? setShowNewForm(true) : setShowSignInGate(true)}
                className="btn btn-primary text-sm"
              >
                + New
              </button>
            </div>

            {/* New Project Form */}
            {showNewForm && (
              <form onSubmit={handleCreate} className="card mb-4">
                <h3 className="font-medium text-charcoal mb-3">New Project</h3>
                <input
                  type="text"
                  placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mb-3"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full h-20 mb-3 resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              onSelect={setActiveProject}
              onDelete={deleteProject}
            />
          </div>
        </aside>

        {/* Main - Project Detail */}
        <main className="flex-1">
          {activeProject ? (
            <ProjectDetail
              project={activeProject}
              onUpdateStatus={(patternId, status) =>
                updatePatternStatus(activeProject.id, patternId, status)
              }
              onUpdateNotes={(patternId, notes) =>
                updatePatternNotes(activeProject.id, patternId, notes)
              }
              onUpdateDescription={(description) =>
                updateProject(activeProject.id, { description })
              }
              onRemovePattern={(patternId) =>
                removePattern(activeProject.id, patternId)
              }
              onAddPattern={(patternId) =>
                addPattern(activeProject.id, patternId)
              }
              onExportMarkdown={handleExportMarkdown}
              onExportPdf={handleExportPdf}
              isPdfExporting={isPdfExporting}
            />
          ) : (
            <div>
              {/* Templates Section */}
              <div className="mb-12">
                <h2 className="font-mono text-xs uppercase tracking-widest text-copper mb-4">
                  Start with a Template
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {PROJECT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => session?.user ? createProjectFromTemplate(template.id) : setShowSignInGate(true)}
                      className="card card-hover text-left group"
                    >
                      <h3 className="font-semibold text-charcoal group-hover:text-copper transition-colors mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate mb-3">
                        {template.description}
                      </p>
                      <p className="font-mono text-xs text-copper">
                        {template.patternIds.length} patterns included →
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Empty State */}
              <div className="text-center py-12 border-t border-slate/10">
                <p className="text-slate mb-4">
                  Or start from scratch with a blank project.
                </p>
                <button
                  onClick={() => session?.user ? setShowNewForm(true) : setShowSignInGate(true)}
                  className="btn btn-secondary"
                >
                  Create Blank Project
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showSignInGate && (
        <SignInGate onDismiss={() => setShowSignInGate(false)} />
      )}
    </div>
  );
}
