-- IS Motors finance operations ledger
-- Additive migration: existing app_records remain unchanged.
create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  transaction_date date not null,
  direction text not null check (direction in ('inflow','outflow')),
  category text not null check (category in ('car_collection','car_purchase','car_prep','expense','capital_deposit','capital_withdrawal','manual','reversal')),
  payment_method text not null default 'other' check (payment_method in ('cash','bank_transfer','check','card','other')),
  amount numeric(14,2) not null check (amount > 0),
  car_id text,
  person_name text,
  description text not null default '',
  reference text,
  source_type text,
  source_id text,
  source_key text,
  is_legacy boolean not null default false,
  reversal_of uuid references public.financial_transactions(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint financial_transactions_source_key_unique unique(user_id, source_key)
);
create index if not exists financial_transactions_user_date_idx on public.financial_transactions(user_id, transaction_date desc, created_at desc);
create index if not exists financial_transactions_user_car_idx on public.financial_transactions(user_id, car_id, transaction_date desc);
create index if not exists financial_transactions_user_category_idx on public.financial_transactions(user_id, category, transaction_date desc);

create table if not exists public.cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  reconciliation_date date not null,
  opening_cash numeric(14,2) not null default 0 check (opening_cash >= 0),
  cash_in numeric(14,2) not null default 0 check (cash_in >= 0),
  cash_out numeric(14,2) not null default 0 check (cash_out >= 0),
  expected_cash numeric(14,2) not null default 0,
  counted_cash numeric(14,2) not null check (counted_cash >= 0),
  cash_difference numeric(14,2) generated always as (counted_cash - expected_cash) stored,
  bank_in numeric(14,2) not null default 0 check (bank_in >= 0),
  bank_out numeric(14,2) not null default 0 check (bank_out >= 0),
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_reconciliations_user_date_unique unique(user_id, reconciliation_date)
);
create index if not exists cash_reconciliations_user_date_idx on public.cash_reconciliations(user_id, reconciliation_date desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('create','update','delete','close','reopen','restore','backup','reversal','system')),
  entity_type text not null,
  entity_id text,
  description text not null default '',
  before_data jsonb,
  after_data jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_user_created_idx on public.audit_logs(user_id, created_at desc);
create index if not exists audit_logs_user_entity_idx on public.audit_logs(user_id, entity_type, entity_id, created_at desc);

create table if not exists public.app_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  backup_type text not null check (backup_type in ('daily','manual','migration_baseline','before_restore')),
  label text not null default '',
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists app_backups_user_created_idx on public.app_backups(user_id, created_at desc);

alter table public.financial_transactions enable row level security;
alter table public.cash_reconciliations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_backups enable row level security;

drop policy if exists "IS Motors admins read finance transactions" on public.financial_transactions;
create policy "IS Motors admins read finance transactions" on public.financial_transactions
  for select to authenticated using ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
drop policy if exists "IS Motors admins append finance transactions" on public.financial_transactions;
create policy "IS Motors admins append finance transactions" on public.financial_transactions
  for insert to authenticated with check ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
grant select, insert on public.financial_transactions to authenticated;
revoke update, delete on public.financial_transactions from anon, authenticated;

drop policy if exists "IS Motors admins manage cash reconciliations" on public.cash_reconciliations;
create policy "IS Motors admins manage cash reconciliations" on public.cash_reconciliations
  for all to authenticated using ((select auth.uid()) = user_id and (select private.is_is_motors_admin()))
  with check ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
grant select, insert, update on public.cash_reconciliations to authenticated;
revoke delete on public.cash_reconciliations from anon, authenticated;

drop policy if exists "IS Motors admins read audit logs" on public.audit_logs;
create policy "IS Motors admins read audit logs" on public.audit_logs
  for select to authenticated using ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
drop policy if exists "IS Motors admins append audit logs" on public.audit_logs;
create policy "IS Motors admins append audit logs" on public.audit_logs
  for insert to authenticated with check ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
grant select, insert on public.audit_logs to authenticated;
revoke update, delete on public.audit_logs from anon, authenticated;

drop policy if exists "IS Motors admins read backups" on public.app_backups;
create policy "IS Motors admins read backups" on public.app_backups
  for select to authenticated using ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
drop policy if exists "IS Motors admins create backups" on public.app_backups;
create policy "IS Motors admins create backups" on public.app_backups
  for insert to authenticated with check ((select auth.uid()) = user_id and (select private.is_is_motors_admin()));
grant select, insert on public.app_backups to authenticated;
revoke update, delete on public.app_backups from anon, authenticated;

create or replace function private.audit_financial_transaction_insert()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  insert into public.audit_logs(user_id,event_type,entity_type,entity_id,description,after_data,created_by)
  values (
    new.user_id,
    case when new.reversal_of is not null then 'reversal' else 'create' end,
    'financial_transactions',new.id::text,coalesce(new.description,new.category),
    jsonb_build_object(
      'date',new.transaction_date,'direction',new.direction,'category',new.category,
      'method',new.payment_method,'amount',new.amount,'car_id',new.car_id,
      'person_name',new.person_name,'reference',new.reference,
      'is_legacy',new.is_legacy,'reversal_of',new.reversal_of
    ),new.created_by
  );
  return new;
end;
$function$;
revoke all on function private.audit_financial_transaction_insert() from public, anon, authenticated;
drop trigger if exists audit_financial_transaction_insert on public.financial_transactions;
create trigger audit_financial_transaction_insert after insert on public.financial_transactions
  for each row execute function private.audit_financial_transaction_insert();

-- Preserve a recovery copy of every existing main application record before migration.
insert into public.app_backups(user_id,backup_type,label,payload,created_by)
select ar.user_id,'migration_baseline','نسخة مرجعية قبل إضافة دفاتر التشغيل',ar.payload,ar.user_id
from public.app_records ar
where ar.record_type='settings' and ar.record_key='main'
  and not exists(select 1 from public.app_backups b where b.user_id=ar.user_id and b.backup_type='migration_baseline');

-- Existing car paidAmount values are migrated as clearly marked opening collection entries.
-- Per-payment dates and payment methods were not stored in the legacy JSON record.
insert into public.financial_transactions(
  user_id,transaction_date,direction,category,payment_method,amount,car_id,person_name,
  description,source_type,source_id,source_key,is_legacy,created_by
)
select
  ar.user_id,
  case when car->>'date' ~ '^\d{4}-\d{2}-\d{2}$' then (car->>'date')::date else (ar.updated_at at time zone 'Africa/Cairo')::date end,
  'inflow','car_collection','other',(car->>'paidAmount')::numeric,car->>'id',
  coalesce(nullif(car->>'customer',''),nullif(car->>'model',''),'عميل سابق'),
  'رصيد تحصيل افتتاحي مرحّل من المبلغ المسدد السابق؛ تاريخ وطريقة كل دفعة غير متاحين.',
  'car',car->>'id','legacy:car-collection:'||(car->>'id'),true,ar.user_id
from public.app_records ar
cross join lateral jsonb_array_elements(case when jsonb_typeof(ar.payload->'cars')='array' then ar.payload->'cars' else '[]'::jsonb end) as car
where ar.record_type='settings' and ar.record_key='main'
  and coalesce(car->>'id','')<>'' and coalesce(car->>'paidAmount','0') ~ '^[0-9]+(\.[0-9]+)?$'
  and (car->>'paidAmount')::numeric>0
on conflict(user_id,source_key) do nothing;

-- Migrate historic expenses into the known cashbook movement stream.
insert into public.financial_transactions(
  user_id,transaction_date,direction,category,payment_method,amount,person_name,description,reference,
  source_type,source_id,source_key,is_legacy,created_by
)
select
  ar.user_id,
  case when item->>'date' ~ '^\d{4}-\d{2}-\d{2}$' then (item->>'date')::date else (ar.updated_at at time zone 'Africa/Cairo')::date end,
  'outflow','expense',
  case when item->>'paymentMethod'='نقداً' then 'cash'
       when item->>'paymentMethod' in ('تحويل بنكي','إيداع بنكي مباشر') then 'bank_transfer'
       when item->>'paymentMethod'='شيك' then 'check'
       when item->>'paymentMethod'='بطاقة' then 'card' else 'other' end,
  (item->>'amount')::numeric,coalesce(item->>'recipient',''),
  coalesce(nullif(item->>'description',''),nullif(item->>'category',''),'مصروف سابق'),
  coalesce(item->>'receiptNo',''),'expense',item->>'id','legacy:expense:'||(item->>'id'),true,ar.user_id
from public.app_records ar
cross join lateral jsonb_array_elements(case when jsonb_typeof(ar.payload->'expenses')='array' then ar.payload->'expenses' else '[]'::jsonb end) as item
where ar.record_type='settings' and ar.record_key='main'
  and coalesce(item->>'id','')<>'' and coalesce(item->>'amount','0') ~ '^[0-9]+(\.[0-9]+)?$'
  and (item->>'amount')::numeric>0
on conflict(user_id,source_key) do nothing;

-- Migrate known capital deposits and withdrawals; purchase prices are not assumed to be paid cash.
insert into public.financial_transactions(
  user_id,transaction_date,direction,category,payment_method,amount,person_name,description,reference,
  source_type,source_id,source_key,is_legacy,created_by
)
select
  ar.user_id,
  case when item->>'date' ~ '^\d{4}-\d{2}-\d{2}$' then (item->>'date')::date else (ar.updated_at at time zone 'Africa/Cairo')::date end,
  movement.direction,movement.category,
  case when item->>'method'='نقداً بالخزينة' then 'cash'
       when item->>'method' in ('تحويل بنكي','إيداع بنكي مباشر') then 'bank_transfer'
       when item->>'method'='شيك بنكي' then 'check' else 'other' end,
  movement.amount,coalesce(item->>'partner',''),
  coalesce(nullif(item->>'description',''),nullif(item->>'movementType',''),'حركة رأس مال سابقة'),
  coalesce(item->>'receiptNo',''),'capital',item->>'id',
  'legacy:capital:'||(item->>'id')||':'||movement.direction,true,ar.user_id
from public.app_records ar
cross join lateral jsonb_array_elements(case when jsonb_typeof(ar.payload->'capital')='array' then ar.payload->'capital' else '[]'::jsonb end) as item
cross join lateral (
  select 'inflow'::text as direction,'capital_deposit'::text as category,(item->>'deposited')::numeric as amount
  where coalesce(item->>'deposited','0') ~ '^[0-9]+(\.[0-9]+)?$' and (item->>'deposited')::numeric>0
  union all
  select 'outflow'::text,'capital_withdrawal'::text,(item->>'withdrawn')::numeric
  where coalesce(item->>'withdrawn','0') ~ '^[0-9]+(\.[0-9]+)?$' and (item->>'withdrawn')::numeric>0
) as movement
where ar.record_type='settings' and ar.record_key='main' and coalesce(item->>'id','')<>''
on conflict(user_id,source_key) do nothing;
