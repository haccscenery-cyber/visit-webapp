-- Run this file in Supabase Dashboard > SQL Editor.
-- It creates the schema, fixed report items, roles, Row Level Security, and a safe save RPC.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('receptionist', 'accountant', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('waiting_accounting', 'pending_send', 'sending', 'sent', 'failed', 'revised_pending_resend');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ผู้ใช้งานใหม่',
  role public.app_role not null default 'receptionist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_items (
  code text primary key,
  display_name text not null,
  sort_order smallint not null unique,
  item_group text not null check (item_group in ('farm', 'resort')),
  entry_owner public.app_role not null check (entry_owner in ('receptionist', 'accountant'))
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  status public.report_status not null default 'waiting_accounting',
  note text,
  reception_saved_by uuid references public.profiles(id),
  reception_saved_at timestamptz,
  accounting_saved_by uuid references public.profiles(id),
  accounting_saved_at timestamptz,
  sent_at timestamptz,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_entries (
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  item_code text not null references public.report_items(code),
  quantity integer not null default 0 check (quantity >= 0),
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (report_id, item_code)
);

create table if not exists public.report_versions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  payload jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (report_id, version_no)
);

create table if not exists public.line_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  report_version_id uuid references public.report_versions(id) on delete set null,
  status text not null check (status in ('sent', 'failed')),
  destination text not null,
  line_request_id text,
  error_message text,
  sent_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.daily_reports(id) on delete set null,
  reminder_date date not null,
  destination text not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (report_id, reminder_date, destination)
);

create index if not exists daily_reports_report_date_idx on public.daily_reports(report_date);
create index if not exists report_entries_report_id_idx on public.report_entries(report_id);
create index if not exists line_delivery_logs_report_id_idx on public.line_delivery_logs(report_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists daily_reports_touch_updated_at on public.daily_reports;
create trigger daily_reports_touch_updated_at before update on public.daily_reports for each row execute function public.touch_updated_at();

-- Create a profile automatically for users created in Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'ผู้ใช้งานใหม่'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_accountant_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('accountant', 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.report_items enable row level security;
alter table public.daily_reports enable row level security;
alter table public.report_entries enable row level security;
alter table public.report_versions enable row level security;
alter table public.line_delivery_logs enable row level security;
alter table public.reminder_logs enable row level security;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select to authenticated
using (id = auth.uid() or public.current_app_role() = 'admin');

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles for update to authenticated
using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

drop policy if exists "Authenticated users can view report items" on public.report_items;
create policy "Authenticated users can view report items" on public.report_items for select to authenticated using (true);

drop policy if exists "Authenticated users can view reports" on public.daily_reports;
create policy "Authenticated users can view reports" on public.daily_reports for select to authenticated using (true);

drop policy if exists "Authenticated users can view entries" on public.report_entries;
create policy "Authenticated users can view entries" on public.report_entries for select to authenticated using (true);

drop policy if exists "Authenticated users can view report versions" on public.report_versions;
create policy "Authenticated users can view report versions" on public.report_versions for select to authenticated using (true);

drop policy if exists "Authenticated users can view LINE history" on public.line_delivery_logs;
create policy "Authenticated users can view LINE history" on public.line_delivery_logs for select to authenticated using (true);

drop policy if exists "Accountants can view reminder history" on public.reminder_logs;
create policy "Accountants can view reminder history" on public.reminder_logs for select to authenticated using (public.is_accountant_or_admin());

-- Data changes are intentionally performed through this RPC. It verifies the caller's role
-- and lets reception record both farm visitors and resort guests before accounting reviews the report.
create or replace function public.save_daily_report(
  p_report_date date,
  p_entries jsonb,
  p_note text default null
)
returns public.daily_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role public.app_role := public.current_app_role();
  v_report public.daily_reports;
  v_previous_status public.report_status;
  v_item_code text;
  v_quantity integer;
  v_status public.report_status;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if v_role not in ('receptionist', 'accountant', 'admin') then
    raise exception 'The user has no assigned application role';
  end if;
  if p_report_date is null or p_entries is null or jsonb_typeof(p_entries) <> 'object' or p_entries = '{}'::jsonb then
    raise exception 'A report date and at least one entry are required';
  end if;

  select * into v_report from public.daily_reports where report_date = p_report_date for update;
  v_previous_status := v_report.status;

  if not found then
    insert into public.daily_reports (report_date, created_by, updated_by)
    values (p_report_date, v_user_id, v_user_id)
    returning * into v_report;
    v_previous_status := 'waiting_accounting';
  end if;

  if v_role = 'receptionist' and v_previous_status in ('sent', 'revised_pending_resend') then
    raise exception 'Only accounting staff can edit a report that has already been sent';
  end if;

  for v_item_code, v_quantity in select key, value::integer from jsonb_each_text(p_entries)
  loop
    if v_quantity < 0 then
      raise exception 'Quantity for % cannot be negative', v_item_code;
    end if;
    perform 1 from public.report_items where code = v_item_code;
    if not found then
      raise exception 'Unknown report item: %', v_item_code;
    end if;
    insert into public.report_entries (report_id, item_code, quantity, updated_by, updated_at)
    values (v_report.id, v_item_code, v_quantity, v_user_id, now())
    on conflict (report_id, item_code) do update
      set quantity = excluded.quantity, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  end loop;

  if v_role = 'receptionist' then
    v_status := 'waiting_accounting';
    update public.daily_reports
      set note = coalesce(p_note, note), status = v_status, reception_saved_by = v_user_id,
          reception_saved_at = now(), updated_by = v_user_id
      where id = v_report.id
      returning * into v_report;
  else
    v_status := case when v_previous_status = 'sent' then 'revised_pending_resend' else 'pending_send' end;
    update public.daily_reports
      set note = coalesce(p_note, note), status = v_status, accounting_saved_by = v_user_id,
          accounting_saved_at = now(), updated_by = v_user_id
      where id = v_report.id
      returning * into v_report;
  end if;

  return v_report;
end;
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_accountant_or_admin() from public;
revoke all on function public.save_daily_report(date, jsonb, text) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_accountant_or_admin() to authenticated;
grant execute on function public.save_daily_report(date, jsonb, text) to authenticated;

insert into public.report_items (code, display_name, sort_order, item_group, entry_owner) values
  ('show_baan_rim_khao', 'บัตรชมโชว์ (บ้านริมเขา)', 1, 'farm', 'accountant'),
  ('combo_s_sw', 'Combo Set S (สว)', 2, 'farm', 'accountant'),
  ('combo_s_hs_ht_dog', 'Combo Set S (Hs, Ht, Dog Show)', 3, 'farm', 'accountant'),
  ('combo_m', 'Combo Set M', 4, 'farm', 'accountant'),
  ('combo_l', 'Combo Set L', 5, 'farm', 'accountant'),
  ('combo_xl', 'Combo Set XL', 6, 'farm', 'accountant'),
  ('farm_after_1600', 'บัตรเข้าฟาร์มหลัง 16.00 น.', 7, 'farm', 'accountant'),
  ('farm_after_1700', 'บัตรเข้าฟาร์มหลัง 17.00 น.', 8, 'farm', 'accountant'),
  ('combo_tour', 'Combo Set (ทัวร์)', 9, 'farm', 'accountant'),
  ('farm_free', 'เข้าชมฟาร์มฟรี', 10, 'farm', 'accountant'),
  ('resort_guests', 'ลูกค้าเข้าพัก', 11, 'resort', 'receptionist')
on conflict (code) do update set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  item_group = excluded.item_group,
  entry_owner = excluded.entry_owner;

-- After creating the first user in Authentication, promote that user to admin:
-- update public.profiles set role = 'admin', display_name = 'ผู้ดูแลระบบ' where id = '<AUTH_USER_UUID>';
