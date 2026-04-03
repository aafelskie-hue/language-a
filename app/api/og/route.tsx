import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n1iIq131nj-o.woff',
  ).then((res) => res.arrayBuffer());

  const dmSansBoldData = await fetch(
    'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAKOlxSQ.woff',
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#faf7f4',
          padding: '60px 72px',
          fontFamily: '"DM Sans"',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: '"IBM Plex Mono"',
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '4px',
            color: '#b5734a',
            textTransform: 'uppercase' as const,
            marginBottom: '32px',
          }}
        >
          LANGUAGE A
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.2,
            textAlign: 'center',
            fontFamily: '"DM Sans"',
            maxWidth: '800px',
          }}
        >
          254 design patterns for enduring places
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#6B7280',
            marginTop: '24px',
            fontFamily: '"DM Sans"',
          }}
        >
          Neighborhood &middot; Building &middot; Construction
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
          data: dmSansBoldData,
          style: 'normal',
          weight: 700,
        },
      ],
    },
  );
}
