import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Language A and the team behind it',
};

export default function AboutPage() {
  return (
    <div className="bg-surface-warm min-h-screen">
      <div className="max-w-page mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-copper mb-4">
            About
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal tracking-tight mb-8">
            About Language A
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate leading-relaxed mb-6">
              Christopher Alexander spent a career studying why some places feel alive and others don&apos;t. His answer, in 1977, was a catalog of 253 patterns — recurring spatial relationships that, when woven together, tend to produce environments where people actually want to be. A sunlit alcove. A transition between public street and private threshold. The particular geometry of a staircase that invites you to pause.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              Alexander&apos;s patterns were drawn from buildings and towns as they existed in 1977. The world has changed. Cold climates demand different envelopes. Remote work has reshuffled the relationship between dwelling and street. A generation of research into biophilia, thermal comfort, and acoustic privacy has sharpened what we know about how buildings affect the people inside them.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              Language A extends the original work to 254 patterns. The new patterns follow Alexander&apos;s methodology — problem, forces, resolution — and are calibrated to contemporary contexts: cold-climate construction, housing diversity, climate resilience, the social dynamics of density. They sit alongside the original 253 rather than replacing them. The language grew; it didn&apos;t break.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Who made it
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Language A is a project of{' '}
              <a
                href="https://beachheadsystems.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:underline"
              >
                Beachhead Systems
              </a>
              , a structural engineering firm based in Edmonton, Alberta. We spend our working days understanding why structures hold — or don&apos;t. That work has made us careful readers of the built environment: attentive to the forces acting on a place, skeptical of resolutions that ignore them.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              Pattern thinking is, in some ways, what structural engineers do anyway. You identify a recurring problem — a beam-column connection, a thermal bridge, a load path that nobody drew. You understand the forces. You develop a resolution that handles them. Language A is an attempt to do that for the places people actually inhabit, at every scale from the street corner to the window seat.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              The intellectual contribution is free. The patterns are published, open, and will stay that way. If you want to go deeper — to apply the language to a specific project, review a design through its lens, or understand how the patterns interact — we&apos;re available as consultants. That&apos;s the deal.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Contact
            </h2>
            <p className="text-slate leading-relaxed mb-2">
              <a href="mailto:hello@language-a.com" className="text-copper hover:underline">
                hello@language-a.com
              </a>
            </p>
            <p className="text-slate leading-relaxed">
              <a
                href="https://beachheadsystems.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:underline"
              >
                Beachhead Systems
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
