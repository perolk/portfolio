// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ------------------------------------------------------------
// Sustituye estos dos valores por los de tu propio proyecto
// de Supabase (Project Settings > API).
//
// SUPABASE_ANON_KEY es la clave PÚBLICA ("anon"). Está pensada
// para usarse en el navegador y es segura de subir a un repo
// público: el acceso real se controla con las políticas RLS
// que ejecutaste en schema.sql, no por mantener esta clave en
// secreto. NUNCA uses aquí la "service_role key" (esa sí es
// secreta y nunca debe estar en código de frontend).
// ============================================================

const SUPABASE_URL = 'https://enozypdxgijlzvxgxmhj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L--ewhyiWdHjB0cSlgDkSQ_F2tvFQgh';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
