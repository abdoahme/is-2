-- Safe, per-admin operational reset for IS Motors.
-- A full before-reset snapshot is written in the same transaction as the reset.
alter table public.app_backups
  drop constraint if exists app_backups_backup_type_check;

alter table public.app_backups
  add constraint app_backups_backup_type_check
  check (backup_type in ('daily','manual','migration_baseline','before_restore','before_reset'));

create or replace function public.reset_my_is_motors_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_backup_id uuid;
  v_snapshot jsonb;
  v_deleted_records integer := 0;
  v_deleted_transactions integer := 0;
  v_deleted_reconciliations integer := 0;
begin
  if v_user is null then
    raise exception 'يجب تسجيل الدخول قبل إعادة ضبط البيانات.';
  end if;

  if not coalesce(private.is_is_motors_admin(), false) then
    raise exception 'هذه العملية متاحة لمدير النظام فقط.';
  end if;

  select pg_catalog.jsonb_build_object(
    'schemaVersion', 1,
    'createdAt', pg_catalog.now(),
    'state', coalesce((
      select ar.payload
      from public.app_records ar
      where ar.user_id = v_user
        and ar.record_type = 'settings'
        and ar.record_key = 'main'
      limit 1
    ), '{}'::jsonb),
    'appRecords', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(ar))
      from public.app_records ar
      where ar.user_id = v_user
    ), '[]'::jsonb),
    'financialTransactions', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(ft))
      from public.financial_transactions ft
      where ft.user_id = v_user
    ), '[]'::jsonb),
    'cashReconciliations', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(cr))
      from public.cash_reconciliations cr
      where cr.user_id = v_user
    ), '[]'::jsonb),
    'auditLogs', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(al))
      from public.audit_logs al
      where al.user_id = v_user
    ), '[]'::jsonb)
  ) into v_snapshot;

  insert into public.app_backups(user_id, created_by, backup_type, label, payload)
  values (
    v_user,
    v_user,
    'before_reset',
    'نسخة كاملة قبل إعادة ضبط بيانات النظام — ' || pg_catalog.to_char(pg_catalog.now(), 'YYYY-MM-DD HH24:MI:SS'),
    v_snapshot
  )
  returning id into v_backup_id;

  update public.app_records
  set payload = pg_catalog.jsonb_build_object(
        'cars', '[]'::jsonb,
        'expenses', '[]'::jsonb,
        'debts', '[]'::jsonb,
        'capital', '[]'::jsonb,
        'partnerMovements', '[]'::jsonb,
        'closings', pg_catalog.jsonb_build_object(
          'annual', '{}'::jsonb,
          'halves', '{}'::jsonb,
          'months', '{}'::jsonb,
          'snapshots', '[]'::jsonb
        ),
        'documents', '[]'::jsonb,
        'actualCash', 'null'::jsonb,
        'appSettings', coalesce(payload -> 'appSettings', pg_catalog.jsonb_build_object('name', 'IS Motors'))
      ),
      updated_at = pg_catalog.now()
  where user_id = v_user
    and record_type = 'settings'
    and record_key = 'main';

  if not found then
    insert into public.app_records(user_id, record_type, record_key, payload)
    values (
      v_user, 'settings', 'main',
      pg_catalog.jsonb_build_object(
        'cars', '[]'::jsonb, 'expenses', '[]'::jsonb, 'debts', '[]'::jsonb,
        'capital', '[]'::jsonb, 'partnerMovements', '[]'::jsonb,
        'closings', pg_catalog.jsonb_build_object('annual','{}'::jsonb,'halves','{}'::jsonb,'months','{}'::jsonb,'snapshots','[]'::jsonb),
        'documents', '[]'::jsonb, 'actualCash', 'null'::jsonb,
        'appSettings', pg_catalog.jsonb_build_object('name','IS Motors')
      )
    );
  end if;

  delete from public.app_records
  where user_id = v_user
    and not (record_type = 'settings' and record_key = 'main');
  get diagnostics v_deleted_records = row_count;

  -- Delete all rows for this account in one statement so self-referencing
  -- reversal links are checked after the complete account ledger is removed.
  delete from public.financial_transactions where user_id = v_user and reversal_of is not null;
  delete from public.financial_transactions where user_id = v_user;
  get diagnostics v_deleted_transactions = row_count;

  delete from public.cash_reconciliations where user_id = v_user;
  get diagnostics v_deleted_reconciliations = row_count;

  -- Keep audit history, backups, admin authentication, employee submissions,
  -- notifications, and push subscriptions intact.
  insert into public.audit_logs(user_id, created_by, event_type, entity_type, entity_id, description, after_data)
  values (
    v_user, v_user, 'system', 'account_reset', v_backup_id::text,
    'إعادة ضبط بيانات التشغيل بعد إنشاء نسخة احتياطية كاملة. تم الاحتفاظ بسجل المراجعة وإعدادات النظام.',
    pg_catalog.jsonb_build_object(
      'backup_id', v_backup_id,
      'deleted_app_records', v_deleted_records,
      'deleted_financial_transactions', v_deleted_transactions,
      'deleted_cash_reconciliations', v_deleted_reconciliations
    )
  );

  return pg_catalog.jsonb_build_object(
    'backup_id', v_backup_id,
    'deleted_app_records', v_deleted_records,
    'deleted_financial_transactions', v_deleted_transactions,
    'deleted_cash_reconciliations', v_deleted_reconciliations
  );
end;
$function$;

revoke all on function public.reset_my_is_motors_data() from public, anon;
grant execute on function public.reset_my_is_motors_data() to authenticated;
