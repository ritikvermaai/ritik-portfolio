/* Shared navigation controller. One sidebar, one animation, one close behaviour on every public page. */
(function () {
  'use strict';

  function sidebar() { return document.getElementById('sidebar'); }
  function button() { return document.querySelector('.menu-btn'); }
  function overlay() { return document.getElementById('site-sidebar-overlay'); }

  function setOpen(open) {
    const panel = sidebar();
    const trigger = button();
    const shade = overlay();
    if (!panel || !trigger || !shade) return;

    panel.classList.toggle('active', open);
    trigger.classList.toggle('active', open);
    trigger.setAttribute('aria-expanded', String(open));
    shade.classList.toggle('active', open);
    document.body.classList.toggle('sidebar-open', open);
  }

  window.toggleMenu = function () {
    const panel = sidebar();
    if (!panel) return;
    setOpen(!panel.classList.contains('active'));
  };

  window.openMenu = function () { setOpen(true); };
  window.closeMenu = function () { setOpen(false); };

  function createOverlay() {
    let shade = document.getElementById('site-sidebar-overlay');
    if (!shade) {
      shade = document.createElement('div');
      shade.id = 'site-sidebar-overlay';
      shade.className = 'site-sidebar-overlay';
      shade.setAttribute('aria-hidden', 'true');
      document.body.appendChild(shade);
    }
    shade.onclick = window.closeMenu;
    return shade;
  }

  function markActive() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const links = document.querySelectorAll('#sidebar a[data-nav]');
    links.forEach(function (link) {
      const target = link.getAttribute('data-nav');
      const active = target === '/' ? path === '/' : path.endsWith(target);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const panel = sidebar();
    const trigger = button();
    if (!panel || !trigger) return;

    createOverlay();

    // The hamburger must explicitly control the shared sidebar on every page.
    // Some pages previously had different/inline menu code, so relying on a
    // global function alone left the button without a click handler.
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!panel.classList.contains('active'));
    });
    trigger.setAttribute('aria-expanded', 'false');

    // The home page has a welcome splash. It must release the page after loading;
    // otherwise its full-screen layer can block the hamburger and all content.
    const splash = document.getElementById('welcomeSplash');
    if (splash) {
      const hideSplash = function () {
        splash.classList.add('splash-hide');
        document.body.classList.remove('splash-active');
        window.setTimeout(function () {
          if (splash.parentNode) splash.remove();
        }, 450);
      };
      window.setTimeout(hideSplash, 1400);
      window.addEventListener('load', function () {
        window.setTimeout(hideSplash, 250);
      }, { once: true });
    }
    trigger.setAttribute('aria-controls', 'sidebar');
    markActive();

    panel.querySelector('.close-btn')?.addEventListener('click', window.closeMenu);
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', window.closeMenu);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') window.closeMenu();
    });

    /* If another script changes the page, make sure the navigation never leaves a dead overlay behind. */
    window.addEventListener('pageshow', function () { setOpen(false); });
  });
})();
