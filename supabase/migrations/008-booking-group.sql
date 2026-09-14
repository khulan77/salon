-- Нэг үйлчлүүлэгч нэг дор хэд хэдэн үйлчилгээ захиалахад (жишээ нь маникюр +
-- педикюр хоёр мастер зэрэг хийх) тэдгээрийг холбох багана.
-- Supabase → SQL Editor → New query → энэ файлыг хуулж Run дарна. Дахин ажиллуулж болно.
--
-- Үйлчилгээ бүр өөрийн мөр (мастер, цаг, код)-той хэвээр — хуанли, орлого,
-- мастерын хуудас бүгд өмнөх шигээ ажиллана. group_id нь зөвхөн "хамт
-- захиалсан" гэдгийг заана. Энэ файлыг ажиллуулаагүй байсан ч захиалга
-- үүснэ, зөвхөн хоорондоо холбогдохгүй.

alter table public.bookings add column if not exists group_id text;
create index if not exists bookings_group_idx on public.bookings (group_id);

notify pgrst, 'reload schema';
