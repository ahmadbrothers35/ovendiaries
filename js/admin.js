const admin = requireAdmin();
    if (!admin) throw new Error('redirect');

    const getOrders = () => {
      try { const o = JSON.parse(localStorage.getItem('od_orders')); if (o) return o; } catch (e) {}
      localStorage.setItem('od_orders', JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    };
    const saveOrders = o => localStorage.setItem('od_orders', JSON.stringify(o));

    const STATUS_FLOW = ['pending', 'confirmed', 'baked', 'ready', 'out', 'delivered'];
    const statusLabel = s => ({
      pending: 'Pending', confirmed: 'Order Confirmed', baked: 'Cooked (Baked)', ready: 'Ready for Delivery',
      out: 'Out for Delivery', delivered: 'Delivered', canceled: 'Canceled', cleared: 'Delivered',
    }[s] || String(s || 'pending').charAt(0).toUpperCase() + String(s || 'pending').slice(1).replace(/-/g, ' '));
    const orderStatus = o => {
      if (o.cleared) return 'delivered';
      const s = String(o.status || 'pending').toLowerCase();
      if (s === 'processing') return 'confirmed';
      if (s === 'cleared') return 'delivered';
      return s;
    };

    /* ---------- Navigation ---------- */
    document.querySelectorAll('#admin-nav button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#admin-nav button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      showPanel(b.dataset.panel);
      if (window.innerWidth <= 1024) document.getElementById('admin-sidebar').classList.remove('open');
    }));
    document.getElementById('admin-toggle').addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.toggle('open');
    });
    function showPanel(name) {
      document.querySelectorAll('.admin-main > section').forEach(s => s.style.display = s.dataset.panel === name ? 'block' : 'none');
      if (name === 'dashboard') renderStats();
      if (name === 'profile') renderProfile();
      if (name === 'orders') renderOrders();
      if (name === 'products') renderProductsTable();
      if (name === 'bakery') renderCategories();
      if (name === 'customcake') renderCCGroups();
      if (name === 'offers') { renderOffers(); renderDeliverySettings(); }
      if (name === 'delivery') renderDeliveryPanel();
      if (name === 'customers') renderCustomers();
      if (name === 'complaints') renderComplaints();
      if (name === 'reviews') renderReviewsAdmin();
      if (name === 'accounts') { renderSales(); renderPurchases(); }
    }

    document.getElementById('admin-logout').addEventListener('click', () => {
      Auth.logout();
      toast('Logged out of admin panel', '');
      setTimeout(() => location.href = 'login.html', 500);
    });

    /* ---------- Dashboard ---------- */
    function renderStats() {
      const orders = getOrders();
      const sales = orders.filter(o => o.status === 'delivered' || o.cleared).reduce((s, o) => s + (+o.total || 0), 0);
      const purchases = getPurchases().reduce((s, p) => s + (+p.amount || 0), 0);
      document.getElementById('st-sales').textContent = PKR(sales);
      document.getElementById('st-purchases').textContent = PKR(purchases);
      document.getElementById('st-orders').textContent = orders.length;
      document.getElementById('st-products').textContent = ALL_PRODUCTS().length;
      document.getElementById('st-customers').textContent = Auth.users().length;
    }

    /* ---------- Orders ---------- */
    const orderViewed = new Set();
    const orderCleared = new Set();
    let orderDelArmTimer = null;

    function orderLines(o) {
      if (Array.isArray(o.lines) && o.lines.length) {
        return o.lines.map(l => ({ name: String(l.name || 'Item'), qty: Math.max(1, +l.qty || 1), price: +l.price || 0, opts: l.opts || '', isCustom: !!l.isCustom }));
      }
      return [{ name: o.items || 'Order items', qty: 1, price: +o.total || 0, opts: '', isCustom: false }];
    }

    function orderDateTime(o) {
      if (o.placedAt) {
        const d = new Date(o.placedAt);
        if (!isNaN(d)) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      return o.date || '—';
    }

    function renderOrders() {
      const orders = getOrders();
      const body = document.getElementById('orders-body');
      if (!orders.length) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:30px">No orders here yet</td></tr>`;
        return;
      }
      body.innerHTML = orders.map(o => {
        const items = orderLines(o).map(l => (l.qty > 1 ? l.name + ' ×' + l.qty : l.name)).join(', ');
        const cur = orderStatus(o);
        return `
          <tr>
            <td><b>${esc(o.id)}</b></td>
            <td>${esc(o.customer)}</td>
            <td style="font-size:.85rem;max-width:280px">${esc(items)}</td>
            <td><b>${PKR(o.total)}</b></td>
            <td style="white-space:nowrap">${esc(orderDateTime(o))}</td>
            <td><select class="status-sel" data-status="${esc(o.id)}" title="Update order status — shown on the Track Order page">
              ${STATUS_FLOW.concat('canceled').map(s => `<option value="${s}" ${s === cur ? 'selected' : ''}>${esc(statusLabel(s))}</option>`).join('')}
            </select></td>
            <td><select class="status-sel" data-pay="${esc(o.id)}" title="Update payment method — shown on the receipt">
              ${['paid', 'cod'].map(s => `<option value="${s}" ${s === (o.payment || 'cod') ? 'selected' : ''}>${s === 'paid' ? 'Paid' : 'COD'}</option>`).join('')}
            </select></td>
            <td><div class="table-actions">
              <button class="mini-btn primary" data-view="${esc(o.id)}" title="View order & customer details"><i class="fa-solid fa-eye"></i></button>
              ${orderViewed.has(o.id) ? `<button class="mini-btn success" data-tick="${esc(o.id)}" title="Mark order as cleared"><i class="fa-solid fa-check"></i></button>` : ''}
              ${(orderCleared.has(o.id) || o.cleared) ? `<button class="mini-btn" data-print="${esc(o.id)}" title="Print receipt"><i class="fa-solid fa-print"></i></button>` : ''}
              <button class="mini-btn primary" data-edit="${esc(o.id)}" title="Edit products & quantities"><i class="fa-solid fa-pen"></i></button>
              <button class="mini-btn danger" data-del-order="${esc(o.id)}" title="Delete order"><i class="fa-solid fa-trash"></i></button>
            </div></td>
          </tr>`;
      }).join('');
      body.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => viewOrder(b.dataset.view)));
      body.querySelectorAll('[data-tick]').forEach(b => b.addEventListener('click', () => tickOrder(b.dataset.tick)));
      body.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => printOrder(b.dataset.print)));
      body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editOrder(b.dataset.edit)));
      body.querySelectorAll('[data-del-order]').forEach(b => b.addEventListener('click', () => delOrderFlow(b)));
      body.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', () => {
        const orders = getOrders();
        const o = orders.find(x => x.id === sel.dataset.status);
        if (!o) return;
        o.status = sel.value;
        if (sel.value === 'delivered') { o.cleared = true; orderCleared.add(o.id); }
        else if (sel.value === 'canceled') { o.cleared = false; orderCleared.delete(o.id); }
        else { delete o.cleared; orderCleared.delete(o.id); }
        saveOrders(orders);
        toast('Order ' + o.id + ' is now ' + statusLabel(sel.value) + ' — visible on the Track Order page', 'success');
        renderOrders();
        renderCCOrders();
      }));
      body.querySelectorAll('[data-pay]').forEach(sel => sel.addEventListener('change', () => {
        const orders = getOrders();
        const o = orders.find(x => x.id === sel.dataset.pay);
        if (!o) return;
        o.payment = sel.value;
        saveOrders(orders);
        toast('Order ' + o.id + ' payment set to ' + (sel.value === 'paid' ? 'Paid' : 'COD'), 'success');
        renderOrders();
      }));
    }

    function openOrderModal(inner, wide) {
      const holder = document.createElement('div');
      holder.innerHTML = `<div class="modal-backdrop${wide ? ' om-wide' : ''}"><div class="order-modal">${inner}<button class="d-modal-close om-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div></div>`;
      document.body.appendChild(holder);
      const backdrop = holder.firstElementChild;
      requestAnimationFrame(() => backdrop.classList.add('open'));
      const close = () => { backdrop.classList.remove('open'); setTimeout(() => holder.remove(), 300); };
      backdrop.querySelector('.om-close').addEventListener('click', close);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
      const onKey = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
      document.addEventListener('keydown', onKey);
      return backdrop;
    }

    function viewOrder(id) {
      const o = getOrders().find(x => x.id === id);
      if (!o) return;
      orderViewed.add(id);
      renderOrders();
      const pillClass = { pending: 'pending', confirmed: 'confirmed', baked: 'baked', ready: 'ready', out: 'out', delivered: 'delivered', canceled: 'danger' }[orderStatus(o)] || 'pending';
      const pill = `<span class="status-pill ${pillClass}">${esc(statusLabel(orderStatus(o)).toUpperCase())}</span>`;
      openOrderModal(`
        <p class="om-tag">Order details</p>
        <h3>${esc(o.id)}</h3>
        <p class="om-sub">Placed ${esc(orderDateTime(o))} ${pill}</p>
        <div class="om-section">
          <h4><i class="fa-solid fa-boxes-stacked"></i> Items</h4>
          ${orderLines(o).map(l => `<div class="om-line"><span>${esc(l.name)}${l.opts ? ` <small>(${esc(l.opts)})</small>` : ''}</span><b>${l.qty} × ${PKR(l.price)}</b><b>${PKR(l.qty * l.price)}</b></div>`).join('')}
          <div class="om-total"><span>Total bill</span><b>${PKR(o.total)}</b></div>
        </div>
        <div class="om-section">
          <h4><i class="fa-solid fa-user"></i> Customer details</h4>
          <div class="om-row"><span>Name</span><b>${esc(o.customer)}</b></div>
          <div class="om-row"><span>Email</span><b>${esc(o.email || '—')}</b></div>
          <div class="om-row"><span>Phone</span><b>${esc(o.phone || '—')}</b></div>
          <div class="om-row"><span>Address</span><b>${esc(o.address || '—')}</b></div>
          <div class="om-row"><span>Payment</span><b>${(o.payment || 'cod') === 'paid' ? 'Paid' : 'Cash on Delivery'}</b></div>
          ${o.attachment ? `<div class="om-row"><span>Attachment</span><b><i class="fa-solid fa-paperclip"></i> ${esc(o.attachment)}</b></div>` : ''}
        </div>`);
    }

    function tickOrder(id) {
      const orders = getOrders();
      const o = orders.find(x => x.id === id);
      if (!o) return;
      o.cleared = true;
      o.status = 'delivered';
      saveOrders(orders);
      orderCleared.add(id);
      toast('Order ' + o.id + ' marked as cleared', 'success');
      renderOrders();
    }

    function editOrder(id) {
      const orders = getOrders();
      const o = orders.find(x => x.id === id);
      if (!o) return;
      const lines = orderLines(o).map(l => ({ ...l }));
      const prevOpts = {};
      lines.forEach(l => { if (l.opts) prevOpts[l.name] = l.opts; });

      const lineRowHTML = l => `
        <div class="om-edit-row">
          <select class="om-prod">
            <option value="" ${l.isCustom || !ALL_PRODUCTS().some(p => p.name === l.name) ? 'selected' : ''}>Custom — ${esc(l.name)}</option>
            ${ALL_PRODUCTS().map(p => `<option value="${p.id}" data-price="${p.price}" ${!l.isCustom && p.name === l.name ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
          <input type="number" class="om-qty" min="1" value="${l.qty}" title="Quantity">
          <input type="number" class="om-price" min="0" step="5" value="${l.price}" title="Unit price (PKR)">
          <button type="button" class="om-rm" title="Remove item"><i class="fa-solid fa-xmark"></i></button>
        </div>`;

      const modal = openOrderModal(`
        <p class="om-tag">Edit order</p>
        <h3>${esc(o.id)}</h3>
        <p class="om-sub">Change the products and quantities — the total updates instantly.</p>
        <div class="om-edit-rows">${lines.map(lineRowHTML).join('')}</div>
        <button type="button" class="mini-btn" id="om-add-row"><i class="fa-solid fa-plus"></i> Add item</button>
        <div class="om-edit-sum">
          <span>Total: <small id="om-edit-note" style="color:var(--text-light);font-weight:400"></small></span>
          <b id="om-edit-total">${PKR(o.total)}</b>
        </div>
        <div class="om-actions">
          <button class="btn btn-outline" id="om-cancel">Cancel</button>
          <button class="btn btn-primary" id="om-save"><i class="fa-solid fa-floppy-disk"></i> Save Order</button>
        </div>`, true);

      const rowScope = modal.querySelector('.om-edit-rows');
      const totalEl = modal.querySelector('#om-edit-total');
      const noteEl = modal.querySelector('#om-edit-note');

      const recalc = () => {
        let sub = 0;
        rowScope.querySelectorAll('.om-edit-row').forEach(r => {
          const qty = Math.max(1, parseInt(r.querySelector('.om-qty').value, 10) || 1);
          sub += (+r.querySelector('.om-price').value || 0) * qty;
        });
        const delivery = o.delivery != null ? +o.delivery : 0;
        const discount = o.discount != null ? +o.discount : 0;
        const total = Math.max(0, sub + delivery - discount);
        totalEl.textContent = PKR(total);
        noteEl.textContent = 'Subtotal ' + PKR(sub) + (delivery ? ' · Delivery ' + PKR(delivery) : '') + (discount ? ' · Discount −' + PKR(discount) : '');
        return total;
      };

      modal.querySelector('#om-add-row').addEventListener('click', () => {
        const first = ALL_PRODUCTS()[0] || { name: 'Item', price: 0 };
        rowScope.insertAdjacentHTML('beforeend', lineRowHTML({ name: first.name, qty: 1, price: first.price, opts: '', isCustom: false }));
        recalc();
      });
      rowScope.addEventListener('click', e => {
        const rm = e.target.closest('.om-rm');
        if (!rm) return;
        rm.closest('.om-edit-row').remove();
        recalc();
      });
      rowScope.addEventListener('change', e => {
        if (e.target.classList.contains('om-prod')) {
          const opt = e.target.selectedOptions[0];
          if (opt && opt.value !== '') e.target.closest('.om-edit-row').querySelector('.om-price').value = opt.dataset.price;
        }
        recalc();
      });
      rowScope.addEventListener('input', recalc);
      modal.querySelector('#om-cancel').addEventListener('click', () => modal.querySelector('.om-close').click());
      modal.querySelector('#om-save').addEventListener('click', () => {
        const rows = [...rowScope.querySelectorAll('.om-edit-row')];
        if (!rows.length) { toast('Order must have at least one item', 'error'); return; }
        const nextLines = rows.map(r => {
          const sel = r.querySelector('.om-prod');
          const opt = sel.selectedOptions[0];
          const custom = sel.value === '';
          const name = custom ? (opt.textContent || '').replace(/^Custom — /, '') : opt.textContent.trim();
          return {
            name: name || 'Item',
            qty: Math.max(1, parseInt(r.querySelector('.om-qty').value, 10) || 1),
            price: +r.querySelector('.om-price').value || 0,
            opts: prevOpts[name] || (custom ? 'Custom cake' : ''),
            isCustom: custom,
          };
        });
        o.lines = nextLines;
        o.items = nextLines.map(l => (l.qty > 1 ? l.name + ' x' + l.qty : l.name)).join(', ');
        o.total = recalc();
        saveOrders(orders);
        toast('Order ' + o.id + ' updated', 'success');
        modal.querySelector('.om-close').click();
        renderOrders();
        renderCCOrders();
      });
    }

    function delOrderFlow(btn) {
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Confirm?';
        clearTimeout(orderDelArmTimer);
        orderDelArmTimer = setTimeout(() => {
          btn.dataset.armed = '';
          btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
        }, 3000);
        return;
      }
      btn.dataset.armed = '';
      btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
      const id = btn.dataset.delOrder;
      saveOrders(getOrders().filter(o => o.id !== id));
      orderViewed.delete(id);
      orderCleared.delete(id);
      toast('Order ' + id + ' deleted', 'success');
      renderOrders();
      renderCCOrders();
    }

    function printOrder(id) {
      const o = getOrders().find(x => x.id === id);
      if (!o) return;
      const lines = orderLines(o);
      const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
      const delivery = o.delivery != null ? +o.delivery : null;
      const discount = o.discount != null ? +o.discount : 0;
      document.getElementById('print-receipt').innerHTML = `
      <div class="pr-outer">
        <div class="pr-head">
          <span class="pr-logo"><i class="fa-solid fa-cake-candles"></i></span>
          <div><h1>Oven Diaries</h1><p>Freshly baked with love — since 2012</p></div>
        </div>
        <div class="pr-meta">
          <span>Order: <b>${esc(o.id)}</b></span>
          <span>${esc(orderDateTime(o))}</span>
          <span>Payment: <b>${(o.payment || 'cod') === 'paid' ? 'PAID' : 'CASH ON DELIVERY'}</b></span>
        </div>
        <table class="pr-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>
            ${lines.map(l => `<tr>
              <td>${esc(l.name)}${l.opts ? `<br><small>${esc(l.opts)}</small>` : ''}</td>
              <td>${l.qty}</td>
              <td>${PKR(l.price)}</td>
              <td style="text-align:right">${PKR(l.qty * l.price)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div class="pr-totals">
          <div><span>Subtotal</span><b>${PKR(sub)}</b></div>
          <div><span>Delivery</span><b>${delivery == null ? '—' : (delivery ? PKR(delivery) : 'FREE')}</b></div>
          <div><span>Discount</span><b>− ${PKR(discount)}</b></div>
          <div class="pr-grand"><span>Total bill</span><b>${PKR(o.total)}</b></div>
        </div>
        <div class="pr-cust">
          <div><span>Customer name</span><b>${esc(o.customer)}</b></div>
          <div><span>Phone</span><b>${esc(o.phone || '—')}</b></div>
          <div><span>Email</span><b>${esc(o.email || '—')}</b></div>
          <div><span>Address</span><b>${esc(o.address || '—')}</b></div>
        </div>
        <p class="pr-foot">Thank you for choosing Oven Diaries · Shop 12, Bakery Lane, Gulberg III, Lahore, Pakistan · +92 300 1234567</p>
      </div>`;
      document.body.classList.add('printing');
      setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('printing'), 600);
      }, 150);
    }

    /* ---------- Products ---------- */
    function thumbHTML(p) {
      if (p.img) return `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.closest('div').innerHTML='<div class=&quot;icon-fallback&quot;><i class=&quot;fa-solid fa-cake-candles&quot;></i></div>'">`;
      return `<div class="icon-fallback"><i class="fa-solid fa-cake-candles"></i></div>`;
    }

    let delArmTimer = null;
    const $ = id => document.getElementById(id);

    function delProductFlow(btn) {
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Confirm?';
        clearTimeout(delArmTimer);
        delArmTimer = setTimeout(() => {
          btn.dataset.armed = '';
          btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
        }, 3000);
        return;
      }
      btn.dataset.armed = '';
      btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
      deleteProduct(+btn.dataset.del);
      toast('Product deleted from the shop', 'success');
      renderProductsTable();
    }

    function renderProductsTable() {
      const body = document.getElementById('products-body');
      const all = ALL_PRODUCTS();
      const cats = ALL_CATEGORIES();
      const groups = [];
      cats.forEach(c => {
        const items = all.filter(p => p.cat === c.id);
        if (items.length) groups.push({ label: c.label, items });
      });
      const rest = all.filter(p => !cats.some(c => c.id === p.cat));
      if (rest.length) groups.push({ label: 'Other', items: rest });
      if (!groups.length) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:30px">No products yet — add your first one</td></tr>`;
        return;
      }
      const row = p => {
        const tr = isTrendingProduct(p.id);
        return `
        <tr>
          <td><div class="p-cell">
            <div style="width:46px;height:46px;border-radius:10px;overflow:hidden;position:relative;flex-shrink:0;background:${esc(p.bg)}">${thumbHTML(p)}</div>
            <span>${esc(p.name)}${getUserProducts().some(u => u.id === p.id) ? ' <small style="color:var(--caramel-dark)">(custom)</small>' : ''}</span>
          </div></td>
          <td>${esc(categoryLabel(p.cat))}</td>
          <td><b>${PKR(p.price)}</b>${p.oldPrice ? `<s style="color:var(--text-light);font-size:.8rem">${PKR(p.oldPrice)}</s>` : ''}</td>
          <td><button class="mini-btn trend${tr ? ' active' : ''}" data-trend="${p.id}" title="${tr ? 'Remove from trending' : 'Mark as trending — max 2 per category'}">
            <i class="fa-solid fa-star"></i> ${tr ? 'Selected' : 'Trending'}
          </button></td>
          <td><div class="table-actions">
            <button class="mini-btn primary" data-edit-prod="${p.id}" title="Edit product details"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="mini-btn danger" data-del="${p.id}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div></td>
        </tr>`;
      };
      body.innerHTML = groups.map(g =>
        `<tr class="cat-head"><td colspan="5"><i class="fa-solid fa-folder-open"></i> ${esc(g.label)} <small style="color:var(--text-light)">(${g.items.length})</small></td></tr>` +
        g.items.map(row).join('')
      ).join('');
      body.querySelectorAll('[data-edit-prod]').forEach(b => b.addEventListener('click', () => editProduct(b.dataset.editProd)));
      body.querySelectorAll('[data-trend]').forEach(b => b.addEventListener('click', () => {
        const r = setTrendingProduct(b.dataset.trend);
        if (!r.ok) toast(r.msg, 'error');
        else toast(r.name + (r.on ? ' is now trending — shown in Best Sellers on home page' : ' removed from trending'), r.on ? 'success' : '');
        renderProductsTable();
      }));
      body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => delProductFlow(b)));
    }

    let productEditing = null;

    function editProduct(id) {
      const p = ALL_PRODUCTS().find(x => String(x.id) === String(id));
      if (!p) return;
      productEditing = id;
      $('pf-title').textContent = 'Edit Product';
      $('pf-title-sub').textContent = 'Changes save as an override for this product and apply in the shop immediately.';
      $('pf-name').value = p.name || '';
      $('pf-price').value = p.price != null ? p.price : '';
      $('pf-desc').value = p.desc || '';
      refreshCatSelect();
      $('pf-cat').value = p.cat || '';
      const candidates = { weights: PRODUCT_WEIGHTS, sizes: PRODUCT_SIZES, flavours: PRODUCT_FLAVOURS };
      ['weights', 'sizes', 'flavours'].forEach(key => {
        const cur = Array.isArray(p[key]) ? p[key] : [];
        const merged = [...candidates[key]];
        cur.forEach(v => { if (!merged.includes(v)) merged.push(v); });
        boxOf(key).innerHTML = merged.map(apOptChip).join('');
        boxOf(key).querySelectorAll('.ap-opt').forEach(c => c.classList.toggle('sel', cur.includes(c.dataset.v)));
      });
      productColor = p.color || PRODUCT_COLORS[0].hex;
      $('pf-color').querySelector('input').value = productColor;
      setColor(productColor);
      $('pf-images').innerHTML = '';
      const entries = Array.isArray(p.images) ? p.images : (p.img ? [{ url: p.img, label: '' }] : []);
      entries.forEach(e => $('pf-images').insertAdjacentHTML('beforeend', pfImgHTML(e)));
      $('product-editor').style.display = 'block';
      $('product-editor').scrollIntoView({ behavior: 'smooth' });
      $('pf-name').focus();
    }

    /* ---------- Add product form ---------- */
    const PRODUCT_WEIGHTS = ['1 lb', '2 lb', '3 lb', '5 lb'];
    const PRODUCT_SIZES = ['Half Kg', '1 Kg', '1.5 Kg', '2 Kg', 'Regular', 'Large', 'Family Pack'];
    const PRODUCT_FLAVOURS = ['Vanilla', 'Chocolate', 'Strawberry', 'Red Velvet', 'Mango', 'Pistachio', 'Blueberry', 'Butterscotch', 'Caramel', 'Classic', 'Cheese', 'Spicy', 'Garlic', 'Berry', 'Fruity', 'BBQ'];
    const PRODUCT_COLORS = [
      { name: 'Caramel', hex: '#d9a05b' },
      { name: 'Rose',    hex: '#f2a7b3' },
      { name: 'Mint',    hex: '#6e9d5c' },
      { name: 'Butter',  hex: '#e8b44c' },
      { name: 'Peach',   hex: '#ffb37a' },
      { name: 'Berry',   hex: '#c94f4f' },
      { name: 'Sky',     hex: '#7fb3d5' },
      { name: 'Cocoa',   hex: '#8a5a41' },
    ];
    let productColor = PRODUCT_COLORS[0].hex;

    function refreshCatSelect() {
      $('pf-cat').innerHTML = ALL_CATEGORIES().map(c => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
    }

    /* ---- option chips (weight / size / flavour) ---- */
    const apOptChip = v => `<button type="button" class="ap-opt" data-v="${esc(v)}">${esc(v)}</button>`;
    const boxOf = key => $('pf-' + key);
    const fillOptions = (key, list) => { boxOf(key).innerHTML = list.map(apOptChip).join(''); };
    const selectedOptions = key => [...boxOf(key).querySelectorAll('.ap-opt.sel')].map(b => b.dataset.v);

    fillOptions('weights', PRODUCT_WEIGHTS);
    fillOptions('sizes', PRODUCT_SIZES);
    fillOptions('flavours', PRODUCT_FLAVOURS);

    document.querySelectorAll('#product-form .ap-chips').forEach(box => box.addEventListener('click', e => {
      const chip = e.target.closest('.ap-opt');
      if (chip) chip.classList.toggle('sel');
    }));
    document.querySelectorAll('#product-form [data-add-option]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.addOption;
      const input = btn.parentElement.querySelector('[data-custom]');
      const v = input.value.trim();
      if (!v) return;
      const box = boxOf(key);
      if ([...box.children].some(c => c.dataset.v === v)) { input.value = ''; return; }
      box.insertAdjacentHTML('beforeend', apOptChip(v));
      box.lastElementChild.classList.add('sel');
      input.value = '';
    }));
    document.querySelectorAll('#product-form [data-custom]').forEach(inp => inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.parentElement.querySelector('[data-add-option]').click(); }
    }));

    /* ---- colour picker ---- */
    function setColor(hex) {
      productColor = hex || PRODUCT_COLORS[0].hex;
      document.querySelectorAll('#pf-colors .color-swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === productColor));
      const custom = $('pf-color');
      custom.classList.toggle('active', !PRODUCT_COLORS.some(c => c.hex === productColor));
    }

    $('pf-colors').innerHTML = PRODUCT_COLORS.map((c, i) =>
      `<button type="button" class="color-swatch${i === 0 ? ' active' : ''}" data-hex="${c.hex}" style="background:${c.hex}" title="${esc(c.name)}" aria-label="${esc(c.name)}"></button>`).join('') +
      '<label class="color-custom" id="pf-color" title="Custom colour"><input type="color" value="#d9a05b" aria-label="Custom colour"></label>';

    document.querySelectorAll('#pf-colors .color-swatch').forEach(s => s.addEventListener('click', () => setColor(s.dataset.hex)));
    $('pf-color').querySelector('input').addEventListener('input', e => setColor(e.target.value));

    /* ---- image upload ---- */
    const pfImgHTML = entry => `
      <div class="img-tile">
        <div class="tile-prev">${entry && entry.url ? `<img src="${esc(entry.url)}" alt="preview" onerror="this.remove()">` : '<i class="fa-solid fa-image"></i>'}</div>
        <input class="i-label" placeholder="Label — e.g. 1 Kg • Vanilla" maxlength="80" value="${esc((entry || {}).label || '')}">
        <input class="i-url" placeholder="Image URL" value="${esc((entry || {}).url || '')}">
        <div class="tile-actions">
          <label class="tile-upload" title="Upload image"><i class="fa-solid fa-upload"></i><input type="file" accept="image/*" hidden class="i-file"></label>
          <button type="button" class="tile-rem" title="Remove image"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
    const pfImgValues = () => [...document.querySelectorAll('#pf-images .img-tile')].map(t => ({
      label: t.querySelector('.i-label').value.trim(),
      url: t.querySelector('.i-url').value.trim(),
    })).filter(e => e.url);
    const pfTilePreview = (tile, url) => {
      const pv = tile.querySelector('.tile-prev');
      pv.innerHTML = url ? `<img src="${esc(url)}" alt="preview" onerror="this.remove()">` : '<i class="fa-solid fa-image"></i>';
    };

    $('pf-img-add').addEventListener('click', () => {
      $('pf-images').insertAdjacentHTML('beforeend', pfImgHTML());
      $('pf-images').lastElementChild.querySelector('.i-label').focus();
    });
    $('pf-images').addEventListener('input', e => {
      const tile = e.target.closest('.img-tile');
      if (e.target.classList.contains('i-url')) pfTilePreview(tile, e.target.value.trim());
      if (e.target.classList.contains('i-file')) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          tile.querySelector('.i-url').value = ev.target.result;
          pfTilePreview(tile, ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    $('pf-images').addEventListener('click', e => {
      const rem = e.target.closest('.tile-rem');
      if (rem) rem.closest('.img-tile').remove();
    });

    function resetAddForm() {
      productEditing = null;
      $('pf-title').textContent = 'New Product';
      $('pf-title-sub').textContent = 'No field is required — save anytime and add details later.';
      $('pf-name').value = '';
      $('pf-price').value = '';
      $('pf-desc').value = '';
      refreshCatSelect();
      $('pf-cat').selectedIndex = 0;
      ['weights', 'sizes', 'flavours'].forEach(k => { boxOf(k).querySelectorAll('.ap-opt').forEach(c => c.classList.remove('sel')); });
      $('pf-colors').querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      setColor(PRODUCT_COLORS[0].hex);
      $('pf-images').innerHTML = '';
    }

    $('new-product').addEventListener('click', () => {
      const editor = $('product-editor');
      if (editor.style.display === 'block') { editor.style.display = 'none'; return; }
      resetAddForm();
      editor.style.display = 'block';
      editor.scrollIntoView({ behavior: 'smooth' });
      $('pf-name').focus();
    });
    $('pf-cancel').addEventListener('click', () => $('product-editor').style.display = 'none');

    $('product-form').addEventListener('submit', e => {
      e.preventDefault();
      const imgs = pfImgValues();
      const data = {
        name: $('pf-name').value.trim() || 'Untitled Product',
        cat: $('pf-cat').value || (ALL_CATEGORIES()[0] || {}).id || 'cakes',
        price: +$('pf-price').value || 0,
        desc: $('pf-desc').value.trim(),
        weights: selectedOptions('weights'),
        sizes: selectedOptions('sizes'),
        flavours: selectedOptions('flavours'),
        images: imgs,
        img: (imgs[0] || {}).url || '',
        color: productColor,
        bg: 'linear-gradient(135deg,' + productColor + '33,' + productColor + ')',
      };
      if (productEditing) {
        saveProductEdit(productEditing, data);
        toast('Product updated in the menu', 'success');
      } else {
        const list = getUserProducts();
        list.push({ id: Date.now(), ...data });
        saveUserProducts(list);
        toast('Product added to the menu', 'success');
      }
      resetAddForm();
      renderProductsTable();
    });

    /* ---------- Bakery open/close toggle ---------- */
    function renderShopStatus() {
      const closed = SHOP_CLOSED();
      const btn = document.getElementById('toggle-shop');
      btn.innerHTML = closed
        ? '<i class="fa-solid fa-store"></i> Open Bakery'
        : '<i class="fa-solid fa-store-slash"></i> Close Bakery';
    }
    document.getElementById('toggle-shop').addEventListener('click', () => {
      const closed = SHOP_CLOSED();
      if (closed) localStorage.removeItem('od_shop_closed'); else localStorage.setItem('od_shop_closed', '1');
      renderShopStatus();
      toast(closed ? 'Bakery is now open — ordering enabled' : 'Bakery is now closed — ordering hidden', 'success');
    });
    renderShopStatus();

    /* ---------- Bakery / Categories ---------- */
    let catEditing = null;
    let deleteArmTimer = null;

    function renderCategories() {
      const body = document.getElementById('cats-body');
      const cats = ALL_CATEGORIES();
      if (!cats.length) {
        body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:30px">No categories yet — click "Add Category" to create one</td></tr>`;
        return;
      }
      body.innerHTML = cats.map((c, i) => {
        const count = ALL_PRODUCTS().filter(p => p.cat === c.id).length;
        return `
          <tr>
            <td>${i + 1}</td>
            <td><b>${esc(c.label)}</b>${getUserCategories().some(u => u.id === c.id) ? ' <small style="color:var(--caramel-dark)">(custom)</small>' : ''}</td>
            <td>${count} product${count === 1 ? '' : 's'}</td>
            <td><div class="table-actions">
              <button class="mini-btn primary" data-edit-cat="${esc(c.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="mini-btn danger" data-del-cat="${esc(c.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
            </div></td>
          </tr>`;
      }).join('');
      body.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => openCatEditor(b.dataset.editCat)));
      body.querySelectorAll('[data-del-cat]').forEach(b => b.addEventListener('click', () => deleteCatFlow(b)));
    }

    function deleteCatFlow(btn) {
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Confirm?';
        clearTimeout(deleteArmTimer);
        deleteArmTimer = setTimeout(() => {
          btn.dataset.armed = '';
          btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
        }, 3000);
        return;
      }
      btn.dataset.armed = '';
      btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
      const id = btn.dataset.delCat;
      const count = ALL_PRODUCTS().filter(p => p.cat === id).length;
      deleteCategory(id);
      toast('Category deleted — ' + count + ' product(s) removed from the shop', 'success');
      renderCategories();
    }

    function openCatEditor(id) {
      catEditing = id;
      $('cat-editor-title').textContent = 'Edit Category';
      const c = ALL_CATEGORIES().find(x => x.id === id);
      $('cat-name').value = c ? c.label : '';
      $('cat-editor').style.display = 'block';
      $('cat-editor').scrollIntoView({ behavior: 'smooth' });
      $('cat-name').focus();
    }

    $('add-cat').addEventListener('click', () => {
      catEditing = null;
      $('cat-editor-title').textContent = 'Add Category';
      $('cat-name').value = '';
      $('cat-editor').style.display = 'block';
      $('cat-editor').scrollIntoView({ behavior: 'smooth' });
      $('cat-name').focus();
    });

    $('cat-cancel').addEventListener('click', () => $('cat-editor').style.display = 'none');

    $('cat-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('cat-name').value.trim();
      if (!name) return;
      if (ALL_CATEGORIES().some(x => x.id !== catEditing && x.label.toLowerCase() === name.toLowerCase())) {
        toast('A category called "' + name + '" already exists', '');
        return;
      }
      if (catEditing) renameCategory(catEditing, name);
      else addCategory(name);
      $('cat-editor').style.display = 'none';
      toast(catEditing ? 'Category renamed' : 'Category added to the bakery', 'success');
      renderCategories();
    });

    /* ---------- Custom Cake options ---------- */
    const CC_GROUPS = [
      { key: 'flavours', title: 'Flavour' },
      { key: 'bases', title: 'Cake Type' },
      { key: 'sizes', title: 'Size' },
      { key: 'extras', title: 'Message & Finishing Option' },
      { key: 'candles', title: 'Candle' },
    ];
    const ccListOf = key => ({ flavours: CC_FLAVOURS, bases: CC_BASES, sizes: CC_SIZES, extras: CC_EXTRAS, candles: CC_CANDLES }[key]());
    const ccDefaultIds = key => ({ flavours: FLAVORS, bases: CAKE_BASES, sizes: SIZES, extras: CAKE_EXTRAS, candles: CAKE_CANDLES }[key].map(x => x.id));
    let ccEditing = null;
    let ccDelArmTimer = null;

    function renderCCGroups() {
      CC_GROUPS.forEach(g => {
        const body = document.getElementById('cc-' + g.key + '-body');
        const list = ccListOf(g.key);
        const defaults = ccDefaultIds(g.key);
        body.innerHTML = list.length ? list.map(o => `
          <tr>
            <td><b>${esc(o.name)}</b>${defaults.includes(o.id) ? '' : ' <small style="color:var(--caramel-dark)">(custom)</small>'}</td>
            <td>${+o.price ? PKR(o.price) : '<span style="color:var(--green)">Free</span>'}</td>
            <td><div class="table-actions">
              <button class="mini-btn primary" data-edit-cc="${esc(o.id)}" data-key="${g.key}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="mini-btn danger" data-del-cc="${esc(o.id)}" data-key="${g.key}"><i class="fa-solid fa-trash"></i> Delete</button>
            </div></td>
          </tr>`).join('')
          : `<tr><td colspan="3" style="text-align:center;color:var(--text-light);padding:22px">No options here — click "Add" above to create one</td></tr>`;
      });
      document.querySelectorAll('[data-edit-cc]').forEach(b => b.addEventListener('click', () => openCCEditor(b.dataset.key, b.dataset.editCc)));
      document.querySelectorAll('[data-del-cc]').forEach(b => b.addEventListener('click', () => delCCFlow(b)));
      renderCCOrders();
    }

    function renderCCOrders() {
      const orders = getOrders().filter(o => o.source === 'custom');
      const count = document.getElementById('cc-orders-count');
      const body = document.getElementById('cc-orders-body');
      count.textContent = orders.length;
      count.style.background = orders.length ? 'var(--caramel-dark)' : '';
      if (!orders.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:30px"><i class="fa-solid fa-moped"></i> No custom cake orders yet — they will appear here when customers place an order on the Custom Cake page</td></tr>`;
        return;
      }
      body.innerHTML = orders.map(o => `
        <tr>
          <td><b>${esc(o.id)}</b><br><small style="color:var(--text-light)">${esc(o.phone || '')}</small></td>
          <td><b>${esc(o.customer)}</b><br><small style="color:var(--text-light)">${esc(o.address || 'Pickup')}</small></td>
          <td style="font-size:.85rem">${esc(orderLines(o).map(l => (l.qty > 1 ? l.name + ' ×' + l.qty : l.name)).join(', '))}</td>
          <td><b>${PKR(o.total)}</b></td>
          <td style="white-space:nowrap">${esc(orderDateTime(o))}</td>
          <td><div class="table-actions">
            <button class="mini-btn primary" data-view="${esc(o.id)}"><i class="fa-solid fa-eye"></i> View</button>
            <button class="mini-btn primary" data-edit-order="${esc(o.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="mini-btn" data-print="${esc(o.id)}"><i class="fa-solid fa-print"></i> Print</button>
            <button class="mini-btn danger" data-del-order="${esc(o.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div></td>
        </tr>`).join('');
      body.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => viewOrder(b.dataset.view)));
      body.querySelectorAll('[data-edit-order]').forEach(b => b.addEventListener('click', () => editOrder(b.dataset.editOrder)));
      body.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => printOrder(b.dataset.print)));
      body.querySelectorAll('[data-del-order]').forEach(b => b.addEventListener('click', () => delOrderFlow(b)));
    }

    function openCCEditor(key, id) {
      ccEditing = { key, id: id || null };
      const group = CC_GROUPS.find(g => g.key === key);
      $('cc-editor-title').textContent = (id ? 'Edit ' : 'Add ') + group.title;
      $('cc-editor-name-label').textContent = group.title + ' name *';
      const item = id ? ccListOf(key).find(x => x.id === id) : null;
      $('cc-name').value = item ? item.name : '';
      $('cc-price').value = item ? (+item.price || 0) : '';
      $('cc-editor').style.display = 'block';
      $('cc-editor').scrollIntoView({ behavior: 'smooth' });
      $('cc-name').focus();
    }

    function delCCFlow(btn) {
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Confirm?';
        clearTimeout(ccDelArmTimer);
        ccDelArmTimer = setTimeout(() => {
          btn.dataset.armed = '';
          btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
        }, 3000);
        return;
      }
      btn.dataset.armed = '';
      btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
      const key = btn.dataset.key, id = btn.dataset.delCc;
      saveCCList(key, ccListOf(key).filter(x => x.id !== id));
      toast('Option deleted from the Custom Cake page', 'success');
      renderCCGroups();
    }

    document.querySelectorAll('[data-add-cc]').forEach(b => b.addEventListener('click', () => openCCEditor(b.dataset.addCc, null)));

    $('cc-cancel').addEventListener('click', () => $('cc-editor').style.display = 'none');

    $('cc-form').addEventListener('submit', e => {
      e.preventDefault();
      if (!ccEditing) return;
      const key = ccEditing.key;
      const name = $('cc-name').value.trim();
      const price = +$('cc-price').value || 0;
      if (!name) { toast('Please enter a name for this option', 'error'); return; }
      const list = ccListOf(key);
      if (list.some(x => x.id !== ccEditing.id && x.name.toLowerCase() === name.toLowerCase())) {
        toast('An option with this name already exists', '');
        return;
      }
      if (ccEditing.id) {
        const i = list.findIndex(x => x.id === ccEditing.id);
        if (i > -1) list[i] = { ...list[i], name, price };
      } else {
        let id = slugify(name);
        if (list.some(x => x.id === id)) id = id + '-' + Date.now();
        list.push({ id, name, price });
      }
      saveCCList(key, list);
      $('cc-editor').style.display = 'none';
      toast(ccEditing.id ? 'Option updated' : 'Option added to the Custom Cake page', 'success');
      renderCCGroups();
    });

    /* ---------- Users ---------- */
    let custEditingIndex = null;

    function renderCustomers() {
      const body = document.getElementById('customers-body');
      const me = requireAdmin();
      const users = Auth.users();
      if (!users.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:26px">No registered accounts yet.</td></tr>`;
        return;
      }
      body.innerHTML = users.map((u, i) => `
        <tr${u.banned ? ' style="opacity:.7"' : ''}>
          <td><b>${esc(u.name)}</b>${u.role === 'admin' ? ' <span class="status-pill pending">ADMIN</span>' : ''}</td>
          <td>${esc(u.email)}</td>
          <td>${esc(u.phone || '—')}</td>
          <td>${u.role === 'admin' ? '<span style="color:var(--gold);font-weight:600"><i class="fa-solid fa-gear"></i> Admin</span>' : '<span style="color:var(--green)"><i class="fa-solid fa-user"></i> User</span>'}</td>
          <td>${u.banned ? '<span class="status-pill danger"><i class="fa-solid fa-ban"></i> BANNED</span>' : '<span class="status-pill delivered"><i class="fa-solid fa-circle-check"></i> ACTIVE</span>'}</td>
          <td><div class="table-actions" style="flex-wrap:wrap">
            <button class="mini-btn primary" data-edit-cust="${i}"><i class="fa-solid fa-pen"></i> Edit</button>
            ${me && me.email === u.email
              ? '<button class="mini-btn" disabled title="You cannot ban your own account"><i class="fa-solid fa-ban"></i> Ban</button>'
              : `<button class="mini-btn ${u.banned ? 'success' : 'danger'}" data-ban-cust="${i}"><i class="fa-solid ${u.banned ? 'fa-rotate-left' : 'fa-ban'}"></i> ${u.banned ? 'Unban' : 'Ban'}</button>`}
          </div></td>
        </tr>`).join('');

      body.querySelectorAll('[data-edit-cust]').forEach(b => b.addEventListener('click', () => {
        const u = Auth.users()[+b.dataset.editCust];
        if (!u) return;
        custEditingIndex = +b.dataset.editCust;
        document.getElementById('cust-editor-title').textContent = 'Edit User — ' + u.name;
        document.getElementById('cust-name').value = u.name || '';
        document.getElementById('cust-email').value = u.email || '';
        document.getElementById('cust-phone').value = u.phone || '';
        document.getElementById('cust-pass').value = u.pass || '';
        document.getElementById('cust-editor').style.display = 'block';
        document.getElementById('cust-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));

      body.querySelectorAll('[data-ban-cust]').forEach(b => b.addEventListener('click', () => {
        const users = Auth.users();
        const u = users[+b.dataset.banCust];
        if (!u) return;
        if (!u.banned && me && me.email === u.email) { toast('You cannot ban your own account', 'error'); return; }
        u.banned = !u.banned;
        Auth.saveUsers(users);
        toast(u.banned ? u.name + ' has been banned and can no longer log in' : u.name + ' has been unbanned', u.banned ? '' : 'success');
        renderCustomers();
      }));
    }

    document.getElementById('cust-cancel').addEventListener('click', () => document.getElementById('cust-editor').style.display = 'none');
    document.getElementById('cust-form').addEventListener('submit', e => {
      e.preventDefault();
      if (custEditingIndex === null) return;
      const users = Auth.users();
      const u = users[custEditingIndex];
      if (!u) return;
      const prevEmail = u.email;
      const name = document.getElementById('cust-name').value.trim();
      const email = document.getElementById('cust-email').value.trim().toLowerCase();
      const phone = document.getElementById('cust-phone').value.trim();
      const pass = document.getElementById('cust-pass').value;
      if (!name) { toast('Enter the name', 'error'); return; }
      if (!email) { toast('Enter the email address', 'error'); return; }
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Enter a valid email address', 'error'); return; }
      if (!pass) { toast('Enter the password', 'error'); return; }
      if (users.some(x => x.email.toLowerCase() === email && x.email.toLowerCase() !== prevEmail.toLowerCase())) { toast('Another account already uses this email', 'error'); return; }
      u.name = name;
      u.email = email;
      u.phone = phone;
      u.pass = pass;
      Auth.saveUsers(users);
      const cur = Auth.current();
      if (cur && cur.email === prevEmail) {
        localStorage.setItem('od_current', JSON.stringify({ name, email, role: u.role }));
      }
      toast('User details updated', 'success');
      document.getElementById('cust-editor').style.display = 'none';
      renderCustomers();
    });

/* ---------- Offers & Delivery ---------- */
    let offerEditing = null;
    let offerDelTimer = null;

    function renderOffers() {
      const list = getOfferList();
      const active = getActiveOffer();
      const body = document.getElementById('offers-body');
      if (!list.length) {
        body.innerHTML = `<div class="offer-empty">
          <i class="fa-solid fa-tags" style="font-size:1.9rem;color:var(--caramel);opacity:.7"></i>
          <p style="margin:12px 0 0"><b>No offers yet</b><br><span style="font-size:.85rem">Click "Add Offer" to create your first percentage discount — it appears as an elegant card here and in the home page Offers section.</span></p>
        </div>`;
        return;
      }
      body.innerHTML = list.map((o, i) => {
        const isActive = active && String(active.id) === String(o.id);
        return `
        <div class="offer-card mini offer-${(i % 4) + 1} ${isActive ? 'offer-live' : ''}">
          <span class="offer-badge"><i class="fa-solid fa-bullhorn"></i> ACTIVE</span>
          <div class="offer-pct"><b>${+o.percent || 0}</b><span>%</span></div>
          <div class="offer-info">
            <span class="offer-tag">Percentage Offer</span>
            <h3>${esc(o.title)}</h3>
            ${isActive
              ? '<span class="offer-set" style="cursor:default"><i class="fa-solid fa-check"></i> Live in cart</span>'
              : `<button class="offer-set" data-activate="${esc(o.id)}"><i class="fa-solid fa-circle-check"></i> Set Active</button>`}
            <div class="offer-actions">
              <button class="mini-btn primary" data-edit-offer="${esc(o.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
              <button class="mini-btn danger" data-del-offer="${esc(o.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </div>
        </div>`;
      }).join('');
      body.querySelectorAll('[data-activate]').forEach(b => b.addEventListener('click', () => {
        const o = getOfferList().find(x => String(x.id) === String(b.dataset.activate));
        if (!o) return;
        saveActiveOffer(o);
        toast(`${o.title} is now active — ${+o.percent}% off in the cart`, 'success');
        renderOffers();
      }));
      body.querySelectorAll('[data-edit-offer]').forEach(b => b.addEventListener('click', () => {
        const o = getOfferList().find(x => String(x.id) === String(b.dataset.editOffer));
        if (!o) return;
        offerEditing = o.id;
        document.getElementById('of-editor-title').textContent = 'Edit Offer';
        document.getElementById('of-title').value = o.title;
        document.getElementById('of-percent').value = o.percent;
        document.getElementById('of-editor').style.display = 'block';
        document.getElementById('of-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
      body.querySelectorAll('[data-del-offer]').forEach(b => b.addEventListener('click', () => {
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sure?';
          clearTimeout(offerDelTimer);
          offerDelTimer = setTimeout(() => renderOffers(), 2600);
          return;
        }
        const id = b.dataset.delOffer;
        saveOfferList(getOfferList().filter(x => String(x.id) !== String(id)));
        const active = getActiveOffer();
        if (active && String(active.id) === String(id)) localStorage.removeItem('od_active_offer');
        toast('Offer deleted', 'success');
        renderOffers();
      }));
    }

    document.getElementById('add-offer').addEventListener('click', () => {
      offerEditing = null;
      document.getElementById('of-editor-title').textContent = 'Add Offer';
      document.getElementById('of-title').value = '';
      document.getElementById('of-percent').value = '';
      document.getElementById('of-editor').style.display = 'block';
      document.getElementById('of-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('of-cancel').addEventListener('click', () => {
      document.getElementById('of-editor').style.display = 'none';
    });
    document.getElementById('of-form').addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('of-title').value.trim();
      const percent = Math.round(+document.getElementById('of-percent').value || 0);
      if (!title) { toast('Enter an offer title', 'error'); return; }
      if (percent < 1 || percent > 100) { toast('Percentage must be between 1 and 100', 'error'); return; }
      const list = getOfferList();
      const active = getActiveOffer();
      if (offerEditing) {
        const i = list.findIndex(x => String(x.id) === String(offerEditing));
        if (i > -1) {
          list[i] = { ...list[i], title, percent };
          if (active && String(active.id) === String(offerEditing)) saveActiveOffer(list[i]);
        }
        saveOfferList(list);
        toast('Offer updated', 'success');
      } else {
        let id = slugify(title);
        if (list.some(x => x.id === id)) id = id + '-' + Date.now();
        list.push({ id, title, percent });
        saveOfferList(list);
        if (!active) saveActiveOffer(list[list.length - 1]);
        toast(active ? 'Offer added — click "Set Active" to apply it in the cart' : 'Offer added and set active in the cart', 'success');
      }
      document.getElementById('of-editor').style.display = 'none';
      renderOffers();
    });

    function renderDeliverySettings() {
      const s = getDeliverySettings();
      document.querySelectorAll('input[name="delivery-mode"]').forEach(r => {
        r.checked = r.value === (s.mode || 'free');
      });
    }

    document.querySelectorAll('input[name="delivery-mode"]').forEach(r => r.addEventListener('change', () => {
      const s = getDeliverySettings();
      s.mode = r.value;
      if (!s.city) s.city = getCities()[0].id;
      saveDeliverySettings(s);
      toast(r.value === 'paid'
        ? 'Paid delivery enabled — add your cities and area prices in the Delivery section'
        : 'Free delivery enabled — a FREE DELIVERY card shows on the home page and delivery is Rs. 0 in the cart', 'success');
      renderDeliverySettings();
    }));

    /* ---------- Delivery panel: cities & areas ---------- */
    let delAreaCity = null;
    let delEditId = null;
    let delAreaTimer = null;
    let delCityTimer = null;
    const getCustomCities = () => {
      try { const c = JSON.parse(localStorage.getItem('od_custom_cities')); if (Array.isArray(c)) return c; } catch (e) {}
      return [];
    };
    const getHiddenCities = () => {
      try { const h = JSON.parse(localStorage.getItem('od_hidden_cities')); if (Array.isArray(h)) return h; } catch (e) {}
      return [];
    };

    function renderDeliveryPanel() {
      const cities = getCities();
      const citySel = document.getElementById('del-area-city');
      citySel.innerHTML = cities.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
      if (delAreaCity && [...citySel.options].some(o => o.value === delAreaCity)) citySel.value = delAreaCity;
      else delAreaCity = citySel.value;
      document.getElementById('del-cities-list').innerHTML = cities.map(c => {
        const cAreas = deliveryAreasFor(c.id);
        return `
          <div class="cc-group">
            <h3><i class="fa-solid fa-city"></i> ${esc(c.name)} <span class="cc-count">${cAreas.length} area${cAreas.length === 1 ? '' : 's'}</span>
              <button class="mini-btn danger" data-del-city="${esc(c.id)}" style="margin-left:auto" title="Delete this city and all its areas"><i class="fa-solid fa-trash"></i> Delete City</button></h3>
            ${cAreas.length ? `<div class="admin-table-wrap"><table class="admin-table">
              <thead><tr><th>Area</th><th>Delivery Price (PKR)</th><th>Actions</th></tr></thead>
              <tbody>${cAreas.map(a => delAreaRowHTML(a)).join('')}</tbody>
            </table></div>` : '<p style="color:var(--text-light);font-size:.85rem">No areas yet — use the form above to add areas with their prices.</p>'}
          </div>`;
      }).join('');
      document.getElementById('del-cities-list').querySelectorAll('[data-edit-area]').forEach(b => b.addEventListener('click', () => {
        delEditId = b.dataset.editArea;
        renderDeliveryPanel();
      }));
      document.getElementById('del-cities-list').querySelectorAll('[data-del-area]').forEach(b => b.addEventListener('click', () => {
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sure?';
          clearTimeout(delAreaTimer);
          delAreaTimer = setTimeout(() => renderDeliveryPanel(), 2600);
          return;
        }
        saveDeliveryAreas(getDeliveryAreas().filter(x => String(x.id) !== String(b.dataset.delArea)));
        toast('Area removed from delivery list', 'success');
        renderDeliveryPanel();
      }));
      const save = document.getElementById('del-edit-save');
      if (save) save.addEventListener('click', () => {
        const name = document.getElementById('del-edit-name').value.trim();
        const price = Math.round(Math.max(0, +document.getElementById('del-edit-price').value || 0));
        if (!name) { toast('Enter an area name', 'error'); return; }
        const list = getDeliveryAreas();
        const i = list.findIndex(x => String(x.id) === String(delEditId));
        if (i > -1) { list[i] = { ...list[i], name, price }; saveDeliveryAreas(list); toast('Area updated', 'success'); }
        delEditId = null;
        renderDeliveryPanel();
      });
      const cancel = document.getElementById('del-edit-cancel');
      if (cancel) cancel.addEventListener('click', () => { delEditId = null; renderDeliveryPanel(); });
    }

    function deleteCityFlow(btn) {
      if (!btn.dataset.armed) {
        btn.dataset.armed = '1';
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sure?';
        clearTimeout(delCityTimer);
        delCityTimer = setTimeout(() => renderDeliveryPanel(), 2600);
        return;
      }
      const id = btn.dataset.delCity;
      const cityLabel = getCities().find(c => c.id === id)?.name || id;
      const custom = getCustomCities();
      if (custom.some(c => c.id === id)) {
        saveCustomCities(custom.filter(c => c.id !== id));
      } else {
        const hid = getHiddenCities();
        if (!hid.includes(id)) { hid.push(id); localStorage.setItem('od_hidden_cities', JSON.stringify(hid)); }
      }
      saveDeliveryAreas(getDeliveryAreas().filter(a => String(a.city) !== String(id)));
      const s = getDeliverySettings();
      if (s.city === id) { s.city = getCities()[0].id; saveDeliverySettings(s); }
      if (delAreaCity === id) delAreaCity = null;
      toast(`City "${cityLabel}" and its areas deleted`, 'success');
      renderDeliveryPanel();
    }

    document.getElementById('del-cities-list').addEventListener('click', e => {
      const b = e.target.closest('[data-del-city]');
      if (b) deleteCityFlow(b);
    });

    function delAreaRowHTML(a) {
      if (delEditId === a.id) return `
        <tr>
          <td><input id="del-edit-name" maxlength="60" value="${esc(a.name)}" style="padding:8px 10px;border:1.5px solid var(--border);border-radius:10px;font:inherit;width:100%;min-width:130px;outline:none"></td>
          <td><input id="del-edit-price" type="number" min="0" step="50" value="${+a.price || 0}" style="padding:8px 10px;border:1.5px solid var(--border);border-radius:10px;font:inherit;width:120px;outline:none"></td>
          <td><div class="table-actions">
            <button class="mini-btn success" id="del-edit-save"><i class="fa-solid fa-check"></i> Save</button>
            <button class="mini-btn" id="del-edit-cancel">Cancel</button>
          </div></td>
        </tr>`;
      return `
        <tr>
          <td><b>${esc(a.name)}</b></td>
          <td>${+a.price > 0 ? PKR(a.price) : 'FREE'}</td>
          <td><div class="table-actions">
            <button class="mini-btn primary" data-edit-area="${esc(a.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="mini-btn danger" data-del-area="${esc(a.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div></td>
        </tr>`;
    }

    document.getElementById('add-del-city').addEventListener('click', () => {
      const name = document.getElementById('del-new-city').value.trim();
      if (!name) { toast('Enter a city name', 'error'); return; }
      if (getCities().some(c => c.name.toLowerCase() === name.toLowerCase())) { toast('This city already exists', 'error'); return; }
      const custom = getCustomCities();
      const id = slugify(name);
      if (custom.some(c => c.id === id)) { toast('This city already exists', 'error'); return; }
      custom.push({ id, name });
      saveCustomCities(custom);
      document.getElementById('del-new-city').value = '';
      delAreaCity = id;
      renderDeliveryPanel();
      toast(`City "${name}" added — add its areas and prices below`, 'success');
      document.getElementById('del-area-name').focus();
    });

    document.getElementById('del-area-city').addEventListener('change', e => {
      delAreaCity = e.target.value;
      renderDeliveryPanel();
    });

    document.getElementById('del-area-add').addEventListener('click', () => {
      const cityId = document.getElementById('del-area-city').value;
      const name = document.getElementById('del-area-name').value.trim();
      const price = Math.round(Math.max(0, +document.getElementById('del-area-price').value || 0));
      if (!name) { toast('Enter an area name', 'error'); return; }
      if (deliveryAreasFor(cityId).some(x => x.name.toLowerCase() === name.toLowerCase())) { toast(`Area "${name}" already exists in ${cityName(cityId)}`, 'error'); return; }
      const list = getDeliveryAreas();
      let id = slugify(name);
      if (list.some(x => x.id === id)) id = id + '-' + Date.now();
      list.push({ id, name, price, city: cityId });
      saveDeliveryAreas(list);
      document.getElementById('del-area-name').value = '';
      document.getElementById('del-area-price').value = '';
      toast(`Area "${name}" added to ${cityName(cityId)} — ${price > 0 ? PKR(price) : 'FREE'} delivery`, 'success');
      renderDeliveryPanel();
      document.getElementById('del-area-name').focus();
    });

    /* ---------- Complaints ---------- */
    const INITIAL_COMPLAINTS = [
      { id: 'CMP-1001', orderId: 'OD-1844', customer: 'Sara Malik — 0322-9988776', description: 'Custom fondant cake arrived three hours late for my daughter\'s party.', file: '', fileType: '', ticked: false, at: '2026-08-15T18:42:00' },
      { id: 'CMP-1002', orderId: 'OD-1843', customer: 'Hamza Raza — h.raza@outlook.com', description: 'The classic zinger burger combo arrived without its meal drink.', file: 'zinger-order.jpg', fileType: 'image/jpeg', ticked: true, at: '2026-08-14T13:25:00' }
    ];
    const getComplaints = () => {
      try { const c = JSON.parse(localStorage.getItem('od_complaints')); if (Array.isArray(c)) return c; } catch (e) {}
      localStorage.setItem('od_complaints', JSON.stringify(INITIAL_COMPLAINTS));
      return INITIAL_COMPLAINTS;
    };
    const saveComplaints = c => localStorage.setItem('od_complaints', JSON.stringify(c));

    function complaintDateTime(c) {
      const d = new Date(c.at || c.date);
      if (!isNaN(d)) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return c.date || '—';
    }

    let compEditing = null;
    let compDelTimer = null;

    function viewComplaint(id) {
      const c = getComplaints().find(x => String(x.id) === String(id));
      if (!c) return;
      const fileInfo = (c.file || c.fileName)
        ? `<div class="om-row"><span>Attachment</span><b><i class="fa-solid fa-paperclip"></i> ${esc(c.file || c.fileName)} <small style="color:var(--text-light)">(${esc(c.fileType || 'file')})</small></b></div>`
        : '<div class="om-row"><span>Attachment</span><b>—</b></div>';
      openOrderModal(`
        <p class="om-tag">Complaint details</p>
        <h3>${esc(c.id)}</h3>
        <p class="om-sub">Lodged ${esc(complaintDateTime(c))} ${c.ticked ? '<span class="status-pill delivered"><i class="fa-solid fa-check"></i> DONE</span>' : '<span class="status-pill pending">OPEN</span>'}</p>
        <div class="om-section">
          <h4><i class="fa-solid fa-user"></i> Customer</h4>
          <div class="om-row"><span>Order ID</span><b>${esc(c.orderId || '—')}</b></div>
          <div class="om-row"><span>Customer</span><b>${esc(c.customer || '—')}</b></div>
          ${fileInfo}
        </div>
        <div class="om-section">
          <h4><i class="fa-solid fa-comment-dots"></i> Description</h4>
          <p style="color:var(--text);font-size:.92rem;line-height:1.7;margin:6px 0 0;white-space:pre-wrap">${esc(c.description || '—')}</p>
        </div>`);
    }

    function renderComplaints() {
      const list = getComplaints();
      const body = document.getElementById('complaints-body');
      if (!list.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:26px"><i class="fa-solid fa-circle-info" style="margin-right:6px"></i>No complaints yet — ones submitted from the About page will appear here automatically.</td></tr>`;
        return;
      }
      body.innerHTML = list.map(c => `
        <tr${c.ticked ? ' style="opacity:.75"' : ''}>
          <td><b>${esc(c.id)}</b></td>
          <td>${esc(c.customer || '—')}</td>
          <td>${esc(c.orderId || '—')}</td>
          <td>${esc(complaintDateTime(c))}</td>
          <td>${c.ticked ? '<span class="status-pill delivered"><i class="fa-solid fa-check"></i> DONE</span>' : '<span class="status-pill pending">OPEN</span>'}</td>
          <td><div class="table-actions" style="flex-wrap:wrap">
            <button class="mini-btn primary" data-view-comp="${esc(c.id)}"><i class="fa-solid fa-eye"></i> View</button>
            <button class="mini-btn primary" data-edit-comp="${esc(c.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="mini-btn ${c.ticked ? 'success' : ''}" data-tick-comp="${esc(c.id)}"><i class="fa-solid fa-check"></i> ${c.ticked ? 'Ticked' : 'Tick'}</button>
            <button class="mini-btn danger" data-del-comp="${esc(c.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div></td>
        </tr>`).join('');

      body.querySelectorAll('[data-view-comp]').forEach(b => b.addEventListener('click', () => viewComplaint(b.dataset.viewComp)));

      body.querySelectorAll('[data-edit-comp]').forEach(b => b.addEventListener('click', () => {
        const c = getComplaints().find(x => String(x.id) === String(b.dataset.editComp));
        if (!c) return;
        compEditing = c.id;
        document.getElementById('comp-editor-title').textContent = 'Edit Complaint — ' + c.id;
        document.getElementById('comp-admin-oid').value = c.orderId || '';
        document.getElementById('comp-admin-customer').value = c.customer || '';
        document.getElementById('comp-admin-desc').value = c.description || '';
        document.getElementById('comp-admin-file').value = c.file || '';
        document.getElementById('comp-editor').style.display = 'block';
        document.getElementById('comp-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));

      body.querySelectorAll('[data-tick-comp]').forEach(b => b.addEventListener('click', () => {
        const list = getComplaints();
        const c = list.find(x => String(x.id) === String(b.dataset.tickComp));
        if (!c) return;
        c.ticked = !c.ticked;
        saveComplaints(list);
        toast(c.ticked ? c.id + ' marked as done' : c.id + ' reopened', c.ticked ? 'success' : '');
        renderComplaints();
      }));

      body.querySelectorAll('[data-del-comp]').forEach(b => b.addEventListener('click', () => {
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sure?';
          clearTimeout(compDelTimer);
          compDelTimer = setTimeout(() => renderComplaints(), 2600);
          return;
        }
        const id = b.dataset.delComp;
        saveComplaints(getComplaints().filter(x => String(x.id) !== String(id)));
        toast(id + ' deleted', 'success');
        renderComplaints();
      }));
    }

    function openCompEditor() {
      compEditing = null;
      document.getElementById('comp-editor-title').textContent = 'Add Complaint';
      ['comp-admin-oid', 'comp-admin-customer', 'comp-admin-desc', 'comp-admin-file'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('comp-editor').style.display = 'block';
      document.getElementById('comp-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.getElementById('add-complaint').addEventListener('click', openCompEditor);
    document.getElementById('comp-cancel').addEventListener('click', () => document.getElementById('comp-editor').style.display = 'none');
    document.getElementById('comp-admin-form').addEventListener('submit', e => {
      e.preventDefault();
      const orderId = document.getElementById('comp-admin-oid').value.trim();
      const customer = document.getElementById('comp-admin-customer').value.trim();
      const description = document.getElementById('comp-admin-desc').value.trim();
      const file = document.getElementById('comp-admin-file').value.trim();
      if (!orderId) { toast('Enter the order ID', 'error'); return; }
      if (!customer) { toast('Enter customer details', 'error'); return; }
      if (!description) { toast('Enter a description', 'error'); return; }
      const list = getComplaints();
      if (compEditing) {
        const i = list.findIndex(x => String(x.id) === String(compEditing));
        if (i > -1) list[i] = { ...list[i], orderId, customer, description, file };
        saveComplaints(list);
        toast('Complaint updated', 'success');
      } else {
        let n = 1001;
        list.forEach(x => { const m = /^CMP-(\d+)$/.exec(String(x.id)); if (m) n = Math.max(n, +m[1] + 1); });
        list.unshift({ id: 'CMP-' + n, orderId, customer, description, file, fileType: '', ticked: false, at: new Date().toISOString() });
        saveComplaints(list);
        toast('Complaint added', 'success');
      }
      document.getElementById('comp-editor').style.display = 'none';
      renderComplaints();
    });

/* ---------- Reviews ---------- */
    function revDateTime(r) {
      const d = new Date(r.date || r.at);
      if (!isNaN(d)) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return '—';
    }
    let revEditing = null;
    let revDelTimer = null;
    let revAdminStars = 0;
    const revStarsBtns = [];
    [1, 2, 3, 4, 5].forEach(n => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.value = String(n);
      b.setAttribute('aria-label', n + ' stars');
      b.innerHTML = '<i class="fa-solid fa-star"></i>';
      b.addEventListener('click', () => { revAdminStars = n; revStarsBtns.forEach(x => x.classList.toggle('on', +x.dataset.value <= revAdminStars)); });
      revStarsBtns.push(b);
      document.getElementById('rev-stars').appendChild(b);
    });

    function renderReviewsAdmin() {
      const list = getReviews();
      const body = document.getElementById('reviews-body');
      if (!list.length) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:26px"><i class="fa-solid fa-circle-info" style="margin-right:6px"></i>No reviews yet — ones submitted from the Track Order page will appear here. Toggle the eye to feature them on the home page.</td></tr>`;
        return;
      }
      body.innerHTML = list.map((r, i) => `
        <tr${r.shown ? '' : ' style="opacity:.8"'}>
          <td>
            <div class="rev-customer">
              ${r.img
                ? `<img src="${esc(r.img)}" alt="${esc(r.name || '')}" onerror="this.style.display='none'">`
                : `<div class="rev-avatar">${esc((r.name || '?')[0])}</div>`}
              <div><b>${esc(r.name || '—')}</b><small>${esc(r.orderId ? 'Order ' + r.orderId : 'Manual')}</small></div>
            </div>
          </td>
          <td>
            <div class="stars-show">${'★'.repeat(Math.min(5, +r.stars || 0))}</div>
            <span class="rev-cell-text">${esc(String(r.text || '').slice(0, 80))}${String(r.text || '').length > 80 ? '…' : ''}</span>
          </td>
          <td>${esc(revDateTime(r))}</td>
          <td>${r.shown ? '<span class="status-pill delivered"><i class="fa-solid fa-eye"></i> LIVE</span>' : '<span class="status-pill pending"><i class="fa-solid fa-eye-slash"></i> HIDDEN</span>'}</td>
          <td><div class="table-actions" style="flex-wrap:wrap">
            <button class="mini-btn primary" data-eye-review="${i}" title="Show / hide on home page"><i class="fa-solid ${r.shown ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
            <button class="mini-btn primary" data-edit-review="${i}"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="mini-btn danger" data-del-review="${i}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div></td>
        </tr>`).join('');

      body.querySelectorAll('[data-eye-review]').forEach(b => b.addEventListener('click', () => {
        const list = getReviews();
        const r = list[+b.dataset.eyeReview];
        if (!r) return;
        if (!r.shown) {
          const shownCount = list.filter(x => x.shown).length;
          if (shownCount >= 3) { toast('Maximum 3 reviews can be shown on the home page — hide one first', 'error'); return; }
        }
        r.shown = !r.shown;
        saveReviews(list);
        toast(r.shown ? 'Review is now LIVE on the home page' : 'Review hidden from the home page', r.shown ? 'success' : '');
        renderReviewsAdmin();
      }));

      body.querySelectorAll('[data-edit-review]').forEach(b => b.addEventListener('click', () => {
        const r = getReviews()[+b.dataset.editReview];
        if (!r) return;
        revEditing = +b.dataset.editReview;
        document.getElementById('rev-editor-title').textContent = 'Edit Review';
        document.getElementById('rev-name').value = r.name || '';
        document.getElementById('rev-img').value = r.img || '';
        document.getElementById('rev-text').value = r.text || '';
        revAdminStars = Math.min(5, +r.stars || 0);
        revStarsBtns.forEach(x => x.classList.toggle('on', +x.dataset.value <= revAdminStars));
        document.getElementById('rev-editor').style.display = 'block';
        document.getElementById('rev-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));

      body.querySelectorAll('[data-del-review]').forEach(b => b.addEventListener('click', () => {
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sure?';
          clearTimeout(revDelTimer);
          revDelTimer = setTimeout(() => renderReviewsAdmin(), 2600);
          return;
        }
        const list = getReviews();
        list.splice(+b.dataset.delReview, 1);
        saveReviews(list);
        toast('Review deleted', 'success');
        renderReviewsAdmin();
      }));
    }

    function openRevEditor() {
      revEditing = null;
      document.getElementById('rev-editor-title').textContent = 'Add Review';
      ['rev-name', 'rev-img', 'rev-text'].forEach(id => document.getElementById(id).value = '');
      revAdminStars = 5;
      revStarsBtns.forEach(x => x.classList.toggle('on', +x.dataset.value <= revAdminStars));
      document.getElementById('rev-editor').style.display = 'block';
      document.getElementById('rev-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.getElementById('add-review').addEventListener('click', openRevEditor);
    document.getElementById('rev-cancel').addEventListener('click', () => document.getElementById('rev-editor').style.display = 'none');
    document.getElementById('rev-admin-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('rev-name').value.trim();
      const text = document.getElementById('rev-text').value.trim();
      if (!name) { toast('Enter a customer name', 'error'); return; }
      if (!text) { toast('Enter the review text', 'error'); return; }
      if (!revAdminStars) { toast('Pick a star rating', 'error'); return; }
      const img = document.getElementById('rev-img').value.trim();
      const list = getReviews();
      if (revEditing !== null && revEditing < list.length) {
        list[revEditing] = { ...list[revEditing], name, text, stars: revAdminStars, img };
        saveReviews(list);
        toast('Review updated', 'success');
      } else {
        list.unshift({ id: 'RV-' + Date.now(), name, text, stars: revAdminStars, img, shown: false, date: new Date().toISOString() });
        saveReviews(list);
        toast('Review added — toggle the eye to show it on the home page', 'success');
      }
      document.getElementById('rev-editor').style.display = 'none';
      renderReviewsAdmin();
    });

/* ---------- Accounts: sales & purchases ---------- */
    function accDateTime(d) {
      const dt = new Date(d);
      if (!isNaN(dt)) return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return '—';
    }
    function isToday(d) {
      const dt = new Date(d);
      return !isNaN(dt) && dt.toDateString() === new Date().toDateString();
    }

    function renderSales() {
      const list = getOrders().filter(o => o.status === 'delivered' || o.cleared);
      const total = list.reduce((s, o) => s + (+o.total || 0), 0);
      const today = list.filter(o => isToday(o.placedAt)).reduce((s, o) => s + (+o.total || 0), 0);
      document.getElementById('sales-count').textContent = list.length;
      document.getElementById('sales-total').textContent = PKR(total);
      document.getElementById('sales-today').textContent = PKR(today);
      document.getElementById('sales-body').innerHTML = list.length
        ? list.map(o => `
          <tr>
            <td><b>${esc(o.id)}</b></td>
            <td>${esc(o.customer || '—')}</td>
            <td><b style="color:var(--green)">${PKR(o.total)}</b></td>
            <td>${esc(accDateTime(o.placedAt))}${isToday(o.placedAt) ? ' <span class="status-pill delivered"><i class="fa-solid fa-bolt"></i> TODAY</span>' : ''}</td>
          </tr>`).join('')
        : `<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:26px">No sales yet — when an order is marked delivered its amount is added here.</td></tr>`;
    }

    const INITIAL_PURCHASES = [
      { id: 'PUR-1001', name: "Baker's flour (50 kg)", type: 'Ingredients', amount: 7500, description: 'Monthly flour stock from Mill Foods', file: '', fileType: '', at: new Date().toISOString() },
      { id: 'PUR-1002', name: 'Gift boxes & ribbons', type: 'Packaging', amount: 3200, description: 'Batch of 100 gift boxes', file: 'packing-invoice.pdf', fileType: 'application/pdf', at: new Date(Date.now() - 86400000).toISOString() }
    ];
    const getPurchases = () => {
      try { const p = JSON.parse(localStorage.getItem('od_purchases')); if (Array.isArray(p)) return p; } catch (e) {}
      localStorage.setItem('od_purchases', JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    };
    const savePurchases = p => localStorage.setItem('od_purchases', JSON.stringify(p));

    let purDelTimer = null;
    let purFile = null;
    const resetPurFileLabel = () => {
      purFile = null;
      document.getElementById('pur-file').value = '';
      document.getElementById('pur-file-label').textContent = 'Attach a file';
      document.getElementById('pur-file-name').style.display = 'none';
      document.getElementById('pur-file').closest('.comp-file').classList.remove('has-file');
    };
    document.getElementById('pur-file').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { toast('Keep the file under 20 MB', 'error'); e.target.value = ''; return; }
      purFile = f;
      document.getElementById('pur-file-label').textContent = 'Attached:';
      const nm = document.getElementById('pur-file-name');
      nm.textContent = f.name + ' (' + (f.size / 1024).toFixed(0) + ' KB)';
      nm.style.display = '';
      e.target.closest('.comp-file').classList.add('has-file');
    });

    function renderPurchases() {
      const list = getPurchases();
      const total = list.reduce((s, p) => s + (+p.amount || 0), 0);
      const today = list.filter(p => isToday(p.at || p.date)).reduce((s, p) => s + (+p.amount || 0), 0);
      document.getElementById('purchases-total').textContent = PKR(total);
      document.getElementById('purchases-today').textContent = PKR(today);
      const body = document.getElementById('purchases-body');
      if (!list.length) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:26px">No purchases yet — click "Add Purchase" to record one.</td></tr>`;
        return;
      }
      body.innerHTML = list.map((p, i) => `
        <tr>
          <td><b>${esc(p.name)}</b>${p.file ? ` <small style="color:var(--caramel-dark)"><i class="fa-solid fa-paperclip"></i> ${esc(p.file)}</small>` : ''}</td>
          <td><span class="status-pill pending">${esc(p.type)}</span></td>
          <td><b style="color:var(--red)">${PKR(p.amount)}</b></td>
          <td>${esc(accDateTime(p.at || p.date))}${isToday(p.at || p.date) ? ' <span class="status-pill delivered"><i class="fa-solid fa-bolt"></i> TODAY</span>' : ''}</td>
          <td><div class="table-actions">
            <button class="mini-btn danger" data-del-purchase="${i}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div></td>
        </tr>`).join('');
      body.querySelectorAll('[data-del-purchase]').forEach(b => b.addEventListener('click', () => {
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Sure?';
          clearTimeout(purDelTimer);
          purDelTimer = setTimeout(() => renderPurchases(), 2600);
          return;
        }
        const list = getPurchases();
        list.splice(+b.dataset.delPurchase, 1);
        savePurchases(list);
        toast('Purchase removed', 'success');
        renderPurchases();
      }));
    }

    document.getElementById('add-purchase').addEventListener('click', () => {
      ['pur-name', 'pur-amount', 'pur-desc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('pur-type').value = 'Ingredients';
      document.getElementById('pur-editor-title').textContent = 'Add Purchase';
      resetPurFileLabel();
      document.getElementById('pur-editor').style.display = 'block';
      document.getElementById('pur-editor').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('pur-cancel').addEventListener('click', () => document.getElementById('pur-editor').style.display = 'none');
    document.getElementById('pur-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('pur-name').value.trim();
      const type = document.getElementById('pur-type').value;
      const amount = Math.round(Math.max(0, +document.getElementById('pur-amount').value || 0));
      const desc = document.getElementById('pur-desc').value.trim();
      if (!name) { toast('Enter the item name', 'error'); return; }
      if (!type) { toast('Pick a purchase type', 'error'); return; }
      if (!amount) { toast('Enter the amount', 'error'); return; }
      const list = getPurchases();
      let n = 1001;
      list.forEach(x => { const m = /^PUR-(\d+)$/.exec(String(x.id)); if (m) n = Math.max(n, +m[1] + 1); });
      list.unshift({ id: 'PUR-' + n, name, type, amount, description: desc, file: purFile ? purFile.name : '', fileType: purFile ? purFile.type : '', at: new Date().toISOString() });
      savePurchases(list);
      toast('Purchase added — ' + PKR(amount), 'success');
      document.getElementById('pur-editor').style.display = 'none';
      renderPurchases();
    });

/* ---------- Admin profile ---------- */
    function renderProfile() {
      const u = requireAdmin();
      const me = u || { name: 'Fatima Tanveer', email: 'saman@ovendiaries.pk', role: 'admin' };
      document.getElementById('pf-name').textContent = me.name;
      document.getElementById('pf-avatar').textContent = (me.name || 'A')[0].toUpperCase();
      document.getElementById('pf-mail').textContent = me.email || '—';
      const role = document.getElementById('pf-role');
      role.innerHTML = `<i class="fa-solid ${me.role === 'admin' ? 'fa-crown' : 'fa-user-shield'}"></i> ${esc((me.role || 'admin').toUpperCase())}`;
      const orders = getOrders();
      const revenue = orders.filter(o => o.status === 'delivered' || o.cleared).reduce((s, o) => s + (+o.total || 0), 0);
      document.getElementById('pf-stat-revenue').textContent = PKR(revenue);
      document.getElementById('pf-stat-orders').textContent = orders.length;
      document.getElementById('pf-stat-products').textContent = ALL_PRODUCTS().length;
      document.getElementById('pf-stat-complaints').textContent = getComplaints().filter(c => !c.ticked).length;
      document.getElementById('pf-since').textContent = new Date().getFullYear();
      document.getElementById('pf-last').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    renderStats();