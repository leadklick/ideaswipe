import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { idea, userId } = await req.json();
    const supabase = createServerClient();

    const { error } = await supabase
      .from('saved_ideas')
      .upsert({ user_id: userId, idea }, { onConflict: 'user_id,idea->>id' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[save]', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ideaId, userId } = await req.json();
    const supabase = createServerClient();

    const { error } = await supabase
      .from('saved_ideas')
      .delete()
      .eq('user_id', userId)
      .eq('idea->>id', ideaId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[delete]', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
