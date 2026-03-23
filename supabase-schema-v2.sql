-- Schema V2: Kein Supabase Auth mehr, einfache Tabelle

-- Alte Tabelle löschen falls vorhanden
drop table if exists saved_ideas cascade;

-- Neu ohne auth.users Referenz
create table saved_ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  idea        jsonb not null,
  created_at  timestamptz default now()
);

create unique index saved_ideas_user_idea_idx
  on saved_ideas (user_id, (idea->>'id'));

-- RLS deaktiviert (Service Role Key wird verwendet)
alter table saved_ideas disable row level security;
