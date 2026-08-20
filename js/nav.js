/* ============ OVEN DIARIES — NAVIGATION ============ */

/* ---------- Header / Footer ---------- */
function injectHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const page = location.pathname.split('/').pop() || 'index.html';
  const allLinks = [
    ['index.html', 'Home'], ['bakery.html', 'Bakery'], ['custom-cake.html', 'Custom Cake'],
    ['track-order.html', 'Track Order'], ['about.html', 'About'], ['cart.html', 'Cart'],
  ];
  const icons = {
    'index.html': 'fa-house', 'bakery.html': 'fa-cake-candles', 'custom-cake.html': 'fa-palette',
    'track-order.html': 'fa-truck-fast', 'about.html': 'fa-heart', 'cart.html': 'fa-basket-shopping',
    'profile.html': 'fa-user',
  };
  const user = Auth.current();
  const desktopLinks = allLinks.filter(l => l[0] !== 'track-order.html' && l[0] !== 'cart.html');
  const drawerLinks = [...allLinks];
  const barHTML = `
  <div class="container nav">
    <a href="index.html" class="logo">
      <img class="logo-img" src="images/logo.jpg" alt="Oven Diaries">
      <span class="logo-text">Oven <span>Diaries</span></span>
    </a>
    <ul class="nav-links" id="nav-links">
      ${desktopLinks.map(([href, label]) =>
        `<li><a href="${href}" class="${page === href ? 'active' : ''}">${label}</a></li>`).join('')}
    </ul>
    <div class="nav-actions">
      <a href="${user ? (user.role === 'admin' ? 'admin.html' : 'profile.html') : 'login.html'}" class="icon-btn" title="${user ? (user.role === 'admin' ? 'Admin Dashboard' : 'My Profile') : 'Login / Sign up'}" aria-label="Account"><i class="fa-solid ${user ? (user.role === 'admin' ? 'fa-gauge-high' : 'fa-user') : 'fa-right-to-bracket'}"></i></a>
      <a href="cart.html" class="icon-btn" title="Cart" aria-label="Cart"><i class="fa-solid fa-cart-shopping"></i><span class="badge" id="cart-badge" style="display:none">0</span></a>
      <button class="icon-btn nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false"><span class="burger"><span></span><span></span><span></span></span></button>
    </div>
  </div>`;
  el.innerHTML = barHTML;

  const drawer = document.createElement('aside');
  drawer.id = 'nav-drawer';
  drawer.className = 'nav-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="nd-head">
      <div class="nd-user">
        ${user
          ? `<span class="nd-avatar">${esc((user.name || '?')[0])}</span>
             <div><b>${esc(user.name)}</b><small>${user.role === 'admin' ? 'Admin' : esc(user.email)}</small></div>`
          : `<span class="nd-avatar"><i class="fa-solid fa-user"></i></span>
             <div><b>Hello, guest</b><small>Sign in for a sweeter experience</small></div>`}
      </div>
      <button class="icon-btn nd-close" id="nd-close" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <ul class="nd-links">
      ${drawerLinks.map(([href, label]) => `
        <li><a href="${href}" class="${page === href ? 'active' : ''}"><i class="fa-solid ${icons[href] || 'fa-arrow-right'}"></i>${label}</a></li>`).join('')}
    </ul>
    <div class="nd-foot">
      ${user
        ? (user.role === 'admin'
            ? `<a class="btn btn-primary" href="admin.html"><i class="fa-solid fa-gauge-high"></i> Admin Dashboard</a><button class="btn btn-outline nd-logout" type="button"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>`
            : `<button class="btn btn-outline nd-logout" type="button"><i class="fa-solid fa-right-from-bracket"></i> Log out</button>`)
        : `<a class="btn btn-primary" href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Login / Sign Up</a>
           <a class="nd-mgmt" href="login.html"><i class="fa-solid fa-user-shield"></i> Bakery Management</a>`}
    </div>`;
  const backdrop = document.createElement('div');
  backdrop.id = 'nav-backdrop';
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  const toggleBtn = document.getElementById('nav-toggle');
  const closeBtn = document.getElementById('nd-close');
  const header = document.getElementById('site-header');
  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.add('show');
    document.body.classList.add('nav-open');
    header.classList.add('drawer-open');
    toggleBtn.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  };
  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.classList.remove('nav-open');
    header.classList.remove('drawer-open');
    toggleBtn.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  };
  toggleBtn.addEventListener('click', () => (drawer.classList.contains('open') ? closeDrawer() : openDrawer()));
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  const logoutBtn = drawer.querySelector('.nd-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    Auth.logout();
    toast('Logged out — see you soon!', '');
    setTimeout(() => (location.href = 'index.html'), 450);
  });
  updateBadge();
}
