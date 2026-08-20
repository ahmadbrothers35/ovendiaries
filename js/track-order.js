    const $ = id => document.getElementById(id);

    function dateLabel(o) {
      try {
        const d = new Date(o.placedAt);
        if (!isNaN(d)) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {}
      return o.date || '—';
    }

    const STATUS_FLOW = [
      ['pending', 'Placed'],
      ['confirmed', 'Order Confirmed'],
      ['baked', 'Cooked (Baked)'],
      ['ready', 'Ready for Delivery'],
      ['out', 'Out for Delivery'],
      ['delivered', 'Delivered'],
    ];
    const STATUS_IDX = { pending: 1, confirmed: 2, baked: 3, ready: 4, out: 5, delivered: 6 };

    function statusOf(o) {
      const s = String((o && o.status) || 'pending').toLowerCase();
      if (o && (o.cleared || s === 'delivered' || s === 'cleared')) return 'delivered';
      if (s === 'canceled') return 'canceled';
      if (s === 'processing') return 'confirmed';
      if (STATUS_IDX[s]) return s;
      return 'pending';
    }

    const PILL = {
      pending: ['pending', 'fa-clock', 'PENDING'],
      confirmed: ['confirmed', 'fa-check-double', 'ORDER CONFIRMED'],
      baked: ['baked', 'fa-fire', 'COOKED (BAKED)'],
      ready: ['ready', 'fa-box-open', 'READY FOR DELIVERY'],
      out: ['out', 'fa-moped', 'OUT FOR DELIVERY'],
      delivered: ['delivered', 'fa-circle-check', 'DELIVERED'],
      canceled: ['danger', 'fa-ban', 'CANCELED'],
    };

    function trackOrder() {
      const q = $('track-input').value.trim();
      if (!q) { toast('Enter your order ID first', 'error'); return; }
      let orders = [];
      try { const raw = localStorage.getItem('od_orders'); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) orders = p; } } catch (e) {}
      const o = orders.find(x => String(x.id).toLowerCase() === q.toLowerCase());
      const resultBox = $('track-result');
      const rev = $('review-section');

      if (!o) {
        resultBox.style.display = 'none';
        rev.style.display = 'none';
        toast('No order found with ID "' + q + '" — double-check your receipt', 'error');
        return;
      }

      const st = statusOf(o);
      const done = st === 'delivered';
      const canceled = st === 'canceled';
      const stepIdx = STATUS_IDX[st] || (canceled ? 0 : 1);
      const [pillCls, pillIcon, pillLabel] = PILL[st] || PILL.pending;
      const step = (key, n, label) => `
        <div class="track-step ${n <= stepIdx ? 'done' : ''}${n === stepIdx && !done ? ' current' : ''}" title="${esc(label)}">
          <span class="dot"><i class="fa-solid ${n < stepIdx || done ? 'fa-check' : key === 'pending' ? 'fa-utensils' : key === 'confirmed' ? 'fa-check-double' : key === 'baked' ? 'fa-fire' : key === 'ready' ? 'fa-box-open' : key === 'out' ? 'fa-moped' : 'fa-truck-fast'}"></i></span>
          <small>${label}</small>
        </div>`;
      const lines = (Array.isArray(o.lines) && o.lines.length ? o.lines : [{ name: o.items || 'Order items', qty: 1, price: +o.total || 0 }])
        .map(l => `<div>${esc(l.name)}${l.opts ? ` <small style="color:var(--text-light)">(${esc(l.opts)})</small>` : ''}${l.qty > 1 ? ' ×' + l.qty : ''} — <b>${PKR(+l.price || 0)}</b></div>`).join('');

      resultBox.innerHTML = `
        <div class="track-card">
          <div class="track-top">
            <div>
              <h3>${esc(o.id)}</h3>
              <p style="margin:2px 0 0;color:var(--text-light);font-size:.9rem">Placed ${esc(dateLabel(o))} · ${esc(o.customer || 'Customer')}</p>
            </div>
            <span class="status-pill ${pillCls}">
              <i class="fa-solid ${pillIcon}"></i>
              ${pillLabel}
            </span>
          </div>
          <div class="track-steps">${STATUS_FLOW.map(([key, label], i) => step(key, i + 1, label)).join('')}</div>
          <div class="track-lines">${lines}</div>
          <div class="track-rows">
            <div class="track-row"><span>Total bill</span><b>${PKR(+o.total || 0)}</b></div>
            <div class="track-row"><span>Delivery address</span><b>${esc(o.address || 'Pickup from bakery')}</b></div>
            ${o.phone ? `<div class="track-row"><span>Phone</span><b>${esc(o.phone)}</b></div>` : ''}
          </div>
        </div>`;
      resultBox.style.display = 'block';
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (done) {
        $('review-order').textContent = o.id;
        rev.style.display = 'block';
        renderReviews();
        rev.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        rev.style.display = 'none';
      }
    }

    /* ---------- Reviews ---------- */
    let reviewStars = 0;
    const starBtns = [1, 2, 3, 4, 5].map(n => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.value = String(n);
      b.setAttribute('aria-label', n + ' stars');
      b.innerHTML = '<i class="fa-solid fa-star"></i>';
      b.addEventListener('click', () => {
        reviewStars = n;
        starBtns.forEach(x => x.classList.toggle('on', +x.dataset.value <= reviewStars));
      });
      return b;
    });
    $('star-pick').append(...starBtns);

    function renderReviews() {
      const list = getReviews();
      $('review-count').textContent = list.length;
      $('reviews-body').innerHTML = list.length
        ? list.map(r => `
          <div class="rev-item">
            <div class="rev-head">
              <div><b>${esc(r.name)}</b> <small>· ${esc(r.orderId || '')}</small></div>
              <div class="stars-show">${'★'.repeat(Math.min(5, +r.stars || 0))}</div>
            </div>
            ${r.text ? `<p class="rev-text">${esc(r.text)}</p>` : ''}
            <small style="color:var(--text-light)">${esc(dateLabel({ placedAt: r.date }))}</small>
          </div>`).join('')
        : `<p style="color:var(--text-light);font-style:italic;grid-column:1/-1">No reviews yet — be the first to review your order!</p>`;
    }

    $('review-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('rev-name').value.trim();
      if (!name) { toast('Please enter your name', 'error'); return; }
      if (!reviewStars) { toast('Please pick a star rating', 'error'); return; }
      addReview({ name, stars: reviewStars, text: $('rev-text').value.trim(), orderId: $('review-order').textContent, date: new Date().toISOString() });
      toast('Thank you! Your review helps other customers', 'success');
      $('rev-name').value = '';
      $('rev-text').value = '';
      reviewStars = 0;
      starBtns.forEach(x => x.classList.remove('on'));
      renderReviews();
    });

    $('track-btn').addEventListener('click', trackOrder);
    $('track-input').addEventListener('keydown', e => { if (e.key === 'Enter') trackOrder(); });

    const oidParam = new URLSearchParams(location.search).get('oid');
    if (oidParam) { $('track-input').value = oidParam; setTimeout(trackOrder, 300); }