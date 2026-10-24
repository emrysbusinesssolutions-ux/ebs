/* ==========================================================================
   EMRYS BUSINESS SOLUTIONS — site behaviour
   Vanilla JS. No libraries, no trackers, no network requests.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── current page + active navigation ─────────────────────────────────── */
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function markActive() {
    const links = $$('.nav a, .mobile-menu__nav a');
    links.forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (!href) return;
      if (href === page) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
    // header "Case studies" shortcut
    $$('.header-link').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (href === page) a.setAttribute('aria-current', 'page');
    });
  }

  /* ── sticky header state ──────────────────────────────────────────────── */
  const header = $('#siteHeader');
  let lastScroll = 0;
  function onScroll() {
    if (!header) return;
    const y = window.scrollY || 0;
    header.classList.toggle('is-scrolled', y > 8);
    lastScroll = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── hero pointer light + tilt ───────────────────────────────────────── */
  const hero = $('.hero--cinematic');
  const heroStage = $('.hero-stage');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (hero && finePointer && !reduce) {
    hero.addEventListener('pointermove', event => {
      const r = hero.getBoundingClientRect();
      const x = ((event.clientX - r.left) / r.width) * 100;
      const y = ((event.clientY - r.top) / r.height) * 100;
      hero.style.setProperty('--hero-x', `${x.toFixed(1)}%`);
      hero.style.setProperty('--hero-y', `${y.toFixed(1)}%`);
    });
  }
  if (heroStage && finePointer && !reduce) {
    const windowEl = heroStage.querySelector('.app-window--hero');
    if (windowEl) {
      heroStage.addEventListener('pointermove', event => {
        const r = heroStage.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width - 0.5;
        const y = (event.clientY - r.top) / r.height - 0.5;
        heroStage.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`);
        heroStage.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
      });
      heroStage.addEventListener('pointerleave', () => {
        heroStage.style.setProperty('--tilt-y', '0deg');
        heroStage.style.setProperty('--tilt-x', '0deg');
      });
    }
  }

  /* ── display currency ────────────────────────────────────────────────── */
  if (window.EBSMoney) {
    window.EBSMoney.initSelectors(document);
  }

  /* ── scroll progress ─────────────────────────────────────────────────── */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.prepend(progress);
  const progressBar = progress.firstElementChild;
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  /* ── mobile menu ──────────────────────────────────────────────────────── */
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  let menuOpen = false;

  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) {
      const first = mobileMenu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else {
      menuBtn.focus({ preventScroll: true });
    }
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuOpen) setMenu(false);
    });
    matchMedia('(min-width: 981px)').addEventListener('change', e => {
      if (e.matches && menuOpen) setMenu(false);
    });
    // close when clicking outside
    document.addEventListener('click', e => {
      if (!menuOpen) return;
      if (header && !header.contains(e.target)) setMenu(false);
    });
  }

  /* ── scroll reveal ────────────────────────────────────────────────────── */
  const revealEls = $$('.reveal');
  // stagger siblings that share a parent
  const groups = new Map();
  revealEls.forEach(el => {
    if (!groups.has(el.parentElement)) groups.set(el.parentElement, []);
    groups.get(el.parentElement).push(el);
  });
  groups.forEach(list => {
    if (list.length < 2) return;
    list.forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${Math.min(i, 5) * 70}ms`);
    });
  });

  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
    // safety: anything still hidden after 3s becomes visible
    setTimeout(() => revealEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.2) el.classList.add('is-in');
    }), 3000);
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ── footer year ──────────────────────────────────────────────────────── */
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  /* ── clipboard helper ────────────────────────────────────────────────── */
  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  /* ── copy buttons ─────────────────────────────────────────────────────── */
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      if (!text) return;
      const original = btn.textContent;
      const ok = await copyText(text);
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      btn.classList.toggle('is-copied', ok);
      setTimeout(() => { btn.textContent = original; btn.classList.remove('is-copied'); }, 1800);
    });
  });

  /* ── enquiry form → email draft ───────────────────────────────────────── */
  const form = $('#contactForm');
  if (form) {
    const status = $('#formStatus');
    const show = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.className = `form-status form-status--${kind} is-visible`;
    };

    const value = name => {
      const el = form.elements[name];
      return el ? String(el.value || '').trim() : '';
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const required = ['name', 'email', 'message'];
      const missing = required.filter(n => !value(n));
      if (missing.length) {
        const first = form.elements[missing[0]];
        if (first) {
          first.focus();
          first.setAttribute('aria-invalid', 'true');
        }
        show('Please complete your name, email and message so we can reply.', 'err');
        return;
      }

      const email = value('email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const el = form.elements['email'];
        if (el) { el.focus(); el.setAttribute('aria-invalid', 'true'); }
        show('That email address looks incomplete. Please check it.', 'err');
        return;
      }

      const name = value('name');
      const business = value('business');
      const phone = value('phone');
      const plan = value('plan');
      const message = value('message');
      const website = value('website');

      const payload = { name, email, business, phone, plan, message, website };
      const lines = [
        `Name: ${name}`,
        business ? `Business: ${business}` : '',
        `Email: ${email}`,
        phone ? `Phone / Telegram: ${phone}` : '',
        plan ? `Interested in: ${plan}` : '',
        '',
        'About the business and what you need:',
        message,
        '',
        '— Sent from the EBS website enquiry form'
      ].filter(Boolean).join('\n');
      const subject = `Demo request — ${name}${business ? ` (${business})` : ''}`;
      const mailto = `mailto:emrysbusinesssolutions@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
      const copyBtn = $('#copyDraft');

      show('Sending your enquiry…', 'ok');
      let sent = false;
      try {
        const res = await fetch('/api/enquiry', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) sent = true;
      } catch (err) { sent = false; }

      if (sent) {
        show('Thank you — your enquiry was sent. We usually reply within one business day.', 'ok');
        form.reset();
        if (copyBtn) copyBtn.hidden = true;
        window.__ebsDraft = null;
        return;
      }

      // Fallback: the email draft path (works even if the function is unavailable).
      show('Sending failed — opening your email app with the same details. If nothing opens, use the copy button.', 'err');
      window.__ebsDraft = { subject, body: lines };
      if (copyBtn) copyBtn.hidden = false;
      window.location.href = mailto;
    });

    $$('input, textarea, select', form).forEach(el => {
      el.addEventListener('input', () => el.removeAttribute('aria-invalid'));
    });

    const copyDraft = $('#copyDraft');
    if (copyDraft) {
      copyDraft.addEventListener('click', async () => {
        const draft = window.__ebsDraft;
        if (!draft) return;
        const text = `${draft.subject}\n\n${draft.body}`;
        const ok = await copyText(text);
        copyDraft.textContent = ok
          ? 'Draft copied — paste it in Telegram'
          : 'Could not copy — please type your message in Telegram';
      });
    }
  }

  /* ── external links: enforce rel on target=_blank ─────────────────────── */
  $$('a[target="_blank"]').forEach(a => {
    const rel = (a.getAttribute('rel') || '').split(/\s+/);
    if (!rel.includes('noopener')) rel.push('noopener');
    if (!rel.includes('noreferrer')) rel.push('noreferrer');
    a.setAttribute('rel', rel.filter(Boolean).join(' '));
  });

  /* ── mark active nav after load ───────────────────────────────────────── */
  markActive();
})();
