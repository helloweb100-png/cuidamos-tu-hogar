/* =========================================================
   Cuidamos Tu Hogar · script.js
   Sin librerías externas: todo es JavaScript nativo.
   ========================================================= */

/* ÚNICO lugar donde vive el número de WhatsApp (formato 52 + 10 dígitos).
   Si queda vacío, los botones y el formulario de WhatsApp se ocultan solos. */
const WHATSAPP = "523141609898";

(function () {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const DEFAULT_MSG = 'Hola, quiero mi cotización gratis para mi hogar en Manzanillo.';
  const waUrl = (msg) => 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg || DEFAULT_MSG);

  /* ---------------------------------------------------------
     1. Cargador (se oculta solo en ~1.8 s; el CSS tiene respaldo)
     --------------------------------------------------------- */
  const loader = $('#loader');
  function finishLoader() {
    if (!loader) return;
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 800);
  }
  (function runLoader() {
    if (!loader) return;
    if (reduce) { setTimeout(finishLoader, 250); return; }
    const num = $('#ld-num'), bar = $('#ld-bar-fill');
    const dur = 1700, t0 = performance.now();
    (function tick(now) {
      const t = clamp((now - t0) / dur);
      const e = ease(t);
      if (num) num.textContent = Math.round(e * 100);
      if (bar) bar.style.width = (e * 100) + '%';
      if (t < 1) requestAnimationFrame(tick); else finishLoader();
    })(t0);
  })();

  /* ---------------------------------------------------------
     2. Todo lo demás: si algo falla, la página sigue visible
     --------------------------------------------------------- */
  try {
    root.classList.add('js');

    /* ---------- WhatsApp ---------- */
    function initWhatsApp() {
      const links = $$('[data-wa]');
      if (!WHATSAPP) {
        links.forEach((a) => { a.hidden = true; });
        const btn = $('#form-btn');
        if (btn) btn.hidden = true;
        const note = $('.form-note');
        if (note) note.textContent = 'Muy pronto podrás escribirnos desde aquí.';
        return;
      }
      links.forEach((a) => {
        a.href = waUrl(a.dataset.msg);
        a.target = '_blank';
        a.rel = 'noopener';
      });
      const fl = $('#wa-float');
      if (fl && !reduce) {
        setTimeout(() => fl.classList.add('show-label'), 5000);
        setTimeout(() => fl.classList.remove('show-label'), 11000);
      }
    }

    /* ---------- Menú móvil ---------- */
    function initMenu() {
      const header = $('.site-header'), burger = $('#burger'), nav = $('#nav');
      if (!burger) return;
      const set = (open) => {
        header.classList.toggle('menu-open', open);
        root.classList.toggle('no-scroll', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      };
      burger.addEventListener('click', () => set(!header.classList.contains('menu-open')));
      $$('a', nav).forEach((a) => a.addEventListener('click', () => set(false)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
      window.matchMedia('(min-width: 980px)').addEventListener('change', (m) => { if (m.matches) set(false); });
    }

    /* ---------- Texto dividido en palabras (títulos) ---------- */
    function splitWords(el) {
      let i = 0;
      (function walk(node) {
        Array.from(node.childNodes).forEach((ch) => {
          if (ch.nodeType === 3) {
            const frag = document.createDocumentFragment();
            ch.textContent.split(/(\s+)/).forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span'); w.className = 'w';
              const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
              w.appendChild(s); frag.appendChild(w);
            });
            node.replaceChild(frag, ch);
          } else if (ch.nodeType === 1) { walk(ch); }
        });
      })(el);
    }

    /* ---------- Revelado al hacer scroll ---------- */
    function initReveal() {
      $$('[data-split]').forEach(splitWords);
      $$('[data-stagger]').forEach((g) => {
        $$(':scope > .reveal', g).forEach((c, i) => c.style.setProperty('--d', (i % 4) * 100 + 'ms'));
      });
      if (!('IntersectionObserver' in window)) {
        $$('.reveal,[data-split]').forEach((el) => el.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.classList.add('in');
          io.unobserve(el);
          if (el.classList.contains('reveal')) {
            // al terminar, se quita la clase para que el hover de la tarjeta funcione libre
            const d = parseInt(getComputedStyle(el).getPropertyValue('--d')) || 0;
            setTimeout(() => el.classList.remove('reveal', 'in'), 1300 + d);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      $$('.reveal,[data-split]').forEach((el) => io.observe(el));
    }

    /* ---------- Palabra rotativa del hero ---------- */
    function initRotator() {
      const items = $$('.rot');
      if (items.length < 2) return;
      let k = 0;
      setTimeout(() => {
        setInterval(() => {
          const cur = items[k];
          k = (k + 1) % items.length;
          const nxt = items[k];
          cur.classList.remove('is-on'); cur.classList.add('is-out');
          nxt.classList.remove('is-out'); nxt.classList.add('is-on');
          setTimeout(() => cur.classList.remove('is-out'), 900);
        }, 2600);
      }, 3200);
    }

    /* ---------- Burbujas del hero (canvas) ---------- */
    function initBubbles() {
      const c = $('#bubbles');
      if (!c || !c.getContext) return;
      const ctx = c.getContext('2d');
      const hero = $('.hero');
      let w = 0, h = 0, dpr = 1, bubbles = [], raf = 0, visible = true;
      const mouse = { x: -999, y: -999 };

      const make = (init) => {
        const r = rand(3, 17);
        return { x: rand(0, w), y: init ? rand(0, h) : h + r + rand(0, 90), r, vy: rand(0.25, 0.85) * (1 + (17 - r) / 28), ph: rand(0, 6.28), sw: rand(0.4, 1.2), a: rand(0.3, 0.7) };
      };
      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = c.clientWidth; h = c.clientHeight;
        c.width = w * dpr; c.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.round(clamp(w / 22, 14, 56));
        bubbles = Array.from({ length: n }, () => make(true));
      };
      const draw = (t) => {
        ctx.clearRect(0, 0, w, h);
        bubbles.forEach((b) => {
          if (!reduce) {
            b.y -= b.vy;
            b.x += Math.sin(t * 0.001 * b.sw + b.ph) * 0.35;
            const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy);
            if (d < 130 && d > 0) { const f = (130 - d) / 130 * 2.2; b.x += dx / d * f; b.y += dy / d * f; }
            if (b.y < -b.r * 2) Object.assign(b, make(false));
          }
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(186,223,238,' + (b.a * 0.28) + ')'; ctx.fill();
          ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(58,120,165,' + (b.a * 0.55) + ')'; ctx.stroke();
          ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(1, b.r * 0.22), 0, 6.2832);
          ctx.fillStyle = 'rgba(255,255,255,' + (b.a + 0.2) + ')'; ctx.fill();
        });
      };
      const loop = (t) => { if (visible) draw(t); raf = requestAnimationFrame(loop); };
      resize();
      if (reduce) { draw(0); window.addEventListener('resize', () => { resize(); draw(0); }); return; }
      raf = requestAnimationFrame(loop);
      window.addEventListener('resize', resize);
      if ('IntersectionObserver' in window && hero) {
        new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
      }
      if (hero) {
        hero.addEventListener('pointermove', (e) => {
          const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        });
        hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
      }
    }

    /* ---------- Inclinación 3D, imán y foco de luz ---------- */
    function initPointerFx() {
      if (!finePointer || reduce) return;

      // Escenario del hero: la tarjeta del logo y las tarjetas flotantes siguen el cursor
      const stage = $('#stage'), card = $('.logo-card');
      if (stage && card) {
        stage.addEventListener('pointermove', (e) => {
          const r = stage.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          stage.style.setProperty('--px', (px * 2).toFixed(3));
          stage.style.setProperty('--py', (py * 2).toFixed(3));
          card.style.transform = 'perspective(800px) rotateX(' + (-py * 22) + 'deg) rotateY(' + (px * 26) + 'deg) scale(1.04)';
        });
        stage.addEventListener('pointerleave', () => {
          stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); card.style.transform = '';
        });
      }

      $$('[data-tilt]').filter((el) => !el.classList.contains('logo-card')).forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 14) + 'deg) rotateY(' + ((px - 0.5) * 16) + 'deg) scale(1.03)';
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      });

      $$('[data-magnetic]').forEach((b) => {
        b.addEventListener('pointermove', (e) => {
          const r = b.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
          b.style.transform = 'translate(' + (x * 0.18) + 'px,' + (y * 0.3) + 'px)';
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      });

      $$('[data-spot]').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }

    /* ---------- Contadores ---------- */
    function initCounters() {
      const els = $$('[data-count]');
      if (!els.length) return;
      const run = (el) => {
        const to = parseInt(el.dataset.count, 10) || 0;
        if (reduce) { el.textContent = to; return; }
        const t0 = performance.now(), dur = 1400;
        (function tick(now) {
          const t = clamp((now - t0) / dur);
          el.textContent = Math.round(to * ease(t));
          if (t < 1) requestAnimationFrame(tick);
        })(t0);
      };
      if (!('IntersectionObserver' in window)) { els.forEach((e) => { e.textContent = e.dataset.count; }); return; }
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      }), { threshold: 0.6 });
      els.forEach((e) => io.observe(e));
    }

    /* ---------- Scroll: progreso, parallax, texto, tinaco, foto que se expande ---------- */
    function initScroll() {
      const header = $('.site-header'), pbar = $('#progress-bar');
      const parallax = reduce ? [] : $$('[data-parallax]').map((el) => ({ el, s: parseFloat(el.dataset.parallax) || 0 }));
      const scrubs = [];
      if (!reduce) {
        $$('[data-scrub]').forEach((el) => {
          const words = el.textContent.trim().split(/\s+/);
          el.textContent = '';
          words.forEach((w) => {
            const s = document.createElement('span'); s.className = 'sw'; s.textContent = w;
            el.appendChild(s); el.appendChild(document.createTextNode(' '));
          });
          scrubs.push({ el, sw: $$('.sw', el) });
        });
      }
      const hscroll = reduce ? [] : $$('[data-hscroll]');

      // Proceso (tinaco)
      const proc = reduce ? null : $('[data-process]');
      const pv = $('#pv'), steps = $$('#steps .step'), purNum = $('#pur-num');
      const MURKY1 = [169, 154, 75], CLEAN1 = [127, 214, 247], MURKY2 = [111, 106, 51], CLEAN2 = [47, 143, 196];
      const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',') + ')';
      let activeStep = -1;

      // Foto que se expande
      const exp = reduce ? null : $('[data-expand]');
      const expHead = exp && $('.expand-head', exp), expFrame = exp && $('.expand-frame', exp);

      let ticking = false;
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

      function update() {
        ticking = false;
        const vh = window.innerHeight, vw = window.innerWidth, y = window.scrollY;
        const max = root.scrollHeight - vh;
        if (pbar) pbar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max) : 0) + ')';
        if (header) header.classList.toggle('scrolled', y > 30);

        parallax.forEach((p) => {
          const r = p.el.parentElement.getBoundingClientRect();
          const c = r.top + r.height / 2 - vh / 2;
          p.el.style.translate = '0 ' + (-c * p.s).toFixed(1) + 'px';
        });

        scrubs.forEach((s) => {
          const r = s.el.getBoundingClientRect();
          const p = clamp((vh * 0.88 - r.top) / (vh * 0.43 + r.height));
          const n = s.sw.length;
          s.sw.forEach((w, i) => {
            const t = clamp(p * (n + 6) - i);
            w.style.opacity = (0.15 + 0.85 * t).toFixed(3);
          });
        });

        hscroll.forEach((el) => {
          const r = el.parentElement.getBoundingClientRect();
          const p = clamp((vh - r.top) / (vh + r.height));
          const travel = Math.min(Math.max(0, el.scrollWidth - vw), vw * 1.7);
          el.style.transform = 'translate3d(' + (-p * travel).toFixed(1) + 'px,0,0)';
        });

        if (proc && pv) {
          const r = proc.getBoundingClientRect();
          const total = Math.max(1, r.height - vh);
          const p = clamp(-r.top / total);
          const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
          if (idx !== activeStep) {
            steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
            activeStep = idx;
          }
          const pur = ease(clamp((p - 0.06) / 0.72));
          pv.style.setProperty('--w1', mix(MURKY1, CLEAN1, pur));
          pv.style.setProperty('--w2', mix(MURKY2, CLEAN2, pur));
          pv.style.setProperty('--sed', clamp(1 - pur * 1.15).toFixed(3));
          pv.style.setProperty('--spark', clamp((pur - 0.85) / 0.15).toFixed(3));
          pv.style.setProperty('--pur-w', (pur * 100).toFixed(1) + '%');
          proc.style.setProperty('--rail', p.toFixed(3));
          if (purNum) purNum.textContent = Math.round(pur * 100);
        }

        if (exp && expFrame) {
          const r = exp.getBoundingClientRect();
          const total = Math.max(1, r.height - vh);
          const p = clamp(-r.top / total);
          const e = ease(clamp(p / 0.62));
          const wide = vw >= 900;
          const top = lerp((expHead ? expHead.offsetHeight : 120) + 18, 0, e);
          const bottom = lerp(vh * (wide ? 0.07 : 0.1), 0, e);
          const side = lerp(wide ? vw * 0.27 : vw * 0.05, 0, e);
          expFrame.style.clipPath = 'inset(' + top.toFixed(1) + 'px ' + side.toFixed(1) + 'px ' + bottom.toFixed(1) + 'px ' + side.toFixed(1) + 'px round ' + lerp(36, 0, e).toFixed(1) + 'px)';
          exp.style.setProperty('--zs', lerp(1.28, 1, e).toFixed(3));
          exp.style.setProperty('--ho', clamp(1 - e / 0.55).toFixed(3));
          exp.style.setProperty('--oo', clamp((p - 0.6) / 0.22).toFixed(3));
          exp.style.setProperty('--co', clamp((p - 0.74) / 0.2).toFixed(3));
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      window.addEventListener('load', update);
      update();
    }

    /* ---------- Navegación activa ---------- */
    function initActiveNav() {
      if (!('IntersectionObserver' in window)) return;
      const links = $$('#nav a[href^="#"]');
      const map = new Map();
      links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) map.set(s, a); });
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          const a = map.get(e.target);
          if (a && e.isIntersecting) { links.forEach((l) => l.classList.remove('active')); a.classList.add('active'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      map.forEach((_, s) => io.observe(s));
    }

    /* ---------- Galería de videos ---------- */
    function initReel() {
      const reel = $('#reel');
      if (!reel) return;
      const vids = $$('video', reel);

      if ('IntersectionObserver' in window && !reduce) {
        const io = new IntersectionObserver((es) => es.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else { v.pause(); }
        }), { root: null, threshold: 0.55 });
        vids.forEach((v) => io.observe(v));
      }

      const step = () => { const it = $('.reel-item', reel); return it ? it.getBoundingClientRect().width + 16 : 280; };
      const prev = $('#reel-prev'), next = $('#reel-next');
      if (prev) prev.addEventListener('click', () => reel.scrollBy({ left: -step(), behavior: 'smooth' }));
      if (next) next.addEventListener('click', () => reel.scrollBy({ left: step(), behavior: 'smooth' }));

      // arrastrar con el mouse
      let down = false, sx = 0, sl = 0, moved = 0;
      reel.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = 0; sx = e.clientX; sl = reel.scrollLeft;
      });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
        if (moved > 6) { reel.classList.add('drag'); reel.scrollLeft = sl - dx; }
      });
      window.addEventListener('pointerup', () => { down = false; setTimeout(() => reel.classList.remove('drag'), 0); });
      reel.addEventListener('click', (e) => {
        if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; return; }
      }, true);
    }

    /* ---------- Visor (videos y cartel) ---------- */
    function initLightbox() {
      const lb = $('#lightbox'), body = $('#lb-body'), closeBtn = $('#lb-close');
      if (!lb || !body) return;
      const open = (node) => {
        body.replaceChildren(node);
        if (typeof lb.showModal === 'function') { if (!lb.open) lb.showModal(); } else { lb.setAttribute('open', ''); }
      };
      const close = () => {
        const v = $('video', body); if (v) v.pause();
        body.replaceChildren();
        if (typeof lb.close === 'function') { if (lb.open) lb.close(); } else { lb.removeAttribute('open'); }
      };
      $$('[data-video]').forEach((b) => b.addEventListener('click', () => {
        const v = document.createElement('video');
        v.src = b.dataset.video; v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
        v.setAttribute('aria-label', 'Video de un trabajo realizado por Cuidamos Tu Hogar');
        open(v);
      }));
      $$('[data-image]').forEach((b) => b.addEventListener('click', () => {
        const im = document.createElement('img');
        im.src = b.dataset.image; im.alt = b.dataset.alt || '';
        open(im);
      }));
      if (closeBtn) closeBtn.addEventListener('click', close);
      lb.addEventListener('click', (e) => { if (e.target === lb || e.target === body) close(); });
      lb.addEventListener('close', () => { const v = $('video', body); if (v) v.pause(); body.replaceChildren(); });
    }

    /* ---------- Formulario → WhatsApp ---------- */
    function initForm() {
      const form = $('#form');
      if (!form) return;
      const err = $('#form-err');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!WHATSAPP) return;
        const nombre = form.nombre.value.trim();
        const servicio = form.servicio.value.trim();
        const zona = form.zona.value.trim();
        const mensaje = form.mensaje.value.trim();
        [form.nombre, form.servicio].forEach((f) => f.classList.remove('invalid'));
        const faltan = [];
        if (!nombre) { faltan.push('tu nombre'); form.nombre.classList.add('invalid'); }
        if (!servicio) { faltan.push('el servicio que necesitas'); form.servicio.classList.add('invalid'); }
        if (faltan.length) {
          err.textContent = 'Para ayudarte mejor, cuéntanos ' + faltan.join(' y ') + '.';
          err.hidden = false;
          (nombre ? form.servicio : form.nombre).focus();
          return;
        }
        err.hidden = true;
        const partes = ['Hola, soy ' + nombre + '.', 'Quiero mi cotización gratis para: ' + servicio + '.'];
        if (zona) partes.push('Mi colonia o zona: ' + zona + '.');
        if (mensaje) partes.push(mensaje);
        partes.push('Quedo al pendiente, ¡gracias!');
        const a = document.createElement('a');
        a.href = waUrl(partes.join(' ')); a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
      });
    }

    initWhatsApp();
    initMenu();
    initReveal();
    initRotator();
    initBubbles();
    initPointerFx();
    initCounters();
    initScroll();
    initActiveNav();
    initReel();
    initLightbox();
    initForm();
  } catch (error) {
    // Si algo falla, el contenido queda visible sin animaciones de scroll.
    root.classList.remove('js');
    if (window.console) console.error(error);
  }
})();
