import { NextResponse } from 'next/server';

export async function GET() {
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    supabase_anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    supabase_service: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
    hash_first10: hash.substring(0, 10),
    hash_length: hash.length,
  });
}
