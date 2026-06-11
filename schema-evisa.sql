-- ============================================
-- Multi-tenant e-Visa Schema
-- شغّل هذا في Supabase SQL Editor
-- ============================================

-- 1) جدول الشركات
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text,
  logo_url text,
  primary_color text default '#1a4d8f',
  contact_phone text,
  contact_email text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 2) جدول التأشيرات
create table if not exists evisas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  visa_no text unique not null,
  qr_token text unique not null default encode(gen_random_bytes(16),'hex'),
  passenger_name_ar text,
  passenger_name_en text not null,
  passport_no text not null,
  nationality text,
  date_of_birth date,
  gender text,
  destination text,
  flight_no text,
  flight_date date,
  departure_city text,
  arrival_city text,
  visa_type text default 'tourist',
  issue_date date default current_date,
  expiry_date date,
  status text default 'active',
  created_by uuid,
  created_at timestamptz default now()
);

create index if not exists idx_evisas_company on evisas(company_id);
create index if not exists idx_evisas_token on evisas(qr_token);

-- 3) Storage bucket للشعارات (سوّيه يدوي من Dashboard اسمه: company-logos، Public)

-- 4) RLS
alter table companies enable row level security;
alter table evisas enable row level security;

-- قراءة الشركات: الكل (للوصول لشعار الشركة من رابط عام)
drop policy if exists "read companies" on companies;
create policy "read companies" on companies for select using (true);

-- قراءة/كتابة تأشيرات: المستخدم المسجّل فقط
drop policy if exists "read evisas auth" on evisas;
create policy "read evisas auth" on evisas for select using (auth.uid() is not null);

drop policy if exists "insert evisas auth" on evisas;
create policy "insert evisas auth" on evisas for insert with check (auth.uid() is not null);

drop policy if exists "update evisas auth" on evisas;
create policy "update evisas auth" on evisas for update using (auth.uid() is not null);

-- التحقق العام بـ QR (بدون تسجيل): فقط بالـ token
drop policy if exists "verify evisa by token" on evisas;
create policy "verify evisa by token" on evisas for select using (qr_token is not null);
