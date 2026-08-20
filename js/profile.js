    const $ = id => document.getElementById(id);
    const me = requireUser();
    if (!me) throw new Error('redirect');
    if (me.role === 'admin') { location.href = 'admin.html'; throw new Error('redirect'); }

    let record = Auth.users().find(u => u.email.toLowerCase() === me.email.toLowerCase()) || me;

    /* ---------- Side card ---------- */
    $('up-avatar').textContent = (record.name || 'A')[0].toUpperCase();
    $('up-name').textContent = record.name;
    $('up-mail').textContent = record.email;
    const roleEl = $('up-role');
    roleEl.classList.toggle('pending', record.role === 'admin');
    roleEl.innerHTML = `<i class="fa-solid ${record.role === 'admin' ? 'fa-crown' : 'fa-user-check'}"></i> ${record.role === 'admin' ? 'ADMIN' : 'CUSTOMER'}`;
    $('up-since').textContent = new Date().getFullYear();
    $('up-logout').addEventListener('click', () => { Auth.logout(); toast('Logged out — see you soon!', ''); setTimeout(() => location.href = 'login.html', 450); });

    /* ---------- Personal details ---------- */
    function renderPersonal() {
      record = Auth.users().find(u => u.email.toLowerCase() === (record.email || me.email).toLowerCase()) || record;
      $('pd-name').textContent = record.name;
      $('pd-mail').textContent = record.email;
      $('pd-phone').textContent = record.phone || '—';
    }
    $('pd-edit').addEventListener('click', () => {
      $('pd-name-input').value = record.name;
      $('pd-mail-input').value = record.email;
      $('pd-phone-input').value = record.phone || '';
      $('pd-pass-input').value = '';
      $('pd-form').style.display = 'grid';
      $('pd-view').style.display = 'none';
      $('pd-edit').style.display = 'none';
      $('pd-cancel').style.display = '';
      $('pd-note').style.display = 'none';
    });
    $('pd-cancel').addEventListener('click', () => {
      $('pd-form').style.display = 'none';
      $('pd-view').style.display = 'grid';
      $('pd-edit').style.display = '';
      $('pd-cancel').style.display = 'none';
    });
    $('pd-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('pd-name-input').value.trim();
      const email = $('pd-mail-input').value.trim().toLowerCase();
      const phone = $('pd-phone-input').value.trim();
      const pass = $('pd-pass-input').value;
      if (!name) { toast('Enter your name', 'error'); return; }
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Enter a valid email address', 'error'); return; }
      if (!pass) { toast('Enter your password', 'error'); return; }
      const users = Auth.users();
      const u = users.find(x => x.email.toLowerCase() === String(record.email || me.email).toLowerCase());
      if (!u) { toast('Account not found — refresh the page', 'error'); return; }
      if (users.some(x => x.email.toLowerCase() === email && x.email.toLowerCase() !== u.email.toLowerCase())) { toast('Another account already uses this email', 'error'); return; }
      u.name = name;
      u.email = email;
      u.phone = phone;
      u.pass = pass;
      Auth.saveUsers(users);
      record = u;
      localStorage.setItem('od_current', JSON.stringify({ name, email, role: u.role }));
      $('up-name').textContent = name;
      $('up-mail').textContent = email;
      $('up-avatar').textContent = name[0].toUpperCase();
      renderPersonal();
      $('pd-form').style.display = 'none';
      $('pd-view').style.display = 'grid';
      $('pd-edit').style.display = '';
      $('pd-cancel').style.display = 'none';
      $('pd-note').style.display = '';
      toast('Personal details updated', 'success');
    });

    /* ---------- Address ---------- */
    const fillAddress = () => {
      renderCityOptions($('addr-city'), record.city);
      renderAreaOptions($('addr-city').value, $('addr-area'), record.area);
      $('addr-street').value = record.addr || '';
    };
    $('addr-city').addEventListener('change', () => {
      renderAreaOptions($('addr-city').value, $('addr-area'), null);
    });
    fillAddress();
    $('addr-form').addEventListener('submit', e => {
      e.preventDefault();
      const street = $('addr-street').value.trim();
      const city = $('addr-city').value;
      if (!street) { toast('Enter your street address', 'error'); return; }
      const users = Auth.users();
      const u = users.find(x => x.email.toLowerCase() === String(record.email || me.email).toLowerCase());
      if (!u) return;
      u.addr = street;
      u.city = city;
      u.area = $('addr-area').value;
      Auth.saveUsers(users);
      record = u;
      $('addr-note').style.display = '';
      toast('Address saved — we will deliver to ' + cityName(city) + ' on your next order', 'success');
    });

    /* ---------- Orders ---------- */
    function myOrders() {
      let list = [];
      try { const raw = localStorage.getItem('od_orders'); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) list = p; } } catch (err) {}
      const nameL = String(record.name || '').toLowerCase();
      const mailL = String(record.email || '').toLowerCase();
      return list.filter(o => (String(o.customer || '').toLowerCase() === nameL) || (String(o.email || '').toLowerCase() === mailL));
    }
    const ordState = o => o.status === 'canceled' ? 'canceled' : (o.cleared || o.status === 'delivered' || o.status === 'cleared') ? 'complete' : 'pending';
    function dateLabel(o) {
      const d = new Date(o.placedAt);
      return isNaN(d) ? (o.date || '—') : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    let ordTab = 'complete';
    function renderOrders() {
      const all = myOrders();
      const buckets = { complete: [], pending: [], canceled: [] };
      all.forEach(o => buckets[ordState(o)].push(o));
      ['complete', 'pending', 'canceled'].forEach(k => $('cnt-' + k).textContent = buckets[k].length);
      document.querySelectorAll('.ord-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === ordTab));
      const group = buckets[ordTab];
      const empty = { complete: 'No completed orders yet — delivered orders will show up here.', pending: 'No pending orders — start your next order in the bakery!', canceled: 'No canceled orders.' }[ordTab];
      $('orders-list').innerHTML = group.length ? group.map(o => `
        <div class="ord-item">
          <div class="ord-top">
            <div>
              <b>${esc(o.id)}</b>
              <small>${esc(dateLabel(o))}</small>
            </div>
            <span class="status-pill ${ordTab === 'complete' ? 'delivered' : ordTab === 'canceled' ? 'danger' : 'pending'}">
              <i class="fa-solid ${ordTab === 'complete' ? 'fa-circle-check' : ordTab === 'canceled' ? 'fa-ban' : 'fa-clock'}"></i>
              ${ordTab === 'complete' ? 'COMPLETE' : ordTab === 'canceled' ? 'CANCELED' : 'PENDING'}
            </span>
          </div>
          <p class="ord-items">${esc(String(o.items || (Array.isArray(o.lines) ? o.lines.map(l => l.name + (l.qty > 1 ? ' x' + l.qty : '')).join(', ') : 'Order items')))}</p>
          <div class="ord-foot">
            <b>${PKR(+o.total || 0)}</b>
            <div>
              ${ordTab === 'complete' ? `<a class="mini-btn primary" href="track-order.html?oid=${encodeURIComponent(o.id)}" title="Rate this order"><i class="fa-solid fa-star"></i> Review</a>` : ''}
              <a class="mini-btn primary" href="track-order.html?oid=${encodeURIComponent(o.id)}"><i class="fa-solid fa-truck-fast"></i> Track</a>
            </div>
          </div>
        </div>`).join('')
      : `<p class="ord-empty"><i class="fa-solid fa-box-open"></i><br>${empty}</p>`;
    }
    document.querySelectorAll('.ord-tab').forEach(b => b.addEventListener('click', () => { ordTab = b.dataset.tab; renderOrders(); }));

    renderPersonal();
    renderOrders();