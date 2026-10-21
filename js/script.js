/* Rutas compatibles con index.html en la raíz y las otras páginas en /html/. */
window.CranRutas = (() => {
  const esSubpagina = /\/html\/[^/]+\.html$/i.test(window.location.pathname);
  const prefijoImagen = esSubpagina ? '../img/' : 'img/';
  return {
    esSubpagina,
    imagen(ruta) {
      if (typeof ruta !== 'string' || /^(?:https?:|data:|blob:|\/\/)/i.test(ruta)) return ruta;
      if (ruta.startsWith('assets/')) return prefijoImagen + ruta.slice(7);
      if (ruta.startsWith('img/')) return prefijoImagen + ruta.slice(4);
      if (ruta.startsWith('../img/')) return prefijoImagen + ruta.slice(7);
      return ruta;
    },
    pagina(ruta) {
      if (typeof ruta !== 'string' || /^(?:https?:|mailto:|tel:|#|\/\/)/i.test(ruta)) return ruta;
      if (!/^[a-z\d_-]+\.html(?:[?#].*)?$/i.test(ruta)) return ruta;
      return ruta.startsWith('index.html') ? (esSubpagina ? '../' + ruta : ruta)
        : (esSubpagina ? ruta : 'html/' + ruta);
    }
  };
})();

/* interacciones menu */
(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const modal = document.getElementById('site-modal');
  const modalInner = document.getElementById('modal-inner');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  /* Navegación responsive */
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    menuButton?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menú');
  };

  menuButton?.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuButton.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1030) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  /* Filtrado de tarjetas */
  const chips = [...document.querySelectorAll('[data-filter]')];
  const products = [...document.querySelectorAll('.product-card')];

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const selectedCategory = chip.dataset.filter;
      chips.forEach((item) => {
        const isSelected = item === chip;
        item.classList.toggle('is-active', isSelected);
        item.setAttribute('aria-pressed', String(isSelected));
      });
      products.forEach((product) => {
        product.hidden = selectedCategory !== 'all' && product.dataset.category !== selectedCategory;
      });
    });
  });

  /* cerrar menu */
  function showModal(markup) {
    modalInner.innerHTML = markup;
    closeMenu();
    if (!modal.open) modal.showModal();
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    if (modal.open) modal.close();
  }
  modal?.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  modal?.addEventListener('close', () => document.body.classList.remove('modal-open'));

  /* productoss */
  const productData = {
    jugo: {
      category: 'Bebidas', title: 'Jugo de cranberry', image: window.CranRutas.imagen('assets/cranberry-juice.webp'),
      alt: 'Vaso con jugo de cranberry',
      description: 'El sabor intenso y refrescante del cranberry es perfecto para acompañar una pausa o comenzar la mañana.',
    },
    desayuno: {
      category: 'Desayunos', title: 'Desayuno con cranberry', image: window.CranRutas.imagen('assets/cranberry-yogurt.webp'),
      alt: 'Yogur con granola y cranberry',
      description: 'Una combinación de yogur cremoso, granola crujiente y el toque vibrante del cranberry.',
    },
    acompanamiento: {
      category: 'Acompañamientos', title: 'Momentos para compartir', image: window.CranRutas.imagen('assets/cranberry-toast.webp'),
      alt: 'Tostadas para acompañar con preparaciones de cranberry',
      description: 'Un poco de cranberry puede darle un giro especial a tostadas, tablas y preparaciones para compartir.',
    },
  };
  document.querySelectorAll('[data-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = productData[button.dataset.product];
      if (!item) return;
      showModal(`
        <span class="modal-kicker">${item.category} · Ejemplo de contenido</span>
        <h2 id="modal-title">${item.title}</h2>
        <img class="modal-product-img" src="${item.image}" alt="${item.alt}" />
        <p>${item.description}</p>
        <p class="modal-feedback">Esta ficha es demostrativa. Puedes reemplazarla por los productos reales de tu marca.</p>
      `);
    });
  });


  /* formulario de contacto */
  document.querySelector('[data-contact]')?.addEventListener('click', () => {
    showModal(`
      <span class="modal-kicker">Hablemos</span><h2 id="modal-title">Contáctanos</h2>
      <p>¿Tienes una pregunta? Puedes ver cómo se integraría un formulario de contacto en esta web.</p>
      <form class="modal-form" id="contact-form">
        <label>Tu nombre<input name="contactName" autocomplete="name" minlength="2" required placeholder="Nombre" /></label>
        <label>Correo electrónico<input type="email" name="contactEmail" autocomplete="email" required placeholder="nombre@correo.cl" /></label>
        <label>Tu mensaje<input name="message" required minlength="8" placeholder="Escribe tu consulta" /></label>
        <button class="btn btn-primary" type="submit">Enviar consulta</button>
      </form><p class="modal-feedback" id="modal-feedback" role="status" hidden></p>
    `);
  });


  modal?.addEventListener('submit', (event) => {
    if (event.target.id !== 'contact-form') return;
    event.preventDefault();
    const feedback = modal.querySelector('#modal-feedback');
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = 'Este es un prototipo visual: los datos no se han enviado ni guardado. Conecta un servicio real para activar esta función.';
    feedback.focus?.();
  });
})();
/* reproductor de video */
(() => {
  'use strict';
  const video = document.getElementById('brand-film-video');
  const button = document.getElementById('brand-film-play');
  const frame = document.getElementById('brand-film-frame');
  if (!video || !button || !frame) return;

  button.addEventListener('click', async () => {
    video.controls = true;
    try {
      await video.play();
    } catch {
      // Deja visibles los controles nativos si el navegador bloquea la reproducción.
      frame.classList.remove('is-playing');
    }
  });
  video.addEventListener('play', () => frame.classList.add('is-playing'));
  video.addEventListener('pause', () => frame.classList.remove('is-playing'));
  video.addEventListener('ended', () => {
    frame.classList.remove('is-playing');
    video.controls = false;
    video.currentTime = 0;
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting && !video.paused) video.pause();
    }, { threshold: .15 });
    observer.observe(frame);
  }
})();


/* Control del desplegable Administración en escritorio */
(() => {
  const menu = document.querySelector('.ce-admin-menu');
  if (!menu) return;
  const page = location.pathname.split('/').pop();
  menu.querySelectorAll('a').forEach(link => {
    if (link.getAttribute('href') === page) link.setAttribute('aria-current','page');
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
})();
