-- ============================================
-- OK to Board - Multi-tenant Schema
-- شغّله في Supabase SQL Editor (بعد schema-evisa.sql)
-- ============================================

create table if not exists boarding_passes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  verification_no text unique not null,
  qr_token text unique not null default encode(gen_random_bytes(16),'hex'),
  passenger_name_ar text,
  passenger_name_en text not null,
  passport_no text not null,
  nationality text,
  date_of_birth date,
  airline text,
  flight_no text,
  arrival_date date,
  destination_country text default 'Egypt | مصر',
  verification_type text default 'Pre-Travel Clearance',
  issue_date date default current_date,
  valid_until date,
  status text default 'active',
  created_at timestamptz default now()
);

create index if not exists idx_bp_company on boarding_passes(company_id);
create index if not exists idx_bp_token on boarding_passes(qr_token);

alter table boarding_passes enable row level security;

drop policy if exists "read bp auth" on boarding_passes;
create policy "read bp auth" on boarding_passes for select using (true);

drop policy if exists "insert bp auth" on boarding_passes;
create policy "insert bp auth" on boarding_passes for insert with check (auth.uid() is not null);

drop policy if exists "update bp auth" on boarding_passes;
create policy "update bp auth" on boarding_passes for update using (auth.uid() is not null);
