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
  categories: string,
  likedContext: string,
  startId: number
): Promise<object[]> {
  const personalization = likedContext
    ? `Nutzer mag: ${likedContext}. Ähnliche Richtung bevorzugen.\n`
    : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `${personalization}Generiere genau 10 Business-Ideen für den Schweizer Markt 2026.
Fokus: Schweizer KMUs, Regulierung (FINMA, DSG), Preise in CHF.
Kategorien: ${categories}

Titel-Regel: Kein Produktname. Direkt beschreiben was es löst und für wen. Beispiel: "FINMA-Compliance-Autopilot für KMUs".

WICHTIG: Nur genau diese 10 Felder pro Idee, keine zusätzlichen:
id, title, tagline, problem, solution, market, score, category, regions, mvp_weeks, competitors, why_now

IDs: idea-${startId} bis idea-${startId + 9}
Felder kurz halten (max 2 Sätze pro Textfeld).

Nur JSON-Array zurückgeben, kein Text davor oder danach, kein Markdown:
[{"id":"idea-${startId}","title":"...","tagline":"...","problem":"...","solution":"...","market":"...","score":82,"category":"SaaS","regions":["Schweiz"],"mvp_weeks":8,"competitors":["Konkurrent"],"why_now":"..."}]`
    }]
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const ideas = JSON.parse(match[0]);
    // Nur erlaubte Felder durchlassen
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
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const likedIdeas: { title: string; category: string }[] = body.likedIdeas || [];
    const likedContext = likedIdeas.slice(0, 8).map(i => `${i.title} (${i.category})`).join(', ');

    const [batch1, batch2, batch3] = await Promise.all([
      generateBatch(CATEGORIES[0], likedContext, 1),
      generateBatch(CATEGORIES[1], likedContext, 11),
      generateBatch(CATEGORIES[2], likedContext, 21),
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
