-- Үйлчилгээний хямдрал (sale) нэмэх.
-- Supabase → SQL Editor → New query → энэ файлыг хуулж Run дарна. Дахин ажиллуулж болно.

alter table public.services
  add column if not exists sale_percent integer not null default 0;

-- PostgREST-ийн schema cache-ийг шинэчилнэ (эс тэгвээс
-- "Could not find the 'sale_percent' column" алдаа үлдэж магадгүй).
notify pgrst, 'reload schema';
