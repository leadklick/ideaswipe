import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';

  // Test if we can make a fetch to Anthropic
  let fetchTest = 'not_tested';
  if (apiKey) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }),
      });
      fetchTest = `ok:${r.status}`;
    } catch (e) {
      fetchTest = `error:${String(e)}`;
    }
  }

  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    anthropic: apiKey ? 'SET' : 'MISSING',
    anthropic_len: apiKey.length,
    anthropic_start: apiKey.substring(0, 8),
    fetch_test: fetchTest,
  });
}
