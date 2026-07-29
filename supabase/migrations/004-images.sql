-- Зураг: үйлчилгээ бүрт зураг, нүүр хуудсанд hero зураг оруулах боломж.
-- Хоосон үед хуучин эможи дүрслэл рүү автоматаар буцна.
alter table public.services
  add column if not exists image_url text;

alter table public.settings
  add column if not exists hero_image_url text;
