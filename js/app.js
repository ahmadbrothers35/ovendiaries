/* ============ OVEN DIARIES — SHARED UI ============ */

const fmt = window.PKR || (n => 'Rs. ' + Number(n).toLocaleString('en-PK'));

/* Bakery open/closed state — toggled from the admin panel */
const SHOP_CLOSED = () => localStorage.getItem('od_shop_closed') === '1';

/* Address fields — city + area come from the admin Delivery section */
function renderCityOptions(sel, selected) {
  const cities = getCities();
  sel.innerHTML = cities.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  if (selected && cities.some(c => c.id === selected)) sel.value = selected;
  return cities;
}

function renderAreaOptions(cityId, sel, selected) {
  const areas = deliveryAreasFor(cityId);
  if (!areas.length) {
    sel.innerHTML = '<option value="" disabled>No delivery areas available yet</option>';
    return areas;
  }
  sel.innerHTML = areas.map(a => `<option value="${esc(a.id)}" data-price="${+a.price || 0}">${esc(a.name)} — ${+a.price > 0 ? PKR(a.price) : 'FREE'}</option>`).join('');
  if (selected && areas.some(a => a.id === selected)) sel.value = selected;
  return areas;
}

/* ---------- Cart (localStorage) ---------- */
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('od_cart') || '[]'); } catch (e) { return []; } },
  add(id, qty = 1, opts = {}) {
    let c = this.get();
    const p = findProduct(id);
    if (!p) return;
    const key = JSON.stringify(opts);
    const line = c.find(x => x.productId === id && JSON.stringify(x.opts || {}) === key);
    if (line) line.qty += qty; else c.push({ productId: id, qty, opts });
    localStorage.setItem('od_cart', JSON.stringify(c));
    updateBadge();
    if (window.showCartToast) showCartToast(p);
  },
  setQty(id, qty) {
    let c = this.get();
    const line = c.find(x => x.productId === id);
    if (line) { line.qty = Math.max(1, qty); localStorage.setItem('od_cart', JSON.stringify(c)); }
    updateBadge();
  },
  setQtyByIdx(idx, qty) {
    let c = this.get();
    if (c[idx]) { c[idx].qty = Math.max(1, qty); localStorage.setItem('od_cart', JSON.stringify(c)); }
    updateBadge();
  },
  removeByIdx(idx) {
    let c = this.get();
    if (c[idx]) { c.splice(idx, 1); localStorage.setItem('od_cart', JSON.stringify(c)); }
    updateBadge();
  },
  remove(id) {
    localStorage.setItem('od_cart', JSON.stringify(this.get().filter(x => x.productId !== id)));
    updateBadge();
  },
  addCustom(item) {
    let c = this.get();
    const existing = c.find(x => x.isCustom && x.customKey === item.customKey);
    if (existing) existing.qty += 1; else c.push(item);
    localStorage.setItem('od_cart', JSON.stringify(c));
    updateBadge();
  },
  count() { return this.get().reduce((s, l) => s + l.qty, 0); },
  lineTotal(line) {
    if (line.isCustom) return line.price * line.qty;
    const p = findProduct(line.productId);
    if (!p) return 0;
    return p.price * pSizeMult(p, (line.opts || {}).sizeId) * line.qty;
  },
  subtotal() { return this.get().reduce((s, l) => s + this.lineTotal(l), 0); },
  clear() { localStorage.removeItem('od_cart'); updateBadge(); },
};

function updateBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const n = Cart.count();
  badge.textContent = n;
  badge.style.display = n ? 'grid' : 'none';
  badge.animate([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'ease' });
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Render helpers ---------- */
function productCardHTML(p, i = 0) {
  return `
  <article class="product-card reveal-zoom ${i < 4 ? 'delay-' + (i + 1) : ''}" data-cat="${p.cat}" data-pid="${p.id}">
    ${productArt(p)}
    <div class="body">
      <span class="p-cat">${esc(categoryLabel(p.cat))}</span>
      <h3>${esc(p.name)}</h3>
      <p class="p-desc">${esc(p.desc)}</p>
      <div class="p-foot">
        <span class="price">${fmt(p.price)}${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ''}</span>
        ${SHOP_CLOSED() ? '' : `<button class="add-btn" data-add="${p.id}" title="Add to cart"><i class="fa-solid fa-plus"></i></button>`}
      </div>
    </div>
  </article>`;
}

function renderProducts(container, list = PRODUCTS) {
  container.innerHTML = list.map((p, i) => productCardHTML(p, i)).join('');
  bindProductEvents(container);
}

function bindProductEvents(scope) {
  scope.querySelectorAll('.add-btn').forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      const id = +b.dataset.add;
      Cart.add(id);
      const pc = b.closest('.product-card');
      if (pc) pc.animate([{ transform: 'translateY(-6px)' }, { transform: 'none' }], { duration: 300 });
      b.classList.remove('added'); void b.offsetWidth; b.classList.add('added');
    };
  });
  scope.querySelectorAll('.p-wish').forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      toggleWish(+b.dataset.wish, b);
      toast(isWished(+b.dataset.wish) ? 'Added to your wishlist' : 'Removed from wishlist', '');
    };
  });
  scope.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.add-btn') || e.target.closest('.p-wish')) return;
      openProductDetail(+card.dataset.pid);
    });
  });
  updateWishlistIcons();
}

function showCartToast(p) {
  toast(`${p.name} added to cart!`, 'success');
}

/* ---------- Product detail modal ---------- */
function detailModalHTML(p) {
  const flavours = pFlavours(p);
  const sizes = pSizes(p);
  const tag = p.tag ? `<span class="p-tag ${p.tag}" style="position:static">${p.tag.toUpperCase()}</span>` : '';
  const meta = [];
  if (p.weights && p.weights.length) meta.push(`<span><i class="fa-solid fa-weight-hanging"></i> ${p.weights.map(w => esc(w) + ' lb').join(' • ')}</span>`);
  if (p.quantities && p.quantities.length) meta.push(`<span><i class="fa-solid fa-boxes-stacked"></i> ${p.quantities.map(esc).join(' • ')}</span>`);
  return `
  <div class="modal-backdrop" id="detail-backdrop">
    <div class="detail-modal" role="dialog" aria-modal="true" aria-label="${esc(p.name)}">
      <button class="d-modal-close" id="detail-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      <div class="d-img" style="background:${esc(p.bg)}">
        ${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" onerror="this.style.display='none'">` : '<div class="icon-fallback"><i class="fa-solid fa-cake-candles"></i></div>'}
      </div>
      <div class="detail-body" data-product="${p.id}">
        <div>
          <span class="p-cat">${esc(categoryLabel(p.cat))}</span>
          <h3 style="font-size:1.55rem;margin:4px 0 8px">${esc(p.name)}</h3>
          ${tag}
        </div>
        ${meta.length ? `<div class="d-meta">${meta.join('')}</div>` : ''}
        <p class="d-desc">${esc(p.desc)}</p>
        <div class="d-price"><span id="d-price-unit">${fmt(p.price)}</span>${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ''} <span class="d-price-note">per unit, PKR</span></div>
        <div>
          <span class="selector-label">Choose Flavour <small style="font-weight:400;color:var(--text-light)" id="d-flavour-name"></small></span>
          <div class="flavor-row" id="d-flavours">
            ${flavours.map((f, fi) => `<button class="flavor-swatch${fi === 0 ? ' active' : ''}" data-fl="${f.id}" title="${esc(f.name)}" aria-label="${esc(f.name)}" style="background:linear-gradient(135deg,${f.colors[0]},${f.colors[1]})"></button>`).join('')}
          </div>
        </div>
        <div>
          <span class="selector-label">Choose Size</span>
          <div class="size-row" id="d-sizes">
            ${sizes.map((s, si) => `<button class="chip d-size-chip${si === 0 ? ' active' : ''}" data-size="${s.id}">${s.name}</button>`).join('')}
          </div>
        </div>
        <div class="d-actions">
          <div class="qty">
            <button id="d-qminus" aria-label="Decrease"><i class="fa-solid fa-minus"></i></button><b id="d-qty">1</b><button id="d-qplus" aria-label="Increase"><i class="fa-solid fa-plus"></i></button>
          </div>
          ${SHOP_CLOSED() ? '' : `<button class="btn btn-primary" id="d-add" style="flex:1"><i class="fa-solid fa-cart-plus"></i> Add to Cart • <span id="d-total"></span></button>`}
        </div>
      </div>
    </div>
  </div>`;
}

function openProductDetail(id) {
  const p = findProduct(id);
  if (!p) return;
  const holder = document.createElement('div');
  holder.innerHTML = detailModalHTML(p);
  document.body.appendChild(holder);

  const backdrop = holder.firstElementChild;
  const $ = el => backdrop.querySelector(el);
  const state = {
    qty: 1,
    flavour: pFlavours(p)[0].id,
    size: pSizes(p)[0].id,
  };

  const dImg = $('#detail-backdrop .d-img img');
  const update = () => {
    const fName = pFlavourLabel(p, state.flavour);
    const sName = pSizeLabel(p, state.size);
    const mult = pSizeMult(p, state.size);
    $('#d-flavour-name').textContent = fName;
    $('#d-qty').textContent = state.qty;
    const dTotal = $('#d-total'); if (dTotal) dTotal.textContent = fmt(Math.round(p.price * mult) * state.qty);
    const vi = variantImage(p, fName, sName, '');
    if (dImg && vi && dImg.src !== vi) { dImg.src = vi; dImg.style.display = 'block'; }
  };

  const close = () => {
    document.removeEventListener('keydown', onKey);
    backdrop.classList.remove('open');
    setTimeout(() => holder.remove(), 350);
  };

  const onKey = e => { if (e.key === 'Escape') close(); };

  $('#detail-close').addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);

  const flavourRow = $('#d-flavours');
  flavourRow.querySelectorAll('.flavor-swatch').forEach(b => b.addEventListener('click', () => {
    flavourRow.querySelectorAll('.flavor-swatch').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.flavour = b.dataset.fl;
    update();
  }));

  const sizeRow = $('#d-sizes');
  sizeRow.querySelectorAll('.d-size-chip').forEach(b => b.addEventListener('click', () => {
    sizeRow.querySelectorAll('.d-size-chip').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.size = b.dataset.size;
    update();
  }));

  $('#d-qminus').addEventListener('click', () => { state.qty = Math.max(1, state.qty - 1); update(); });
  $('#d-qplus').addEventListener('click', () => { state.qty += 1; update(); });

  const dAdd = $('#d-add');
  if (dAdd) dAdd.addEventListener('click', () => {
    Cart.add(p.id, state.qty, { flavourId: state.flavour, sizeId: state.size });
    close();
  });

  update();
  requestAnimationFrame(() => backdrop.classList.add('open'));
}

/* ---------- Reveal animations ---------- */
function initReveals() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom').forEach(el => obs.observe(el));
}

/* ---------- Render current year ---------- */
function renderYear() {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

/* ---------- Crumbs ---------- */
function renderCrumbs() {
  const el = document.getElementById('crumbs-breadcrumb') || document.getElementById('crumbs');
  if (el) {
    el.innerHTML = `<a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><span style="color:var(--text-light)">${document.title.split(' — Oven Diaries')[0]}</span>`;
  }
}


/* ---------- Toast ---------- */
function toast(msg, type = '') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
  const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-cake-candles"></i>';
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${icon}<span>${esc(msg)}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, 2600);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  injectHeader();
  injectFooter();
  initReveals();
  renderCrumbs();
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => header && header.classList.toggle('scrolled', scrollY > 10));
});