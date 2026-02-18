import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pattern Review Consulting',
  description: 'Beachhead Systems offers pattern review consulting for architects, developers, planners, and homeowners applying Language A to real projects.',
};

export default function ConsultPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-navy-deep text-white">
        <div className="max-w-page mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-copper-light mb-4">
              Pattern Review Consulting
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Apply the patterns to your project
            </h1>
            <p className="text-lg text-silver leading-relaxed">
              Language A describes the forces that shape good places. But reading about forces and resolving them in a specific building, on a specific site, with a specific budget — that&apos;s where the work gets interesting.
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-white border-b border-slate/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-slate leading-relaxed">
              Beachhead Systems offers pattern review consulting for architects, developers, planners, and homeowners who want to apply Language A&apos;s design thinking to a real project.
            </p>
          </div>
        </div>
      </section>

      {/* What a pattern review looks like */}
      <section className="bg-surface-warm border-b border-slate/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
              The Process
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight mb-6">
              What a pattern review looks like
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              You send us your project — plans, site photos, a design brief, whatever you have. We read it through the lens of the pattern language and write back with three things: which patterns your project already honors (and why that matters), which patterns are being missed or violated (and what that costs you in livability, durability, or delight), and which connections between patterns could make the whole design stronger.
            </p>
            <p className="text-slate leading-relaxed">
              The review is written by the same team that built Language A. It is specific to your project, grounded in the same forces the patterns describe, and structured to be useful — not academic.
            </p>
          </div>
        </div>
      </section>

      {/* Scope and pricing */}
      <section className="bg-white border-b border-slate/10">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
              Investment
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-charcoal tracking-tight mb-6">
              Scope and pricing
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Reviews range from $500 to $2,000 depending on project complexity and scope.
            </p>
            <p className="text-slate leading-relaxed">
              A single-room renovation — a home office, a kitchen, a bedroom — is typically at the lower end. A full-building design or a neighborhood-scale planning project is at the upper end. We will confirm scope and cost before any work begins.
            </p>
          </div>
        </div>
      </section>

      {/* Get in touch */}
      <section className="bg-navy-deep text-white">
        <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-copper-light mb-4">
              Start a Conversation
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
              Get in touch
            </h2>
            <p className="text-silver leading-relaxed mb-8">
              Describe your project in a few sentences and we will tell you whether a pattern review is a good fit.
            </p>
            <a
              href="mailto:andrew@beachhead-systems.com"
              className="inline-flex items-center gap-2 btn bg-copper hover:bg-copper-dark text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              andrew@beachhead-systems.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
