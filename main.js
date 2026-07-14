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
        '<span class="row-thumb"><img src="'+p.img+'" alt="" loading="lazy"></span>' +
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


// ---------- Animaciones de entrada ----------
(function(){
  // Fade-in escalonado para tarjetas del grid
  function animateGrid(){
    var cards = document.querySelectorAll('.grid-card');
    cards.forEach(function(card, i){
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px) scale(0.95)';
      card.style.transition = 'opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1)';
      card.style.transitionDelay = (i * 80) + 'ms';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
        });
      });
    });
  }

  // Fade-in escalonado para filas de la lista
  function animateList(){
    var rows = document.querySelectorAll('.project-row');
    rows.forEach(function(row, i){
      row.style.opacity = '0';
      row.style.transform = 'translateX(-24px)';
      row.style.transition = 'opacity .5s cubic-bezier(.22,.61,.36,1), transform .5s cubic-bezier(.22,.61,.36,1)';
      row.style.transitionDelay = (i * 60) + 'ms';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          row.style.opacity = '1';
          row.style.transform = 'translateX(0)';
        });
      });
    });
  }

  // Exponer para que se llamen tras renderizar
  window._animateGrid = animateGrid;
  window._animateList = animateList;
})();

// ---------- Scroll suave al navegar entre fichas ----------
(function(){
  document.addEventListener('click', function(e){
    var link = e.target.closest('#d-prev, #d-next');
    if(link){
      // Scroll al inicio antes de navegar
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();

// ---------- Hero visual: proyecto marcado como destacado ----------
function renderHeroVisual(proyectos){
  var heroVisual = document.getElementById('hero-visual');
  var heroImg    = document.getElementById('hero-img');
  var heroLabel  = document.getElementById('hero-label');
  var heroCount  = document.getElementById('hero-count');
  if(!heroVisual) return;

  // Actualizar contador
  if(heroCount) heroCount.textContent = proyectos.length + ' seleccionados';

  // Buscar el proyecto marcado como destacado; si no hay, usar el primero
  var p = proyectos.find(function(x){ return x.destacado; }) || proyectos[0];
  if(!p || !p.img) return;

  heroImg.src = p.img;
  heroImg.alt = p.title;
  heroVisual.href = 'proyectos/detalle.html?p=' + p.id;
  if(heroLabel) heroLabel.textContent = p.title;

  // Mostrar con animación
  heroVisual.style.opacity = '0';
  heroVisual.style.transform = 'translateX(20px)';
  heroVisual.style.transition = 'opacity .7s ease, transform .7s ease';
  heroVisual.style.transitionDelay = '200ms';
  heroVisual.style.display = 'block';
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      heroVisual.style.opacity = '1';
      heroVisual.style.transform = 'translateX(0)';
    });
  });
}
