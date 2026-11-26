-- Employee access control and performance summaries.
-- Admins may activate/suspend regular users, but cannot grant or modify admin access.

alter table private.user_roles
  drop constraint if exists user_roles_role_check;

alter table private.user_roles
  add constraint user_roles_role_check
  check (role = any (array['admin'::text, 'user'::text, 'suspended'::text]));

create or replace function public.admin_list_is_motors_users()
returns table (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz,
  total_requests bigint,
  pending_requests bigint,
  recorded_requests bigint,
  last_request_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not private.is_is_motors_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(r.role, 'unassigned')::text,
    u.created_at,
    count(s.id)::bigint,
    count(s.id) filter (where s.status = 'pending')::bigint,
    count(s.id) filter (where s.status = 'recorded')::bigint,
    max(s.created_at)
  from auth.users u
  left join private.user_roles r on r.user_id = u.id
  left join public.expense_submissions s on s.submitted_by = u.id
  group by u.id, u.email, r.role, u.created_at
  order by
    case coalesce(r.role, 'unassigned')
      when 'admin' then 0
      when 'user' then 1
      when 'suspended' then 2
      else 3
    end,
    u.created_at desc;
end;
$function$;

create or replace function public.admin_set_is_motors_user_status(
  target_user_id uuid,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  previous_role text;
begin
  if not private.is_is_motors_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if target_user_id is null or target_user_id = (select auth.uid()) then
    raise exception 'cannot change your own access' using errcode = '22023';
  end if;

  if new_status not in ('user', 'suspended') then
    raise exception 'status must be user or suspended' using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users u where u.id = target_user_id) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  select r.role into previous_role
  from private.user_roles r
  where r.user_id = target_user_id
  for update;

  if previous_role = 'admin' then
    raise exception 'admin access cannot be changed through this function' using errcode = '42501';
  end if;

  insert into private.user_roles (user_id, role)
  values (target_user_id, new_status)
  on conflict (user_id) do update set role = excluded.role;

  insert into public.audit_logs (
    user_id, event_type, entity_type, entity_id, description,
    before_data, after_data, created_by
  ) values (
    (select auth.uid()),
    'update',
    'user_roles',
    target_user_id::text,
    case when new_status = 'suspended' then 'إيقاف وصول مستخدم' else 'إعادة تفعيل وصول مستخدم' end,
    jsonb_build_object('role', coalesce(previous_role, 'unassigned')),
    jsonb_build_object('role', new_status),
    (select auth.uid())
  );
end;
$function$;

revoke all on function public.admin_list_is_motors_users() from public, anon;
revoke all on function public.admin_set_is_motors_user_status(uuid, text) from public, anon;
grant execute on function public.admin_list_is_motors_users() to authenticated;
grant execute on function public.admin_set_is_motors_user_status(uuid, text) to authenticated;
