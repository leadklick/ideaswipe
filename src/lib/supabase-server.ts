import { createClient } from '@supabase/supabase-js';

function clean(val: string | undefined) {
  return (val || '').replace(/\s/g, '');
}

export function createServerClient() {
  return createClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
