/* Dependency-free behavior for the Andarge Girma portfolio. */
(() => {
  'use strict';

  const root = document.documentElement;
  const header = document.querySelector('#site-header');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeGlyph = document.querySelector('.theme-glyph');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
  const filterButtons = [...document.querySelectorAll('.filter-btn')];
  const projectCards = [...document.querySelectorAll('.project-card')];
  const form = document.querySelector('#contact-form');
  const formStatus = document.querySelector('#form-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Dark is the default. Persist a user's choice where browser storage allows.
  function applyTheme(theme) {
    const light = theme === 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    themeGlyph.textContent = light ? '☾' : '☼';
    themeToggle.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
    document.querySelector('meta[name="theme-color"]').content = light ? '#f3f0e9' : '#111110';
  }
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('andarge-theme') || 'dark';
  } catch (_) {
    // If storage is unavailable the site still works for this page view.
  }
  applyTheme(savedTheme);
  themeToggle.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    try { localStorage.setItem('andarge-theme', nextTheme); } catch (_) { /* No persistence available. */ }
  });

  // Add a restrained glass treatment to the fixed header after scrolling.
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Mobile navigation can be opened, closed by selecting a link, or dismissed with Escape.
  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.inert = !open;
  }
  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMenu(false);
  });

  // Category filters keep project markup in place and simply hide non-matching cards.
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      projectCards.forEach(card => {
        const categories = card.dataset.category.split(/\s+/);
        const visible = filter === 'all' || categories.includes(filter);
        card.classList.toggle('is-filtered', !visible);
        card.setAttribute('aria-hidden', String(!visible));
      });
    });
  });

  // Scroll reveals and skill bars are disabled for people who prefer less motion.
  const revealTargets = document.querySelectorAll('.reveal, .toolkit');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(target => revealObserver.observe(target));
  } else {
    revealTargets.forEach(target => target.classList.add('is-visible'));
  }

  // Highlight the desktop nav item corresponding to the visible section.
  const sections = navLinks.map(link => ({
    link,
    section: document.querySelector(link.getAttribute('href'))
  })).filter(item => item.section);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sections.forEach(item => {
          const active = item.section === entry.target;
          item.link.classList.toggle('is-active', active);
          if (active) item.link.setAttribute('aria-current', 'location');
          else item.link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-33% 0px -58% 0px', threshold: 0 });
    sections.forEach(item => sectionObserver.observe(item.section));
  }

  // Gentle magnetic button pull on mouse/trackpad only; no pointer effects on touch.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.055;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.08;
        button.style.transform = `translate(${x}px, ${y}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  // Web3Forms handles delivery; the public access key is intended for browser forms.
  const fields = [...form.querySelectorAll('.field input, .field textarea')];
  const submitButton = form.querySelector('button[type="submit"]');
  const submitButtonMarkup = submitButton.innerHTML;
  const validators = {
    name: value => value.trim().length > 0,
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    subject: value => value.trim().length > 0,
    message: value => value.trim().length >= 8
  };
  const errorCopy = {
    name: 'Please enter your name.',
    email: 'Enter a valid email address.',
    subject: 'Please add a subject.',
    message: 'Please write at least 8 characters.'
  };
  function validateField(input) {
    const valid = validators[input.name](input.value);
    const field = input.closest('.field');
    field.classList.toggle('has-error', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid) field.querySelector('.field-error').textContent = errorCopy[input.name];
    return valid;
  }
  fields.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value.length || input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      formStatus.textContent = '';
      formStatus.classList.remove('is-error');
    });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      formStatus.textContent = 'A couple of fields need your attention.';
      formStatus.classList.add('is-error');
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    if (String(new FormData(form).get('botcheck') || '').trim()) return;

    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    formStatus.textContent = 'Sending your message…';
    formStatus.classList.remove('is-error');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        throw new Error('Web3Forms did not accept the message.');
      }
      formStatus.textContent = 'Thanks — your message has been sent to Andarge.';
      form.reset();
      fields.forEach(input => {
        input.removeAttribute('aria-invalid');
        input.closest('.field').classList.remove('has-error');
      });
    } catch (_) {
      formStatus.textContent = 'Your message could not be sent. Please try again or email girmaandarge@gmail.com.';
      formStatus.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = submitButtonMarkup;
      form.removeAttribute('aria-busy');
    }
  });
})();