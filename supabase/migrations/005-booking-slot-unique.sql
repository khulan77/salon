-- Нэг мастерын нэг цагт хоёр захиалга орохоос сэргийлнэ.
-- Supabase → SQL Editor → New query → энэ файлыг хуулж Run дарна. Дахин ажиллуулж болно.
--
-- Хоёр хүн яг зэрэг захиалахад аппын шалгалт хоёуланд нь "сул байна" гэж
-- хариулж амждаг. Энэ индекс нь хоёр дахь бичилтийг мэдээллийн сангийн
-- түвшинд няцаана. Цуцлагдсан захиалга цагийг эзлэхгүй тул индекст орохгүй.

create unique index if not exists bookings_staff_slot_key
  on public.bookings (staff_id, date, time)
  where status <> 'cancelled';

-- Хэрэв "could not create unique index" алдаа гарвал өмнө нь давхар захиалга
-- үүссэн байна. Давхцлыг эндээс олно:
--   select staff_id, date, time, count(*)
--     from public.bookings
--    where status <> 'cancelled'
--    group by 1, 2, 3
--   having count(*) > 1;
-- Илүүдэл захиалгыг админ хэсгээс цуцалсны дараа энэ файлыг дахин Run дарна.

notify pgrst, 'reload schema';
