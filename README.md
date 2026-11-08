# Vistula Task Manager

Simple Task Manager built with HTML, CSS and JavaScript, using a Supabase (PostgreSQL) database and its auto-generated REST API.

- **Student ID:** 74294
- **Repository:** https://github.com/vistula-team-project-74294/vistula-task-manager
- **Live app:** https://vistula-team-project-74294.github.io/vistula-task-manager/

## Features
Display, add, edit, complete/incomplete and delete tasks. All changes are stored in Supabase.

## Files
`index.html`, `app.js`, `config.json` (public Supabase URL and publishable key only), `contribution.html` and `contribution.json` (added by my partner via Pull Request).

## Database setup (Supabase SQL editor)
```sql
create table tasks (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  completed boolean default false
);

alter table tasks enable row level security;

create policy "public read"   on tasks for select using (true);
create policy "public insert" on tasks for insert with check (true);
create policy "public update" on tasks for update using (true) with check (true);
create policy "public delete" on tasks for delete using (true);
```
