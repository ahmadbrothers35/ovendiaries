    const itemsEl = document.getElementById('cart-items');
    const emptyEl = document.getElementById('empty-cart');
    let appliedCoupon = null;
    let deliveryArea = null;
    let savedAreaId = null;

    (function prefillSavedAddress() {
      const u = Auth.current();
      if (!u) return;
      const rec = (Auth.users() || []).find(x => x.email.toLowerCase() === u.email.toLowerCase());
      if (!rec) return;
      document.getElementById('addr').value = rec.addr || '';
      const phoneEl = document.getElementById('phone');
      if (phoneEl) phoneEl.value = rec.phone || '';
      const s = getDeliverySettings();
      const citySel = document.getElementById('checkout-city');
      const areaSel = document.getElementById('area-sel');
      renderCityOptions(citySel, rec.city || s.city || CITIES[0].id);
      savedAreaId = rec.area || null;
      renderAreaOptions(citySel.value, areaSel, savedAreaId);
    })();

    (function renderSummaryContact() {
      const u = Auth.current();
      if (!u) return;
      const rec = (Auth.users() || []).find(x => x.email.toLowerCase() === u.email.toLowerCase());
      if (!rec) return;
      const who = [rec.name || '', rec.phone || ''].filter(Boolean).join(' • ');
      const whereBits = [];
      if (rec.city) whereBits.push(cityName(rec.city));
      if (rec.city && rec.area) {
        const hit = deliveryAreasFor(rec.city).find(a => a.id === rec.area);
        if (hit) whereBits.push(hit.name);
      }
      if (rec.addr) whereBits.push(rec.addr);
      const where = whereBits.join(' — ');
      if (!who && !where) return;
      const el = document.getElementById('summary-contact');
      if (who) document.getElementById('summary-who').textContent = who;
      if (where) document.getElementById('summary-where').textContent = where;
      el.style.display = 'block';
    })();

    function activeOffer() {
      const o = getActiveOffer();
      return (o && o.id && +o.percent > 0) ? o : null;
    }

    function buildAreaSelect() {
      const citySel = document.getElementById('checkout-city');
      const cityLabel = document.getElementById('checkout-city-label');
      const labelEl = document.getElementById('area-label');
      const sel = document.getElementById('area-sel');
      const s = getDeliverySettings();
      const paid = (s.mode || 'free') === 'paid';
      cityLabel.hidden = !paid;
      labelEl.hidden = !paid;
      if (!paid) { deliveryArea = null; return 0; }
      renderCityOptions(citySel, citySel.value || s.city || CITIES[0].id);
      const cityId = citySel.value;
      const areas = renderAreaOptions(cityId, sel, savedAreaId);
      labelEl.querySelector('span').textContent = 'Delivery area — ' + cityName(cityId);
      deliveryArea = areas.find(a => a.id === sel.value) || areas[0] || null;
      return deliveryArea ? (+deliveryArea.price || 0) : 0;
    }

    document.getElementById('checkout-city').addEventListener('change', () => {
      savedAreaId = null;
      render();
    });

    const itemHTML = (line, i) => {
      if (line.isCustom) {
        return `
        <div class="cart-item" data-li="${i}" style="animation-delay:${i * 0.07}s">
          <div class="cart-thumb" style="background:linear-gradient(135deg,#ffe3ec,#ffd0de)"><img src="${CUSTOM_CAKE_IMG}" alt="Custom cake" loading="lazy" onerror="this.style.display='none'"></div>
          <div class="info">
            <span class="p-cat">Custom Cake</span>
            <h3>${esc(line.name)}</h3>
            <p style="font-size:.84rem;color:var(--text-light)">${esc(line.detail)}</p>
            <div class="qty">
              <button data-minus>−</button><b>${line.qty}</b><button data-plus>+</button>
            </div>
          </div>
          <div class="actions" style="text-align:right">
            <div class="price" style="color:var(--caramel-dark)">${PKR(line.price * line.qty)}</div>
            <button class="remove-btn" data-remove title="Remove from cart"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>`;
      }
const p = findProduct(line.productId);
      if (!p) return '';
      const opts = [];
      if (line.opts && line.opts.sizeId) opts.push('Size: ' + (pSizeLabel(p, line.opts.sizeId) || line.opts.sizeId));
      if (line.opts && line.opts.flavourId) opts.push('Flavour: ' + (pFlavourLabel(p, line.opts.flavourId) || line.opts.flavourId));
      const linePrice = Cart.lineTotal(line);
      return `
      <div class="cart-item" data-li="${i}" style="animation-delay:${i * 0.07}s">
        <div class="cart-thumb" style="background:${p.bg}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'"></div>
        <div class="info">
          <span class="p-cat">${esc(categoryLabel(p.cat))}</span>
          <h3>${esc(p.name)}</h3>
          ${opts.length ? `<p style="font-size:.8rem;color:var(--caramel-dark);font-weight:600;margin-bottom:6px">${opts.join(' • ')}</p>` : ''}
          <div class="price">${PKR(linePrice)}</div>
          <div class="qty">
            <button data-minus>−</button><b>${line.qty}</b><button data-plus>+</button>
          </div>
        </div>
<div class="actions" style="text-align:right">
            <div class="price" style="color:var(--caramel-dark)">${PKR(linePrice)}</div>
            <button class="remove-btn" data-remove title="Remove from cart"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>`;
    };

    function render() {
      const cart = Cart.get();
      const has = cart.length > 0;
      itemsEl.innerHTML = cart.map(itemHTML).join('');
      itemsEl.style.display = has ? 'grid' : 'none';
      emptyEl.style.display = has ? 'none' : 'block';
      document.getElementById('cart-layout').classList.toggle('cart-empty', !has);
      document.querySelector('#cart-layout .section-head').style.display = has ? '' : 'none';
      const right = document.querySelector('.cart-right');
      right.style.display = has ? '' : 'none';
      right.classList.add('visible');

      const sub = Cart.subtotal();
      const offer = activeOffer();
      const areaPrice = buildAreaSelect();
      const delivery = (getDeliverySettings().mode === 'paid') ? areaPrice : 0;
      let discount = 0;
      let offerDiscount = 0;
      if (offer) {
        let d = sub * (+offer.percent / 100);
        offerDiscount = Math.round(d / 10) * 10;
        discount += offerDiscount;
      }
      if (appliedCoupon) {
        const d = sub * (appliedCoupon.percent / 100);
        discount += Math.round(d / 10) * 10;
      }
      const total = Math.max(0, sub + delivery - discount);

      document.getElementById('sum-sub').textContent = PKR(sub);
      document.getElementById('sum-delivery').textContent = delivery ? PKR(delivery) : 'FREE';
      document.getElementById('offer-row').style.display = offer ? 'flex' : 'none';
      document.getElementById('offer-name').textContent = offer ? offer.title : '—';
      document.getElementById('sum-offer').textContent = '− ' + PKR(offerDiscount);
      document.getElementById('coupon-row').style.display = appliedCoupon ? 'flex' : 'none';
      document.getElementById('sum-discount').textContent = '− ' + PKR(appliedCoupon ? discount - offerDiscount : 0);
      document.getElementById('sum-total').textContent = PKR(total);
      document.getElementById('coupon-name').textContent = appliedCoupon ? appliedCoupon.code : '—';

      bind();
      document.querySelectorAll('.cart-item').forEach((el, i) => {
        el.style.animation = `none`; void el.offsetWidth;
        el.style.animation = `popIn .45s ${i * .07}s both`;
      });
    }

    function bind() {
      document.querySelectorAll('[data-plus], [data-minus]').forEach(b => b.addEventListener('click', () => {
        const liEl = b.closest('.cart-item');
        const idx = +liEl.dataset.li;
        const qty = +liEl.querySelector('.qty b').textContent;
        Cart.setQtyByIdx(idx, b.dataset.plus ? qty + 1 : qty - 1);
        render();
      }));
      document.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
        Cart.removeByIdx(+b.closest('.cart-item').dataset.li);
        toast('Item removed from cart', '');
        render();
      }));
      document.getElementById('area-sel').addEventListener('change', () => { deliveryArea = null; render(); });
    }

    document.getElementById('coupon-btn').addEventListener('click', () => {
      const code = document.getElementById('coupon-input').value.trim().toUpperCase();
      if (!code) return;
      if (COUPONS[code] !== undefined) {
        appliedCoupon = { code, percent: COUPONS[code] };
        toast(`Coupon ${code} applied — ${COUPONS[code]}% off!`, 'success');
      } else {
        appliedCoupon = null;
        toast('Sorry, that coupon is not valid', 'error');
      }
      render();
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
      const cart = Cart.get();
      if (!cart.length) { toast('Your cart is empty!', 'error'); return; }
      const u = requireUser();
      if (!u) return;
      const addr = document.getElementById('addr').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const sub = Cart.subtotal();
      const offer = activeOffer();
      const paid = getDeliverySettings().mode === 'paid';
      const areaPrice = buildAreaSelect();
      const delivery = paid ? areaPrice : 0;
      let discount = 0;
      if (offer) discount += Math.round(sub * (+offer.percent / 100) / 10) * 10;
      if (appliedCoupon) discount += Math.round(sub * (appliedCoupon.percent / 100) / 10) * 10;
      const total = Math.max(0, sub + delivery - discount);
      const orders = JSON.parse(localStorage.getItem('od_orders') || '[]');
      const lines = cart.map(l => {
        if (l.isCustom) return { name: l.name || 'Custom Cake', qty: l.qty, price: l.price, opts: l.detail || 'Custom cake', isCustom: true };
        const p = findProduct(l.productId);
        const opts = [];
        if (l.opts && l.opts.sizeId) opts.push('Size: ' + (pSizeLabel(p, l.opts.sizeId) || l.opts.sizeId));
        if (l.opts && l.opts.flavourId) opts.push('Flavour: ' + (pFlavourLabel(p, l.opts.flavourId) || l.opts.flavourId));
        return { name: p ? p.name : (l.name || 'Item'), qty: l.qty, price: Math.round(Cart.lineTotal(l) / l.qty), opts: opts.join(' • ') };
      });
      orders.unshift({
        id: 'OD-' + (1847 + orders.length),
        customer: u.name,
        email: u.email,
        phone: phone || '—',
        address: addr || 'Walk-in pickup',
        lines,
        items: lines.map(l => (l.qty > 1 ? l.name + ' x' + l.qty : l.name)).join(', '),
        delivery, discount,
        offerTitle: offer ? offer.title : '',
        deliveryArea: deliveryArea ? deliveryArea.name : '',
        deliveryCity: deliveryArea ? cityName(document.getElementById('checkout-city').value || (getDeliverySettings().city || CITIES[0].id)) : '',
        total, status: 'pending', payment: 'cod',
        placedAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      });
      localStorage.setItem('od_orders', JSON.stringify(orders));
      Cart.clear();
      document.getElementById('cart-layout').style.display = 'none';
      document.getElementById('success-oid').textContent = 'Order #' + orders[0].id;
      document.getElementById('order-success').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast('Order placed! Our team will contact you for payment', 'success');
    });

    render();