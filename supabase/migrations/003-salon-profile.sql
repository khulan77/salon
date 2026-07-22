-- Салоны танилцуулга мэдээллийг админаас засах боломжтой болгоно.
-- Өмнө нь нэр, утас, хаяг зэрэг нь кодод бичээстэй байсан.
alter table public.settings
  add column if not exists salon_name  text not null default 'Lumière',
  add column if not exists tagline     text not null default 'Гоо сайхны салон',
  add column if not exists phone       text not null default '',
  add column if not exists email       text not null default '',
  add column if not exists address     text not null default '',
  add column if not exists about       text not null default '',
  -- Хаягаас автоматаар олдсон "өргөрөг,уртраг". Админ гараар оруулахгүй.
  add column if not exists map_coords  text not null default '';
