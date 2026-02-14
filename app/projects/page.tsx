'use client';

import { useState } from 'react';
import { useProjectStore, PROJECT_TEMPLATES } from '@/store/useProjectStore';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetail } from '@/components/projects/ProjectDetail';

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
    exportProject,
  } = useProjectStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    createProject(newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setShowNewForm(false);
  };

  const handleExport = () => {
    if (!activeProjectId) return;
    const data = exportProject(activeProjectId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject?.name || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-page mx-auto px-4 md:px-6 py-8 md:py-12">
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
                onClick={() => setShowNewForm(true)}
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
              onRemovePattern={(patternId) =>
                removePattern(activeProject.id, patternId)
              }
              onAddPattern={(patternId) =>
                addPattern(activeProject.id, patternId)
              }
              onExport={handleExport}
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
                      onClick={() => createProjectFromTemplate(template.id)}
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
                  onClick={() => setShowNewForm(true)}
                  className="btn btn-secondary"
                >
                  Create Blank Project
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
