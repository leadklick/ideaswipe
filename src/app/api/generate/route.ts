import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const CATEGORIES = [
  'SaaS, KI-Tool, RegTech',
  'B2B, Marketplace, FinTech',
  'HealthTech, EdTech, B2C',
];

async function generateBatch(categories: string, likedContext: string, startId: number, apiKey: string): Promise<object[]> {
  const personalization = likedContext ? `Nutzer mag: ${likedContext}. Ähnliche Richtung bevorzugen.\n` : '';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{
        role: 'user',
        content: `${personalization}Generiere genau 10 Business-Ideen für den Schweizer Markt 2026.
Fokus: Schweizer KMUs, Regulierung (FINMA, DSG), Preise in CHF.
Sprache: Schweizerdeutsch – kein ß, immer ss schreiben (z.B. "Strasse" statt "Straße", "Busse" statt "Bußgelder").
Kategorien: ${categories}

Titel-Regel: Kein Produktname. Direkt beschreiben was es löst und für wen.

WICHTIG: Nur genau diese Felder, keine zusätzlichen:
id, title, tagline, problem, solution, market, score, category, regions, mvp_weeks, competitors, why_now

IDs: idea-${startId} bis idea-${startId + 9}
Felder kurz halten (max 2 Sätze).

Nur JSON-Array, kein Text, kein Markdown:
[{"id":"idea-${startId}","title":"...","tagline":"...","problem":"...","solution":"...","market":"...","score":82,"category":"SaaS","regions":["Schweiz"],"mvp_weeks":8,"competitors":["x"],"why_now":"..."}]`
      }]
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const text = data.content[0]?.type === 'text' ? data.content[0].text : '[]';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const ideas = JSON.parse(match[0]);
    return ideas.map((idea: Record<string, unknown>, i: number) => ({
      id: idea.id || `idea-${startId + i}`,
      title: idea.title || '',
      tagline: idea.tagline || '',
      problem: idea.problem || '',
      solution: idea.solution || '',
      market: idea.market || '',
      score: idea.score || 80,
      category: idea.category || 'SaaS',
      regions: idea.regions || ['Schweiz'],
      mvp_weeks: idea.mvp_weeks || 8,
      competitors: idea.competitors || [],
      why_now: idea.why_now || '',
    }));
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const likedIdeas: { title: string; category: string }[] = body.likedIdeas || [];
  const likedContext = likedIdeas.slice(0, 8).map((i: { title: string; category: string }) => `${i.title} (${i.category})`).join(', ');

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        const promises = [
          generateBatch(CATEGORIES[0], likedContext, 1, apiKey),
          generateBatch(CATEGORIES[1], likedContext, 11, apiKey),
          generateBatch(CATEGORIES[2], likedContext, 21, apiKey),
        ];

        await Promise.all(promises.map(async (p, i) => {
          const ideas = await p;
          if (ideas.length > 0) {
            send({ batch: i + 1, ideas });
          }
        }));
      } catch (err) {
        send({ error: String(err) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
