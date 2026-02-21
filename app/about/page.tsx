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

            <p className="text-slate leading-relaxed mt-10 mb-8">
              <strong>Sylvie Marchetti</strong> is the editorial voice of Language A.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Contact
            </h2>
            <p className="text-slate leading-relaxed">
              <a href="mailto:sylvie@language-a.com" className="text-copper hover:underline">
                sylvie@language-a.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
