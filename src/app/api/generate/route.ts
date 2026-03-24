import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  'SaaS, KI-Tool, RegTech',
  'B2B, Marketplace, FinTech',
  'HealthTech, EdTech, B2C',
];

async function generateBatch(categories: string, likedContext: string, startId: number): Promise<object[]> {
  const personalization = likedContext ? `Nutzer mag: ${likedContext}. Ähnliche Richtung bevorzugen.\n` : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `${personalization}Generiere genau 10 Business-Ideen für den Schweizer Markt 2026.
Fokus: Schweizer KMUs, Regulierung (FINMA, DSG), Preise in CHF.
Kategorien: ${categories}

Titel-Regel: Kein Produktname. Direkt beschreiben was es löst und für wen.

WICHTIG: Nur genau diese Felder, keine zusätzlichen:
id, title, tagline, problem, solution, market, score, category, regions, mvp_weeks, competitors, why_now

IDs: idea-${startId} bis idea-${startId + 9}
Felder kurz halten (max 2 Sätze).

Nur JSON-Array, kein Text, kein Markdown:
[{"id":"idea-${startId}","title":"...","tagline":"...","problem":"...","solution":"...","market":"...","score":82,"category":"SaaS","regions":["Schweiz"],"mvp_weeks":8,"competitors":["x"],"why_now":"..."}]`
    }]
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
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
  const body = await req.json();
  const likedIdeas: { title: string; category: string }[] = body.likedIdeas || [];
  const likedContext = likedIdeas.slice(0, 8).map((i: { title: string; category: string }) => `${i.title} (${i.category})`).join(', ');

  // Streaming Response — sendet jeden Batch sobald er fertig ist
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        // 3 Batches parallel starten
        const promises = [
          generateBatch(CATEGORIES[0], likedContext, 1),
          generateBatch(CATEGORIES[1], likedContext, 11),
          generateBatch(CATEGORIES[2], likedContext, 21),
        ];

        // Jeden Batch sofort senden wenn fertig
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
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
    },
  });
}
