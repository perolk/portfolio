-- ============================================================
-- ESQUEMA DE BASE DE DATOS — Portfolio Elías Torres
-- Ejecutar esto en Supabase: panel izquierdo > SQL Editor > New query
-- ============================================================

-- Tabla principal de proyectos
create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,            -- usado en la URL: /proyectos/slug.html
  num int not null,                     -- número de lámina (orden de visualización)
  title text not null,
  year text,
  lugar text,
  zona text,
  edificio text,
  arquitecto text,
  cliente text,
  programa text,
  software text,
  descripcion text,
  tags text[] default '{}',             -- array de categorías, ej: {Reforma, Madrid}
  img_url text,                         -- URL pública de la imagen principal
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para ordenar rápido por número de lámina
create index proyectos_num_idx on public.proyectos (num);

-- Activar seguridad a nivel de fila (obligatorio en Supabase)
alter table public.proyectos enable row level security;

-- Política de LECTURA: cualquier visitante (incluso sin login) puede leer
create policy "Cualquiera puede leer proyectos"
  on public.proyectos
  for select
  using (true);

-- Política de ESCRITURA: solo usuarios autenticados (tu login) pueden
-- insertar, modificar o borrar
create policy "Solo admin autenticado puede insertar"
  on public.proyectos
  for insert
  to authenticated
  with check (true);

create policy "Solo admin autenticado puede actualizar"
  on public.proyectos
  for update
  to authenticated
  using (true);

create policy "Solo admin autenticado puede borrar"
  on public.proyectos
  for delete
  to authenticated
  using (true);

-- ============================================================
-- STORAGE (para las imágenes) — esto se crea desde la interfaz,
-- no por SQL, pero las políticas de acceso sí se definen aquí.
-- Ver instrucciones en SETUP.md para crear el bucket "project-images".
-- ============================================================

-- Política de lectura pública del bucket de imágenes
create policy "Cualquiera puede ver las imágenes"
  on storage.objects for select
  using (bucket_id = 'project-images');

-- Política de subida: solo el admin autenticado
create policy "Solo admin autenticado puede subir imágenes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images');

create policy "Solo admin autenticado puede borrar imágenes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-images');
