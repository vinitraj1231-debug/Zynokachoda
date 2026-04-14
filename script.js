/* ============================================================
   ZYNOCHAT — script.js
   Vanilla JS — Navigation · FAQ · Scroll Animations · Form
   ============================================================ */

(function () {
  'use strict';

  /* ── Sticky Nav ─────────────────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Active nav link ────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-drawer a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Mobile menu ────────────────────────────────────────── */
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.nav-drawer');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      hamburger.classList.toggle('open', !isOpen);
      drawer.classList.toggle('open', !isOpen);
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close on drawer link click
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !drawer.contains(e.target)) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── FAQ Accordion ──────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');

    if (!btn || !ans) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ── Scroll-triggered fade-up ───────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-up');

  if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all immediately
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Animated number counter ─────────────────────────────── */
  function animateCount(el) {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const duration = 1800;
    const start    = performance.now();

    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length > 0 && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    countEls.forEach(el => countObserver.observe(el));
  }

  /* ── Contact form (UI only) ─────────────────────────────── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const submitBtn = contactForm.querySelector('.form-submit');
    const statusEl  = document.getElementById('form-status');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#f87171';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) return;

      // Simulate submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        if (statusEl) {
          statusEl.textContent = '✓ Message received! We will get back to you within 24 hours.';
          statusEl.style.color = '#4ade80';
          statusEl.style.display = 'block';
          setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
        }
        contactForm.reset();
      }, 1400);
    });

    // Clear red border on focus
    contactForm.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('focus', () => { field.style.borderColor = ''; });
    });
  }

  /* ── TOC highlight on scroll (legal pages) ──────────────── */
  const tocLinks = document.querySelectorAll('.toc-list a');
  if (tocLinks.length > 0) {
    const sections = Array.from(tocLinks).map(a => {
      const id = a.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    }).filter(Boolean);

    const tocScroll = () => {
      let current = '';
      sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 120) current = section.id;
      });
      tocLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + current
          ? 'var(--accent-v)'
          : '';
      });
    };

    window.addEventListener('scroll', tocScroll, { passive: true });
  }

  /* ── Smooth back-to-top / anchor smooth scroll ──────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
        window.scrollTo({ top: target.offsetTop - navH - 16, behavior: 'smooth' });
      }
    });
  });

  /* ── Generate floating star dots in hero ────────────────── */
  document.querySelectorAll('.stars-bg').forEach(container => {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      const size = Math.random() * 2 + 1;
      dot.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(0,0,0,${Math.random() * 0.3 + 0.1});
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: pulse-dot ${2 + Math.random() * 3}s ease-in-out infinite;
        animation-delay: ${Math.random() * 3}s;
      `;
      container.appendChild(dot);
    }
  });

})();
