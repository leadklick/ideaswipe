import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();
  const { data } = await supabase
    .from('saved_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idea } = await req.json();
  const supabase = createServerClient();

  // Erst prüfen ob bereits gespeichert
  const { data: existing } = await supabase
    .from('saved_ideas')
    .select('id')
    .eq('user_id', userId)
    .eq('idea->>id', idea.id)
    .single();

  if (!existing) {
    await supabase.from('saved_ideas').insert({ user_id: userId, idea });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ideaId } = await req.json();
  const supabase = createServerClient();

  await supabase
    .from('saved_ideas')
    .delete()
    .eq('user_id', userId)
    .eq('idea->>id', ideaId);

  return NextResponse.json({ ok: true });
}
