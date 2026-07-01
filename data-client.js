// ============================================================
// CAPA DE DATOS — lee proyectos desde Supabase
// ============================================================

/**
 * Devuelve la lista de proyectos ordenada por número de lámina.
 * Lanza un error legible si Supabase no responde (red, claves
 * mal configuradas, etc.) en vez de fallar en silencio.
 */
async function fetchProyectos() {
  const { data, error } = await supabaseClient
    .from('proyectos')
    .select('*')
    .order('num', { ascending: true });

  if (error) {
    console.error('Error al cargar proyectos desde Supabase:', error);
    throw new Error('No se pudieron cargar los proyectos. Revisa la configuración de Supabase en supabase-config.js.');
  }

  // Normalizamos los nombres de campo al formato que ya usa
  // el resto del sitio (id, img, etc.) para no tener que
  // reescribir main.js ni las páginas de detalle.
  return data.map(p => ({
    id: p.slug,
    num: String(p.num).padStart(2, '0'),
    title: p.title,
    year: p.year || '',
    lugar: p.lugar || '',
    zona: p.zona || '',
    edificio: p.edificio || '',
    arquitecto: p.arquitecto || '',
    cliente: p.cliente || '',
    programa: p.programa || '',
    software: p.software || '',
    descripcion: p.descripcion || '',
    tags: p.tags || [],
    img: p.img_url || '',
  }));
}

/**
 * Muestra un mensaje de error visible en pantalla cuando la
 * carga de datos falla, en vez de dejar la página en blanco
 * sin explicación.
 */
function showLoadError(container, err) {
  if (!container) return;
  container.innerHTML = `
    <div style="padding:40px 0; font-family:var(--mono); font-size:0.85rem; color:var(--clay);">
      No se han podido cargar los proyectos.<br>
      <span style="color:var(--stone);">${err.message}</span>
    </div>`;
}
