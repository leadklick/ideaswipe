-- Einmal im Supabase SQL Editor ausführen

create table if not exists saved_ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  idea        jsonb not null,
  created_at  timestamptz default now()
);

-- Unique Index separat (PostgreSQL-konform)
create unique index if not exists saved_ideas_user_idea_idx
  on saved_ideas (user_id, (idea->>'id'));

-- Nur der eigene User darf seine Ideen sehen/schreiben
alter table saved_ideas enable row level security;

create policy "Eigene Ideen lesen"
  on saved_ideas for select
  using (auth.uid() = user_id);

create policy "Eigene Ideen speichern"
  on saved_ideas for insert
  with check (auth.uid() = user_id);

create policy "Eigene Ideen löschen"
  on saved_ideas for delete
  using (auth.uid() = user_id);
