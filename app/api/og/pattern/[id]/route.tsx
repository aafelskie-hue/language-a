import { ImageResponse } from 'next/og';
import { getPatternByReadingOrder, getConfidenceStars } from '@/lib/patterns';

export const runtime = 'edge';

const SCALE_COLORS: Record<string, string> = {
  neighborhood: '#8B9E82',
  building: '#C49A3C',
  construction: '#6B7B8E',
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const readingOrder = parseInt(params.id, 10);
  const pattern = getPatternByReadingOrder(readingOrder);

  if (!pattern) {
    return new Response('Pattern not found', { status: 404 });
  }

  // Load IBM Plex Mono font for the branding
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n1iIq131nj-o.woff',
  ).then((res) => res.arrayBuffer());

  // Load DM Sans for body text
  const dmSansData = await fetch(
    'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwA_opxSQ.woff',
  ).then((res) => res.arrayBuffer());

  const dmSansBoldData = await fetch(
    'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAKOlxSQ.woff',
  ).then((res) => res.arrayBuffer());

  const confidence = getConfidenceStars(pattern.confidence);
  const scaleColor = SCALE_COLORS[pattern.scale] || '#6B7B8E';

  // Truncate problem to first sentence, max ~120 chars
  const firstSentence = pattern.problem.split(/(?<=[.!?])\s/)[0] || pattern.problem;
  const truncatedProblem = firstSentence.length > 120
    ? firstSentence.slice(0, 117) + '...'
    : firstSentence;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#faf7f4',
          padding: '60px 72px',
          fontFamily: '"DM Sans"',
        }}
      >
        {/* Top: branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontFamily: '"IBM Plex Mono"',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '3px',
            color: '#b5734a',
            textTransform: 'uppercase' as const,
          }}
        >
          LANGUAGE A
        </div>

        {/* Center: pattern info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 400,
              color: '#2C2C2C',
              lineHeight: 1,
              fontFamily: '"DM Sans"',
            }}
          >
            {pattern.reading_order}
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.15,
              fontFamily: '"DM Sans"',
            }}
          >
            {pattern.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase' as const,
                color: scaleColor,
                fontFamily: '"IBM Plex Mono"',
              }}
            >
              {pattern.scale}
            </div>
            <div style={{ fontSize: 18, color: '#b5734a' }}>{confidence}</div>
          </div>
        </div>

        {/* Bottom: problem sentence */}
        <div
          style={{
            fontSize: 20,
            color: '#6B7280',
            lineHeight: 1.5,
            fontFamily: '"DM Sans"',
          }}
        >
          {truncatedProblem}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'IBM Plex Mono',
          data: fontData,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'DM Sans',
          data: dmSansData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: dmSansBoldData,
          style: 'normal',
          weight: 700,
        },
      ],
    },
  );
}
