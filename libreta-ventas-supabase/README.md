# Libreta de ventas

App web para gestionar clientes, pedidos, presupuestos y catálogos de pelotas (reventa CH1).
HTML + JS sin build, datos en Supabase.

## Estructura
- `index.html`: estilos y carga de scripts
- `config.js`: URL y anon key de Supabase
- `db.js`: capa de datos (carga todo al entrar y sube solo lo que cambia, con caché local para cortes de conexión)
- `app.js`: la aplicación
- `supabase/schema.sql`: tablas, RLS y bucket de fotos

## Puesta en marcha
1. Supabase → SQL Editor: correr `supabase/schema.sql` completo.
2. Authentication → Users → Add user: crear el usuario con mail y contraseña (marcar como confirmado).
3. Authentication → deshabilitar el registro de usuarios nuevos (sign ups): la app es de un solo usuario.
4. Project Settings → API: copiar Project URL y anon key a `config.js`. Nunca la service_role key.
5. Deploy estático (Vercel, Netlify, GitHub Pages) apuntando a la raíz del repo.
6. Entrar con el usuario y cargar `datos-iniciales.json` en la pantalla de bienvenida (una sola vez).

## Datos
`datos-iniciales.json` y las copias de seguridad tienen datos reales de clientes: están en `.gitignore`
y no se suben al repo.
