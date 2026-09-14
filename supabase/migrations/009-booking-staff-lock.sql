-- ⭐ "Зөвхөн энэ мастер дээр" — зарим үйлчлүүлэгч тодорхой мастерт л үйлчлүүлдэг.
-- Админ хуанлийн захиалга дээр од дарвал тэр захиалгыг өөр мастер руу
-- шилжүүлэх боломжгүй болно.
-- Supabase → SQL Editor → New query → энэ файлыг хуулж Run дарна. Дахин ажиллуулж болно.

alter table public.bookings
  add column if not exists staff_locked boolean not null default false;

notify pgrst, 'reload schema';
