-- Auto-create profile row when a user signs up via Supabase Auth.
-- Also creates their default watchlist.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.watchlists (user_id, name) values (new.id, 'マイリスト');
  return new;
end;
$$;

-- Trigger fires after each new auth.users row
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Allow service role to insert into ai_insights (for batch generation)
create policy "service insert" on ai_insights
  for insert with check (true);
