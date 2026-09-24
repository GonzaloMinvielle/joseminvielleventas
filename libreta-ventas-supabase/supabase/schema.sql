-- Libreta de ventas: esquema para Supabase (un solo usuario, protegido con RLS)
-- Correr completo en el SQL Editor del proyecto.

create table if not exists public.config (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  nombre     text default '',
  tel        text default '',
  loc        text default '',
  pie        text default '',
  validez    integer default 7,
  next_num   integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.productos (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  orden      integer not null default 0,
  nombre     text not null,
  costo      numeric(14,2) not null default 0,
  precio     numeric(14,2) not null default 0,
  foto       text,                       -- URL pública en el bucket "fotos"
  updated_at timestamptz not null default now()
);

create table if not exists public.contactos (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  tipo       text not null default 'persona' check (tipo in ('club','persona')),
  club       text default '',
  nombre     text default '',
  tel        text default '',
  loc        text default '',
  ref        text default '',
  notas      text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  num        integer,                    -- null en las ventas históricas del Excel
  fecha      date,
  cliente_id text references public.contactos(id) on delete set null,
  estado     text not null default 'presupuesto' check (estado in ('presupuesto','vendido')),
  historico  boolean not null default false,
  -- [{prodId, nombre, cant, precio, costo}] con precio y costo congelados al momento de la venta
  items      jsonb not null default '[]',
  tot_costo  numeric(14,2),              -- solo históricos: totales sin detalle por unidad
  tot_venta  numeric(14,2),
  flete      numeric(14,2) not null default 0,
  comision   numeric(14,2) not null default 0,
  comision_a text default '',
  cobrado    numeric(14,2) not null default 0,
  notas      text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.catalogos (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  tipo       text not null default 'catalogo' check (tipo in ('catalogo','ofertas')),
  titulo     text not null,
  fecha      date,
  hasta      date,
  cant_modo  text not null default 'none' check (cant_modo in ('none','stock','pack')),
  nota       text default '',
  items      jsonb not null default '[]',  -- [{prodId, precio, antes, cant}]
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_cliente_idx on public.pedidos (cliente_id);
create index if not exists pedidos_user_idx    on public.pedidos (user_id);
create index if not exists contactos_user_idx  on public.contactos (user_id);

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['config','productos','contactos','pedidos','catalogos'] loop
    execute format('drop trigger if exists touch on public.%I', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Seguridad: cada fila solo la ve y la toca su dueño
do $$ declare t text; begin
  foreach t in array array['config','productos','contactos','pedidos','catalogos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo el dueño" on public.%I', t);
    execute format('create policy "solo el dueño" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Fotos de productos: bucket público para leer, escritura solo en la carpeta del usuario
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos: ver las propias"     on storage.objects;
drop policy if exists "fotos: subir las propias"   on storage.objects;
drop policy if exists "fotos: cambiar las propias" on storage.objects;
drop policy if exists "fotos: borrar las propias"  on storage.objects;
create policy "fotos: ver las propias" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: subir las propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: cambiar las propias" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: borrar las propias" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
