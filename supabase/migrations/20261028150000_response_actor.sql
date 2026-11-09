-- Migration 9: record who gave the first answer on an item.
-- protect_response_columns() stamps updated_by on update only; an insert kept whatever the client sent
-- (nothing, from the app). The signed-in user wins; without a session (SQL editor, seeds) the given value stays.

create or replace function public.stamp_response_actor()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

create trigger trg_stamp_response_actor before insert on public.item_responses
  for each row execute function public.stamp_response_actor();
