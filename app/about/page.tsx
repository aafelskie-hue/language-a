import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Language A — 254 original design patterns extending Alexander\'s methodology into climate adaptation, remote work, housing diversity, and cold-climate construction.',
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
              Alexander&apos;s patterns were drawn from buildings and towns as they existed in 1977. The world has changed. Cold climates demand different envelopes. Remote work has reshuffled the relationship between dwelling and street. A generation of research into biophilia, thermal comfort, and acoustic privacy has sharpened what we know about how buildings affect the people inside them. Housing diversity, climate resilience, aging in place, digital infrastructure — these forces were peripheral in 1977. They&apos;re central now.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              The Language
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Language A extends Alexander&apos;s methodology to 254 original patterns, organized across three scales:
            </p>
            <p className="text-slate leading-relaxed mb-6">
              <strong>Neighborhood</strong> — the patterns that shape settlements: density gradients, street networks, fifteen-minute walkability, flood resilience, community governance, children&apos;s territory, food systems. These are the decisions that happen before a single building is designed, and they constrain everything that follows.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              <strong>Building</strong> — the patterns that shape the spaces people inhabit: light on two sides, prospect and refuge, the courtyard house, the home office threshold, aging-in-place suites, shared gardens, accessible bathrooms. This is where human experience meets architectural form.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              <strong>Construction</strong> — this is where the language gets its hands dirty. How do you keep pipes from freezing in Edmonton? Where does thermal mass go, and how much do you need? What makes a rainscreen assembly work at &minus;35&deg;C? Construction patterns deal in freeze-proof plumbing, passive ventilation, embodied carbon, visible utilities — the craft decisions that determine whether a building lasts thirty years or three hundred.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              These three scales are organized into nineteen categories — from <em>Patterns for the Fifteen-Minute Life</em> to <em>Patterns for Sound and Silence</em> — with 3,084 verified bidirectional connections linking them into a single network. Patterns don&apos;t exist in isolation. They reinforce each other, resolve each other&apos;s tensions, and form clusters that are stronger than any individual recommendation.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Confidence Ratings
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Not every pattern carries the same weight of evidence. Each of the 254 patterns is assigned a confidence rating:
            </p>
            <p className="text-slate leading-relaxed mb-4">
              <strong>★★ High Confidence</strong> — strong empirical evidence, well-tested in practice, broadly applicable. These are patterns you can design with conviction.
            </p>
            <p className="text-slate leading-relaxed mb-4">
              <strong>★ Moderate Confidence</strong> — solid reasoning and emerging evidence, but less extensively tested. Sound recommendations that deserve professional judgment in application.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              <strong>☆ Emerging</strong> — promising patterns with thinner evidence bases. Worth considering, worth watching, but the design specifics are less settled. These are the frontier of the language — the places where practice is still catching up to principle.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              The confidence system exists because honest calibration builds more trust than false certainty. A pattern language that treats every recommendation as equally proven isn&apos;t being careful — it&apos;s being careless.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              The AI Pattern Guide
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Language A includes an AI-powered design partner that works from the full text of every pattern it recommends. Describe a project, ask about a pattern, or bring a design challenge — the Guide applies patterns to your specific situation, explains the forces at play, shows how patterns connect to each other, and tells you honestly where the language has gaps.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              The Guide is not a search engine for patterns. It reads, reasons, and responds with spatial-first intelligence: what the space feels like when patterns are working, before explaining the mechanics of why.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Methodology
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Every pattern follows Alexander&apos;s original structure: a recurring problem, the forces that create it, and a spatial resolution that resolves those forces. The test is simple: if the resolution can&apos;t be drawn or built — if it&apos;s a policy recommendation, an organizational process, or an abstract principle — it isn&apos;t a pattern.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              Patterns describe what to build and why the forces demand that particular shape. The evidence comes from built precedent, peer-reviewed research, climate science, and field observation. Where evidence is thin, the confidence rating says so.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Editorial Voice
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Sylvie Marchetti is the editorial voice of Language A. She shaped every one of the 254 patterns with a single standard: clarity as generosity. A pattern should make the reader see something they&apos;ve always looked at but never quite understood — thermal mass, solar geometry, the social dynamics of a street corner. A sloppy pattern is worse than no pattern, because it teaches people to distrust the framework.
            </p>
            <p className="text-slate leading-relaxed mb-6">
              The paradox of Language A is her paradox: it works as an intellectual contribution precisely because it isn&apos;t optimized as a product. The patterns are free, ungated, and complete. The AI Pattern Guide earns its keep by applying them to your specific situation — your climate, your site, your constraints. The knowledge is the gift. The application is the service.
            </p>

            <h2 className="text-xl font-bold text-charcoal tracking-tight mt-10 mb-4">
              Contact
            </h2>
            <p className="text-slate leading-relaxed mb-2">
              <a href="mailto:sylvie@language-a.com" className="text-copper hover:underline">
                sylvie@language-a.com
              </a>
              {' '}— editorial
            </p>
            <p className="text-slate leading-relaxed mb-6">
              <a href="mailto:hello@language-a.com" className="text-copper hover:underline">
                hello@language-a.com
              </a>
              {' '}— general inquiries
            </p>
            <p className="text-slate leading-relaxed">
              Language A is built by{' '}
              <a href="https://beachheadsystems.ca" className="text-copper hover:underline" target="_blank" rel="noopener noreferrer">
                Beachhead Systems
              </a>
              , a domain intelligence company in Edmonton, Alberta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
