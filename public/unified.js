document.addEventListener('DOMContentLoaded', () => {
  const current = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.sidebar a, .desktop-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    const path = href.split('#')[0].replace(/\/$/, '') || '/';
    if (path === current) link.classList.add('active');
  });

  // Keep profile/navigation images visually consistent without changing their source data.
  document.querySelectorAll('img').forEach(img => {
    img.style.objectFit = img.style.objectFit || 'cover';
    img.style.objectPosition = img.style.objectPosition || 'center center';
    img.addEventListener('error', () => img.classList.add('image-failed'), { once: true });
  });
});
