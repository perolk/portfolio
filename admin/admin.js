// ============================================================
// PANEL PRIVADO — admin.js
// ============================================================

let currentProyectos = [];
let editingId = null;       // uuid del proyecto en edición, o null si es alta nueva
let selectedFile = null;    // archivo de imagen elegido en el formulario

const form = document.getElementById('project-form');
const listEl = document.getElementById('admin-list');
const countLabel = document.getElementById('count-label');
const formMsg = document.getElementById('form-msg');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

// ---------- Auth guard: si no hay sesión, fuera ----------
async function requireAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    location.href = 'login.html';
    return false;
  }
  return true;
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.href = 'login.html';
});

// ---------- Cargar y pintar listado ----------
async function loadProyectos() {
  const { data, error } = await supabaseClient
    .from('proyectos')
    .select('*')
    .order('num', { ascending: true });

  if (error) {
    listEl.innerHTML = `<p style="color:var(--clay); font-family:var(--mono); font-size:0.8rem;">Error al cargar: ${error.message}</p>`;
    return;
  }

  currentProyectos = data;
  countLabel.textContent = `${data.length} proyecto${data.length === 1 ? '' : 's'}`;
  renderList();
}

function renderList() {
  listEl.innerHTML = currentProyectos.map(p => `
    <div class="admin-row">
      <img src="${p.img_url || ''}" alt="">
      <div>
        <div class="num">Pl. ${String(p.num).padStart(2,'0')}</div>
        <div class="title">${p.title}</div>
      </div>
      <div class="actions">
        <button data-edit="${p.id}">Editar</button>
      </div>
      <div class="actions">
        <button data-delete="${p.id}" class="danger">Borrar</button>
      </div>
    </div>
  `).join('');
}

listEl.addEventListener('click', (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.delete;
  if (editId) startEdit(editId);
  if (delId) deleteProyecto(delId);
});

// ---------- Rellenar formulario para edición ----------
function startEdit(id) {
  const p = currentProyectos.find(x => x.id === id);
  if (!p) return;

  editingId = id;
  formTitle.textContent = `Editando: ${p.title}`;
  cancelBtn.style.display = 'block';

  document.getElementById('f-id').value = p.id;
  document.getElementById('f-title').value = p.title || '';
  document.getElementById('f-slug').value = p.slug || '';
  document.getElementById('f-num').value = p.num || '';
  document.getElementById('f-year').value = p.year || '';
  document.getElementById('f-lugar').value = p.lugar || '';
  document.getElementById('f-cliente').value = p.cliente || '';
  document.getElementById('f-programa').value = p.programa || '';
  document.getElementById('f-edificio').value = p.edificio || '';
  document.getElementById('f-arquitecto').value = p.arquitecto || '';
  document.getElementById('f-zona').value = p.zona || '';
  document.getElementById('f-software').value = p.software || '';
  document.getElementById('f-tags').value = (p.tags || []).join(', ');
  document.getElementById('f-desc').value = p.descripcion || '';

  const preview = document.getElementById('img-preview');
  if (p.img_url) {
    preview.src = p.img_url;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  selectedFile = null;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  selectedFile = null;
  form.reset();
  formTitle.textContent = 'Nuevo proyecto';
  cancelBtn.style.display = 'none';
  document.getElementById('img-preview').style.display = 'none';
  formMsg.style.display = 'none';
}

// ---------- Preview de imagen seleccionada ----------
document.getElementById('f-image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  const preview = document.getElementById('img-preview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
});

// ---------- Borrar proyecto ----------
async function deleteProyecto(id) {
  const p = currentProyectos.find(x => x.id === id);
  if (!p) return;
  const ok = confirm(`¿Seguro que quieres borrar "${p.title}"? Esta acción no se puede deshacer.`);
  if (!ok) return;

  const { error } = await supabaseClient.from('proyectos').delete().eq('id', id);
  if (error) {
    alert('Error al borrar: ' + error.message);
    return;
  }
  if (editingId === id) resetForm();
  await loadProyectos();
}

// ---------- Subir imagen a Storage y devolver su URL pública ----------
async function uploadImage(file, slug) {
  const ext = file.name.split('.').pop();
  const path = `${slug}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from('project-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error('Error al subir la imagen: ' + uploadError.message);

  const { data } = supabaseClient.storage.from('project-images').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Guardar (crear o actualizar) ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMsg.style.display = 'none';
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    const slug = document.getElementById('f-slug').value.trim().toLowerCase();
    if (!/^[a-z0-9\-]+$/.test(slug)) {
      throw new Error('El slug solo puede tener letras minúsculas, números y guiones.');
    }

    let imgUrl = document.getElementById('img-preview').src;
    if (selectedFile) {
      imgUrl = await uploadImage(selectedFile, slug);
    }
    if (!editingId && !selectedFile) {
      throw new Error('Sube una imagen principal para el proyecto.');
    }

    const tags = document.getElementById('f-tags').value
      .split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      title: document.getElementById('f-title').value.trim(),
      slug,
      num: parseInt(document.getElementById('f-num').value, 10),
      year: document.getElementById('f-year').value.trim(),
      lugar: document.getElementById('f-lugar').value.trim(),
      cliente: document.getElementById('f-cliente').value.trim(),
      programa: document.getElementById('f-programa').value.trim(),
      edificio: document.getElementById('f-edificio').value.trim(),
      arquitecto: document.getElementById('f-arquitecto').value.trim(),
      zona: document.getElementById('f-zona').value.trim(),
      software: document.getElementById('f-software').value.trim(),
      descripcion: document.getElementById('f-desc').value.trim(),
      tags,
      img_url: imgUrl,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabaseClient.from('proyectos').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabaseClient.from('proyectos').insert(payload));
    }

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe un proyecto con ese slug. Elige otro.');
      }
      throw new Error(error.message);
    }

    formMsg.className = 'ok';
    formMsg.textContent = editingId ? 'Proyecto actualizado.' : 'Proyecto creado.';
    formMsg.style.display = 'block';
    resetForm();
    await loadProyectos();

  } catch (err) {
    formMsg.className = 'err';
    formMsg.textContent = err.message;
    formMsg.style.display = 'block';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
  }
});

// ---------- Arranque ----------
(async function init() {
  const ok = await requireAuth();
  if (!ok) return;
  await loadProyectos();
})();
