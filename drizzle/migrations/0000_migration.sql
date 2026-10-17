create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account ever created becomes the admin; later sign-ups get no access.
create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.grant_first_admin();

create table public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  mobile text not null,
  address_line text not null,
  landmark text,
  locality text not null,
  pincode text not null,
  slot_date date not null,
  slot_time text not null,
  brand text not null,
  model text not null,
  variant text not null,
  base_value numeric not null,
  estimate numeric not null,
  answers jsonb not null,
  answer_summary text[] not null default '{}',
  status text not null default 'new',
  assigned_to text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.pickup_requests to authenticated;
grant all on public.pickup_requests to service_role;
alter table public.pickup_requests enable row level security;
create policy "admins read requests" on public.pickup_requests for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins update requests" on public.pickup_requests for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create index pickup_requests_slot on public.pickup_requests (slot_date, slot_time);