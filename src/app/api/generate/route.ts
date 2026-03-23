import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  'SaaS, KI-Tool, RegTech',
  'B2B, Marketplace, FinTech',
  'HealthTech, EdTech, B2C',
];

async function generateBatch(
  batchIndex: number,
  categories: string,
  likedContext: string,
  startId: number
): Promise<object[]> {
  const personalization = likedContext
    ? `Nutzer mag: ${likedContext}. Ähnliche Richtung bevorzugen.\n`
    : '';

  const ids = Array.from({ length: 10 }, (_, i) => `"idea-${startId + i}"`).join(', ');

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `${personalization}Generiere genau 10 Business-Ideen für den Schweizer Markt 2026.
Fokus: Schweiz-spezifische Probleme, Schweizer KMUs, Schweizer Regulierung (FINMA, DSG), Preise in CHF.
Kategorien für diesen Batch: ${categories}
IDs verwenden: ${ids}

Wichtig für den Titel: Kein abstrakter Produktname. Der Titel soll sofort klar machen was die Idee löst. Format: "Was es tut — für wen". Beispiele: "FINMA-Compliance-Autopilot für KMUs", "KI-Buchhaltung für Schweizer Freelancer", "Mietkaution ohne Bankkonto für Expats".

Nur JSON-Array, kein Text davor/danach:
[{"id":"idea-${startId}","title":"...","tagline":"...","problem":"...","solution":"...","market":"...","score":85,"category":"SaaS","regions":["Schweiz"],"mvp_weeks":8,"competitors":["..."],"why_now":"..."}]`
    }]
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const likedIdeas: { title: string; category: string }[] = body.likedIdeas || [];
    const likedContext = likedIdeas.slice(0, 8).map(i => `${i.title} (${i.category})`).join(', ');

    // 3 Batches parallel
    const [batch1, batch2, batch3] = await Promise.all([
      generateBatch(0, CATEGORIES[0], likedContext, 1),
      generateBatch(1, CATEGORIES[1], likedContext, 11),
      generateBatch(2, CATEGORIES[2], likedContext, 21),
    ]);

    const ideas = [...batch1, ...batch2, ...batch3];

    if (ideas.length === 0) {
      return NextResponse.json({ error: 'Keine Ideen generiert' }, { status: 500 });
    }

    return NextResponse.json({ ideas });
  } catch (err) {
    console.error('[generate]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
