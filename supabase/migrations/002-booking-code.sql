-- Захиалгын код — үйлчлүүлэгч өөрийн захиалгаа /my хуудаснаас хайж, цуцлахад хэрэглэнэ.
-- Supabase → SQL Editor → New query → энэ файлыг хуулж Run дарна. Дахин ажиллуулж болно.

alter table public.bookings
  add column if not exists code text;

-- Өмнө нь үүссэн захиалгуудад код онооно (6 тэмдэгт, том үсэг/тоо).
update public.bookings
   set code = upper(substr(md5(random()::text || id), 1, 6))
 where code is null;

-- Код давхцахгүй байх баталгаа.
create unique index if not exists bookings_code_key on public.bookings (code);

notify pgrst, 'reload schema';
