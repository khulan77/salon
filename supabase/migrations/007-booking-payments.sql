-- Захиалга дээр гараар бүртгэх төлбөрүүд. Supabase → SQL Editor → New query →
-- Run. Дахин ажиллуулж болно.
--
-- deposit_paid — үйлчлүүлэгчийн УРЬДЧИЛЖ төлсөн дүн (бэлнээр, дансаар эсвэл
--                QPay-ээр). Үлдэгдлийг үүнээс хасч тооцно.
-- extra_charge — үйлчилгээний явцад нэмэгдсэн төлбөр (нэмэлт бодис, урт үс,
--                нэмэлт жижиг үйлчилгээ гэх мэт).
alter table public.bookings
  add column if not exists deposit_paid integer not null default 0;

alter table public.bookings
  add column if not exists extra_charge integer not null default 0;
