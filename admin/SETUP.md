# Configuración del área privada (Supabase)

Esta guía te lleva paso a paso para activar el panel de gestión de
proyectos. No necesitas saber programar, solo seguir los pasos en orden.

## 1. Crear cuenta y proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta gratuita (puedes entrar con GitHub o Google).
2. Pulsa "New project".
3. Ponle un nombre, por ejemplo `elias-torres-portfolio`.
4. Elige una contraseña de base de datos segura y guárdala en un sitio seguro (no es la que usarás para entrar al panel, es la de la propia base de datos).
5. Elige la región más cercana (Europe / Frankfurt suele ser la más rápida desde España).
6. Espera 1-2 minutos a que el proyecto se cree.

## 2. Crear la tabla de proyectos

1. En el menú izquierdo, entra en **SQL Editor**.
2. Pulsa **New query**.
3. Abre el archivo `schema.sql` (en esta misma carpeta), copia todo su contenido y pégalo en el editor.
4. Pulsa **Run** (o Ctrl+Enter). Debería decir "Success. No rows returned".

## 3. Crear el bucket de imágenes

1. En el menú izquierdo, entra en **Storage**.
2. Pulsa **New bucket**.
3. Nombre exacto: `project-images` (en minúsculas, con guion, sin espacios).
4. Marca la opción **Public bucket** (importante: si no, las fotos no se verán en la web pública).
5. Pulsa **Create bucket**.

Las políticas de quién puede subir/borrar ya se crearon en el paso 2 (están incluidas en `schema.sql`).

## 4. Crear tu usuario de acceso al panel

1. En el menú izquierdo, entra en **Authentication** → **Users**.
2. Pulsa **Add user** → **Create new user**.
3. Pon tu correo y una contraseña a tu elección. Esa es la que usarás para entrar en `admin/login.html`.
4. Marca **Auto Confirm User** para no tener que verificar el correo.
5. Pulsa **Create user**.

## 5. Conectar el sitio con tu proyecto de Supabase

1. En el menú izquierdo, entra en **Project Settings** → **API**.
2. Copia el valor de **Project URL**.
3. Copia el valor de **anon public** (clave pública, NO la "service_role").
4. Abre el archivo `supabase-config.js` (en la raíz del sitio, junto a `index.html`) y sustituye:
   ```js
   const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'TU-CLAVE-ANON-PUBLICA';
   ```
   por tus valores reales.

## 6. Migrar tus 12 proyectos actuales a la base de datos

Tienes dos opciones:

**Opción A — manual (recomendada para empezar):**
Entra en `admin/login.html`, inicia sesión, y ve dando de alta cada uno de tus 12 proyectos actuales a mano desde el formulario del panel (título, lugar, descripción, etc.) y sube su imagen correspondiente. Tarda unos 20-30 minutos pero te sirve también para familiarizarte con el panel.

**Opción B — importación rápida por SQL:**
Si prefieres no escribir los 12 a mano, dime y te genero un script SQL de importación a partir de los datos que ya tenemos en `data.js`, listo para pegar en el SQL Editor (las imágenes seguirían enlazadas a Cargo Collective hasta que las resubas desde el panel).

## 7. Probar que todo funciona

1. Abre `admin/login.html` en tu navegador, entra con tu usuario.
2. Crea un proyecto de prueba con una imagen.
3. Abre `index.html` (la web pública) y comprueba que aparece en el listado.
4. Vuelve al panel y bórralo.

## Notas de seguridad

- La clave `anon` que pones en `supabase-config.js` es segura de subir a un repositorio público (incluso en GitHub): por diseño, esa clave solo puede hacer lo que las políticas RLS de `schema.sql` permiten (leer todo, escribir solo si hay sesión iniciada).
- Nunca copies la clave `service_role` en ningún archivo del sitio. Esa sí da acceso total sin restricciones y debe permanecer secreta.
- Si en algún momento sospechas que tu contraseña de acceso al panel se ha visto comprometida, cámbiala desde Supabase → Authentication → Users.
