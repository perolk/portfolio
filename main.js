// ---------- Mobile nav toggle ----------
(function(){
  var btn = document.getElementById('navtoggle');
  var nav = document.getElementById('mainnav');
  if(!btn || !nav) return;

  // Crear overlay dinámicamente
  var overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  function openMenu(){
    nav.classList.add('open');
    overlay.classList.add('open');
    btn.textContent = '✕';
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    nav.classList.remove('open');
    overlay.classList.remove('open');
    btn.textContent = '☰';
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', function(){
    nav.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Cerrar al pulsar el overlay
  overlay.addEventListener('click', closeMenu);

  // Cerrar al navegar
  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });

  // Cerrar con Escape
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeMenu();
  });
})();

// ---------- Helpers ----------
function excerpt(text, max){
  if(!text) return '';
  if(text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

// ---------- Render: list view ----------
function renderListView(proyectos){
  var list = document.getElementById('project-list');
  if(!list) return;
  list.innerHTML = proyectos.map(function(p){
    var tags = p.tags.map(function(t){ return '<span>'+t+'</span>'; }).join('');
    return (
      '<a class="project-row" href="proyectos/detalle.html?p='+p.id+'">' +
        '<span class="row-num">Pl. '+p.num+'</span>' +
        '<span class="row-main">' +
          '<span class="row-title">'+p.title+'</span>' +
          '<span class="row-tags">'+tags+'</span>' +
        '</span>' +
        '<span class="row-year">'+p.year+'</span>' +
        '<span class="row-preview"><img src="'+p.img+'" alt="" loading="lazy"></span>' +
      '</a>'
    );
  }).join('');
}

// ---------- Render: grid view ----------
function renderGridView(proyectos){
  var grid = document.getElementById('project-grid');
  if(!grid) return;
  grid.innerHTML = proyectos.map(function(p){
    var tags = p.tags.map(function(t){ return '<span>'+t+'</span>'; }).join('');
    return (
      '<a class="grid-card" href="proyectos/detalle.html?p='+p.id+'">' +
        '<span class="card-fig">' +
          '<img src="'+p.img+'" alt="'+p.title+'" loading="lazy">' +
          '<span class="card-plate">Pl. '+p.num+'</span>' +
        '</span>' +
        '<div class="card-title">'+p.title+'</div>' +
        '<div class="card-excerpt">'+excerpt(p.descripcion, 80)+'</div>' +
        '<div class="card-tags">'+tags+'</div>' +
      '</a>'
    );
  }).join('');
}

// ---------- Init: cargar proyectos desde Supabase y pintar ambas vistas ----------
(function(){
  var gridEl = document.getElementById('project-grid');
  var listEl = document.getElementById('project-list');
  var toggle = document.getElementById('viewToggle');
  if(!gridEl && !listEl) return; // esta página no muestra el índice de proyectos

  if(typeof fetchProyectos !== 'function'){
    console.error('data-client.js no está cargado antes de main.js');
    return;
  }

  fetchProyectos().then(function(proyectos){
    renderGridView(proyectos);
    renderListView(proyectos);
    initViewToggle();
  }).catch(function(err){
    showLoadError(gridEl, err);
  });

  function initViewToggle(){
    if(!toggle || !gridEl || !listEl) return;
    setView('grid');
    toggle.addEventListener('click', function(e){
      var b = e.target.closest('button[data-view]');
      if(!b) return;
      setView(b.dataset.view);
    });
    function setView(view){
      gridEl.style.display = view === 'grid' ? '' : 'none';
      listEl.style.display = view === 'list' ? '' : 'none';
      toggle.querySelectorAll('button').forEach(function(b){
        b.classList.toggle('active', b.dataset.view === view);
      });
    }
  }
})();
