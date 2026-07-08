// ============================================================
// PANEL PRIVADO — admin.js
// Layout: vista listado / vista edición a pantalla completa
// ============================================================

let currentProyectos = [];
let editingId   = null;
let editingSlug = null;
let selectedFile = null;
let galleryItems = [];
let dragSrcIdx   = null;

// Elementos UI
const viewList    = document.getElementById('view-list');
const viewEdit    = document.getElementById('view-edit');
const form        = document.getElementById('project-form');
const listEl      = document.getElementById('admin-list');
const countLabel  = document.getElementById('count-label');
const formMsg     = document.getElementById('form-msg');
const saveBtn     = document.getElementById('save-btn');
const editTitle   = document.getElementById('edit-title');
const galleryGrid = document.getElementById('gallery-grid');
const dropZone    = document.getElementById('drop-zone');
const fileInput   = document.getElementById('f-gallery');

// ---------- Navegación entre vistas ----------
function showList(){
  viewList.style.display = 'block';
  viewEdit.style.display = 'none';
  window.scrollTo(0,0);
}
function showEdit(){
  viewList.style.display = 'none';
  viewEdit.style.display = 'block';
  window.scrollTo(0,0);
}

document.getElementById('btn-new').addEventListener('click', () => {
  resetForm();
  editTitle.textContent = 'Nuevo proyecto';
  showEdit();
});
document.getElementById('btn-back').addEventListener('click', () => { resetForm(); showList(); });
document.getElementById('btn-back2').addEventListener('click', () => { resetForm(); showList(); });

// ---------- Auth ----------
async function requireAuth(){
  const { data } = await supabaseClient.auth.getSession();
  if(!data.session){ location.href = 'login.html'; return false; }
  return true;
}
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.href = 'login.html';
});

// ---------- Cargar listado ----------
async function loadProyectos(){
  const { data, error } = await supabaseClient
    .from('proyectos').select('*').order('num', { ascending: true });
  if(error){
    listEl.innerHTML = `<p style="color:var(--clay);font-family:var(--mono);font-size:.8rem;padding:20px 0;">Error: ${error.message}</p>`;
    return;
  }
  currentProyectos = data;
  countLabel.textContent = `${data.length} proyecto${data.length === 1 ? '' : 's'}`;
  renderList();
}

function renderList(){
  listEl.innerHTML = currentProyectos.map(p => `
    <div class="admin-row">
      <img src="${p.img_url || ''}" alt="">
      <div>
        <div class="anum">Pl. ${String(p.num).padStart(2,'0')}
          ${p.publicado === false ? '<span class="abadge">BORRADOR</span>' : ''}
        </div>
        <div class="atitle">${p.title}</div>
      </div>
      <button class="abtn" data-edit="${p.id}">Editar</button>
      <button class="abtn danger" data-delete="${p.id}">Borrar</button>
    </div>`).join('');
}

listEl.addEventListener('click', e => {
  const editId   = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;
  if(editId)   startEdit(editId);
  if(deleteId) deleteProyecto(deleteId);
});

// ---------- Editar ----------
async function startEdit(id){
  const p = currentProyectos.find(x => x.id === id);
  if(!p) return;
  editingId   = id;
  editingSlug = p.slug;
  editTitle.textContent = `Editando: ${p.title}`;

  ['title','slug','year','lugar','cliente','programa','edificio','arquitecto','zona','software'].forEach(k => {
    const el = document.getElementById('f-' + k);
    if(el) el.value = p[k] || '';
  });
  document.getElementById('f-num').value  = p.num || '';
  document.getElementById('f-tags').value = (p.tags || []).join(', ');
  document.getElementById('f-desc').value = p.descripcion || '';
  document.getElementById('f-publicado').checked = p.publicado !== false;

  const preview = document.getElementById('img-preview');
  const noImg   = document.getElementById('img-no-img');
  if(p.img_url){
    preview.src = p.img_url;
    preview.style.display = 'block';
    noImg.style.display = 'none';
  } else {
    preview.style.display = 'none';
    noImg.style.display = 'flex';
  }
  selectedFile = null;
  await loadGallery(p.slug);
  showEdit();
}

function resetForm(){
  editingId = editingSlug = selectedFile = null;
  form.reset();
  document.getElementById('f-publicado').checked = true;
  document.getElementById('img-preview').style.display = 'none';
  document.getElementById('img-no-img').style.display = 'flex';
  if(formMsg){ formMsg.className = ''; formMsg.style.display = 'none'; }
  galleryItems = [];
  renderGallery();
}

// ---------- Imagen principal ----------
document.getElementById('f-image').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  selectedFile = file;
  const preview = document.getElementById('img-preview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
  document.getElementById('img-no-img').style.display = 'none';
});

// ---------- Borrar proyecto ----------
async function deleteProyecto(id){
  const p = currentProyectos.find(x => x.id === id);
  if(!p || !confirm(`¿Borrar "${p.title}"? Esta acción no se puede deshacer.`)) return;
  const { error } = await supabaseClient.from('proyectos').delete().eq('id', id);
  if(error){ alert('Error: ' + error.message); return; }
  await loadProyectos();
}

// ---------- Subir imagen ----------
async function uploadImage(file, prefix){
  const ext  = file.name.split('.').pop();
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from('project-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if(error) throw new Error('Error al subir la imagen: ' + error.message);
  return supabaseClient.storage.from('project-images').getPublicUrl(path).data.publicUrl;
}

// ============================================================
// GALERÍA
// ============================================================

async function loadGallery(slug){
  const { data, error } = await supabaseClient
    .from('proyecto_imagenes').select('*')
    .eq('proyecto_slug', slug).order('orden', { ascending: true });
  galleryItems = error ? [] : data.map(r => ({ ...r, isNew: false }));
  renderGallery();
}

function countParrafos(){
  const desc = document.getElementById('f-desc').value.trim();
  if(!desc) return 1;
  const bloques = desc.split(/\n[ \t]*\n/).filter(p => p.trim());
  return bloques.length > 1 ? bloques.length : (desc.split('\n').filter(p => p.trim()).length || 1);
}

function renderGallery(){
  galleryGrid.innerHTML = '';
  const numP = countParrafos();

  galleryItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.draggable = true;
    div.dataset.idx = idx;

    // Opciones de posición
    let posOpts = '';
    for(let n = 1; n <= numP; n++){
      posOpts += `<option value="${n}" ${item.posicion == n ? 'selected' : ''}>Tras párrafo ${n}${n === numP ? ' (final)' : ''}</option>`;
    }

    const esContenido = item.tipo === 'contenido';
    const badgeClass  = esContenido ? 'gi-badge contenido' : 'gi-badge';
    const badgeText   = esContenido ? `Contenido · Tras párr. ${item.posicion || 1}` : 'Galería';

    div.innerHTML = `
      <img src="${item.url}" alt="${item.caption || ''}" loading="lazy">
      <span class="${badgeClass}">${badgeText}</span>
      <span class="gi-handle">⠿</span>
      <div class="gi-controls">
        <div class="gi-type">
          <button type="button" class="${!esContenido ? 'active' : ''}"
            onclick="setTipo(${idx},'galeria')">Galería</button>
          <button type="button" class="${esContenido ? 'active' : ''}"
            onclick="setTipo(${idx},'contenido')">Contenido</button>
        </div>
        <div class="gi-pos" style="display:${esContenido ? 'block' : 'none'}">
          <select onchange="galleryItems[${idx}].posicion=parseInt(this.value);renderGallery()">
            ${posOpts}
          </select>
        </div>
        <div class="gi-caption">
          <input type="text" placeholder="Pie de foto (opcional)"
            value="${item.caption || ''}"
            oninput="galleryItems[${idx}].caption=this.value">
        </div>
      </div>
      <button type="button" class="gi-del" onclick="removeGalleryItem(${idx})">✕</button>`;

    // Drag reorder
    div.addEventListener('dragstart', e => {
      dragSrcIdx = idx;
      setTimeout(() => div.classList.add('dragging'), 0);
      e.dataTransfer.effectAllowed = 'move';
    });
    div.addEventListener('dragend',  () => div.classList.remove('dragging'));
    div.addEventListener('dragover', e => {
      e.preventDefault();
      galleryGrid.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('drag-over'));
      div.classList.add('drag-over');
    });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault();
      div.classList.remove('drag-over');
      if(dragSrcIdx === null || dragSrcIdx === idx) return;
      const moved = galleryItems.splice(dragSrcIdx, 1)[0];
      galleryItems.splice(idx, 0, moved);
      dragSrcIdx = null;
      renderGallery();
    });

    galleryGrid.appendChild(div);
  });
}

document.getElementById('f-desc').addEventListener('input', () => renderGallery());

function setTipo(idx, tipo){
  galleryItems[idx].tipo = tipo;
  if(tipo === 'galeria') galleryItems[idx].posicion = null;
  if(tipo === 'contenido' && !galleryItems[idx].posicion) galleryItems[idx].posicion = 1;
  renderGallery();
}

function removeGalleryItem(idx){
  galleryItems.splice(idx, 1);
  renderGallery();
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); handleGalleryFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', e => handleGalleryFiles(e.target.files));

function handleGalleryFiles(files){
  Array.from(files).forEach(file => {
    galleryItems.push({
      url: URL.createObjectURL(file),
      caption: '', tipo: 'galeria', posicion: null,
      orden: galleryItems.length, file, isNew: true
    });
  });
  renderGallery();
}

async function saveGallery(slug){
  for(let item of galleryItems){
    if(item.isNew && item.file){
      item.url = await uploadImage(item.file, slug + '-gallery');
      delete item.file;
      item.isNew = false;
    }
  }
  const { error: delErr } = await supabaseClient
    .from('proyecto_imagenes').delete().eq('proyecto_slug', slug);
  if(delErr) throw new Error('Error al actualizar galería: ' + delErr.message);
  if(galleryItems.length === 0) return;

  const rows = galleryItems.map((item, i) => ({
    proyecto_slug: slug,
    url:      item.url,
    caption:  item.caption || null,
    tipo:     item.tipo || 'galeria',
    orden:    i,
    posicion: item.tipo === 'contenido' ? (item.posicion || 1) : null,
  }));
  const { error: insErr } = await supabaseClient.from('proyecto_imagenes').insert(rows);
  if(insErr) throw new Error('Error al guardar galería: ' + insErr.message);
}

// ============================================================
// GUARDAR PROYECTO
// ============================================================
form.addEventListener('submit', async e => {
  e.preventDefault();
  formMsg.style.display = 'none';
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    const slug = document.getElementById('f-slug').value.trim().toLowerCase();
    if(!/^[a-z0-9\-]+$/.test(slug)) throw new Error('El slug solo puede tener letras minúsculas, números y guiones.');

    const num = parseInt(document.getElementById('f-num').value, 10);
    const numDuplicado = currentProyectos.find(p => p.num === num && p.id !== editingId);
    if(numDuplicado) throw new Error(`El número de lámina ${num} ya lo usa "${numDuplicado.title}". Elige otro.`);

    let imgUrl = document.getElementById('img-preview').src;
    if(selectedFile) imgUrl = await uploadImage(selectedFile, slug);
    if(!editingId && !selectedFile) throw new Error('Sube una imagen principal para el proyecto.');

    const tags = document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const publicado = document.getElementById('f-publicado').checked;

    const payload = {
      title:       document.getElementById('f-title').value.trim(),
      slug,
      num,
      year:        document.getElementById('f-year').value.trim(),
      lugar:       document.getElementById('f-lugar').value.trim(),
      cliente:     document.getElementById('f-cliente').value.trim(),
      programa:    document.getElementById('f-programa').value.trim(),
      edificio:    document.getElementById('f-edificio').value.trim(),
      arquitecto:  document.getElementById('f-arquitecto').value.trim(),
      zona:        document.getElementById('f-zona').value.trim(),
      software:    document.getElementById('f-software').value.trim(),
      descripcion: document.getElementById('f-desc').value.trim(),
      tags,
      img_url:     imgUrl,
      publicado,
      updated_at:  new Date().toISOString(),
    };

    let error;
    if(editingId){
      ({ error } = await supabaseClient.from('proyectos').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabaseClient.from('proyectos').insert(payload));
    }
    if(error){
      if(error.code === '23505') throw new Error('Ya existe un proyecto con ese slug.');
      throw new Error(error.message);
    }

    await saveGallery(editingSlug || slug);

    formMsg.className = 'ok';
    formMsg.textContent = editingId ? 'Proyecto actualizado correctamente.' : 'Proyecto creado correctamente.';
    formMsg.style.display = 'block';

    await loadProyectos();

    // Volver al listado tras 1.5s
    setTimeout(() => { resetForm(); showList(); }, 1500);

  } catch(err){
    formMsg.className = 'err';
    formMsg.textContent = err.message;
    formMsg.style.display = 'block';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar proyecto';
  }
});

// ---------- Arranque ----------
(async function init(){
  const ok = await requireAuth();
  if(!ok) return;
  await loadProyectos();
  showList();
})();
