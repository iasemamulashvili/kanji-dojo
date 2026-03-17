import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const character = searchParams.get('character') || '⛩️';
    const meanings = searchParams.get('meanings') || 'Kanji Dojo';
    const onyomi = searchParams.get('onyomi') || '';
    const kunyomi = searchParams.get('kunyomi') || '';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f4f1ea',
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")',
            color: '#1a1a1a',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: 300,
              fontWeight: 'bold',
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            {character}
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              marginBottom: 20,
              textTransform: 'capitalize',
              color: '#9b2c2c', // cinnabar
            }}
          >
            {meanings}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '40px',
              fontSize: 40,
              color: '#828e70', // sage
            }}
          >
            {onyomi && <span>{onyomi}</span>}
            {kunyomi && <span>{kunyomi}</span>}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Error generating OG image', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
