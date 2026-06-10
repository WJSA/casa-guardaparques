/* ═══════════════════════════════════════════════════════════
   BAJO EL PALIO DEL ÁVILA — scroll engine
   Vanilla JS, no dependencies. Progressive enhancement:
   without JS the page is a clean stacked layout; this script
   layers the cinematic scrubbing on top (desktop + motion only).
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const html = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopMQ = window.matchMedia('(min-width: 901px)');

  /* ─── Cinematic mode toggle ───
     Enabled on ALL screen sizes (desktop + mobile) for full
     animation parity. Only prefers-reduced-motion opts out. */
  let scrub = false;
  function setMode() {
    scrub = !reduceMotion;
    html.classList.toggle('scrub', scrub);
  }
  setMode();

  /* ─── Intro veil ─── */
  function lift() {
    html.classList.add('loaded');
    revealHero();
  }
  if (reduceMotion) {
    html.classList.add('loaded');
  } else {
    window.addEventListener('load', () => setTimeout(lift, 1500));
    // safety: never trap the user behind the veil
    setTimeout(() => html.classList.add('loaded'), 3200);
  }

  /* ─── Hero text reveal (on veil lift, not IO) ─── */
  function revealHero() {
    const items = document.querySelectorAll('.hero__inner > *');
    items.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 1s var(--ease), transform 1s var(--ease)';
      el.style.transitionDelay = (0.08 + i * 0.12) + 's';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.opacity = '';
        el.style.transform = '';
      }));
    });
  }

  /* ─── Hero video: load on every device (mobile included).
     Only skip when the user is on Data Saver or a 2g connection,
     in which case the poster image stands in. ─── */
  (function heroVideo() {
    const v = document.getElementById('heroVideo');
    if (!v) return;
    const conn = navigator.connection;
    const stingy = conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
    if (reduceMotion || stingy) return;       // poster stays
    v.src = v.dataset.src;
    v.load();
    v.play().catch(() => {/* autoplay may be blocked; poster stays */});
  })();

  /* ─── IntersectionObserver reveals (text that scrolls into view) ─── */
  const revealSel = [
    '.split__copy .chapter__num', '.split__copy .chapter__title',
    '.split__copy .lede', '.split__copy .chapter__body', '.duo__item',
    '.rail__intro .chapter__num', '.rail__intro .chapter__title',
    '.rail__intro .chapter__body', '.rail__outro p',
    '.rail__card', '.closing__inner > *'
  ];
  const revealEls = document.querySelectorAll(revealSel.join(','));
  revealEls.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ─── Scene registry ─── */
  const scenes = [...document.querySelectorAll('[data-scene]')].map((el) => ({
    el,
    type: el.dataset.scene,
    layer1: el.querySelector('.layer[data-layer="1"]'),
    layer0: el.querySelector('.layer[data-layer="0"]'),
  }));

  const heroEl   = document.querySelector('.hero');
  const heroVid  = document.getElementById('heroVideo');
  const heroGrad = document.querySelector('.hero__grad');
  const heroInner= document.querySelector('.hero__inner');
  const cue      = document.querySelector('.scrollcue');
  const manifesto= document.querySelector('.manifesto');
  const words    = manifesto ? [...manifesto.querySelectorAll('.word')] : [];
  const railTrack= document.getElementById('railTrack');
  const progBar  = document.querySelector('.progress span');
  const topbar   = document.getElementById('topbar');

  let vh = window.innerHeight;
  let vw = window.innerWidth;
  let railSpan = 0;

  function measure() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    if (railTrack) railSpan = Math.max(0, railTrack.scrollWidth - vw);
  }

  /* progress of a sticky scene: 0 when it locks, 1 when it releases */
  function pinProgress(el) {
    const r = el.getBoundingClientRect();
    const runway = el.offsetHeight - vh;
    if (runway <= 0) return clamp((vh * 0.5 - r.top) / vh, 0, 1);
    return clamp(-r.top / runway, 0, 1);
  }
  const near = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -200 && r.top < vh + 200;
  };

  function frame() {
    ticking = false;

    /* progress bar + topbar */
    const doc = document.documentElement;
    const max = doc.scrollHeight - vh;
    const sp = max > 0 ? doc.scrollTop / max : 0;
    if (progBar) progBar.style.transform = 'scaleX(' + sp + ')';
    if (topbar) topbar.classList.toggle('show', doc.scrollTop > vh * 0.6);

    if (!scrub) return; // mobile / reduced: native flow, nothing to scrub

    /* hero */
    if (heroEl && near(heroEl)) {
      const p = pinProgress(heroEl);
      if (heroVid) heroVid.style.transform = 'scale(' + (1 + p * 0.16) + ')';
      if (heroInner) {
        heroInner.style.transform = 'translateY(' + (-p * 140) + 'px)';
        heroInner.style.opacity = String(1 - smooth(0.25, 0.92, p));
      }
      if (heroGrad) heroGrad.style.opacity = String(0.8 + p * 0.2);
      if (cue) cue.style.opacity = String(clamp(1 - p * 5, 0, 1));
    }

    /* manifesto — light words as it scrolls through center */
    if (manifesto && words.length && near(manifesto)) {
      const r = manifesto.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.9), 0, 1);
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }

    /* scenes */
    for (const s of scenes) {
      if (s.type === 'hero' || !near(s.el)) continue;

      if (s.type === 'stage') {
        const p = pinProgress(s.el);
        if (s.layer0) s.layer0.style.transform = 'scale(' + (1.12 - p * 0.12) + ')';
        if (s.layer1) {
          const o = smooth(0.5, 0.85, p);
          s.layer1.style.opacity = String(o);
          s.layer1.style.transform = 'scale(' + (1.12 - p * 0.12) + ')';
        }
        const copy = s.el.querySelector('.stage__copy');
        if (copy) {
          const o = smooth(0.08, 0.3, p);
          copy.style.opacity = String(o);
          copy.style.transform = 'translateY(' + ((1 - o) * 36) + 'px)';
        }
      }

      else if (s.type === 'split') {
        const p = pinProgress(s.el);
        if (s.layer0) s.layer0.style.transform = 'scale(' + (1 + p * 0.05) + ')';
        if (s.layer1) s.layer1.style.opacity = String(smooth(0.35, 0.7, p));
      }

      else if (s.type === 'rail') {
        const p = pinProgress(s.el);
        if (railTrack) railTrack.style.transform = 'translateX(' + (-p * railSpan) + 'px)';
      }
    }
  }

  /* ─── rAF scroll loop ─── */
  let ticking = false;
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  let rT;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => { setMode(); measure(); frame(); }, 150);
  }, { passive: true });

  // init
  measure();
  // wait a tick for layout/fonts, then prime
  window.addEventListener('load', () => { measure(); frame(); });
  requestAnimationFrame(() => { measure(); frame(); });
})();
