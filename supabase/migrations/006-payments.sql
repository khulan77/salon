-- Урьдчилгаа төлбөр. Supabase → SQL Editor → New query → Run. Дахин ажиллуулж болно.
--
-- Төлбөр төлөгдтөл захиалга үүсэхгүй тул захиалгын "ноорог"-ийг энд хадгалж,
-- төлбөр баталгаажмагц л bookings руу бичнэ.

-- Урьдчилгааны дүн. 0 = урьдчилгаа авахгүй (анхдагч байдал).
alter table public.settings
  add column if not exists deposit_amount integer not null default 0;

create table if not exists public.payments (
  id          text primary key,
  -- pending    = нэхэмжлэх үүссэн, төлбөр хүлээж байна
  -- paid       = төлөгдөж, захиалга үүссэн (booking_id бөглөгдсөн)
  -- expired    = хугацаандаа төлөгдөөгүй
  -- refund_due = төлөгдсөн ч цагийг нь өөр хүн авсан → буцаалт хийх ёстой
  -- refunded   = буцаалт хийгдсэн
  status      text not null default 'pending',
  amount      integer not null default 0,
  provider    text not null default 'mock',
  invoice_id  text,
  booking_id  text,
  -- Захиалгын ноорог: үйлчилгээ/багц, мастер, огноо, цаг, холбоо барих мэдээлэл.
  draft       jsonb not null default '{}'::jsonb,
  error       text not null default '',
  expires_at  timestamptz not null default now() + interval '15 minutes',
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create index if not exists payments_status_idx on public.payments (status, created_at desc);

-- Бусад хүснэгттэй ижил: RLS асаана, policy нэмэхгүй. Серверийн secret key
-- (service role) л хандана — publishable key-ээр уншиж/бичиж болохгүй.
alter table public.payments enable row level security;

notify pgrst, 'reload schema';
