    const BASE_PRICE = 2450;
    const $ = id => document.getElementById(id);

    const state = (() => {
      const fl = CC_FLAVOURS(), bs = CC_BASES(), sz = CC_SIZES(), ex = CC_EXTRAS(), cd = CC_CANDLES();
      return {
        flavor: fl.length ? fl[0].id : '',
        base: bs.length ? bs[0].id : '',
        size: sz.length ? sz[0].id : '',
        extra: ex.length ? ex[0].id : '',
        candle: cd.length ? (cd[1] || cd[0]).id : '',
        name: '', date: '', notes: '',
      };
    })();

    let ccAreaId = null;
    let ccFile = null;

    document.getElementById('cc-file-input').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { toast('File is too large — max 20 MB', 'error'); e.target.value = ''; return; }
      ccFile = f;
      document.getElementById('cc-file-label').textContent = 'Attached:';
      const nameEl = document.getElementById('cc-file-name');
      nameEl.textContent = f.name + ' (' + (f.size / 1024).toFixed(0) + ' KB)';
      nameEl.style.display = '';
      document.getElementById('cc-file-btn').classList.add('has-file');
    });

    function setupAddressFields(selectedCity, selectedArea) {
      const citySel = $('cc-city');
      const areaSel = $('cc-area');
      const s = getDeliverySettings();
      renderCityOptions(citySel, selectedCity || s.city || CITIES[0].id);
      ccAreaId = selectedArea || null;
      renderAreaOptions(citySel.value, areaSel, ccAreaId);
    }
    $('cc-city').addEventListener('change', () => {
      ccAreaId = null;
      renderAreaOptions($('cc-city').value, $('cc-area'), null);
    });

    function prefillSavedAddress() {
      const u = Auth.current();
      if (!u) return;
      const rec = (Auth.users() || []).find(x => x.email.toLowerCase() === u.email.toLowerCase());
      if (!rec) return;
      if (rec.name) $('cust-name').value = rec.name;
      if (rec.phone) $('cust-phone').value = rec.phone;
      if (rec.email) $('cust-email').value = rec.email;
      if (rec.addr) $('cc-addr').value = rec.addr;
      setupAddressFields(rec.city || null, rec.area || null);
    }
    prefillSavedAddress();

    const priceTag = p => (+p) ? '+ ' + PKR(p) : 'Free';
    const priceTagPlus = p => '+ ' + PKR(p || 0);

    function buildOptions() {
      const flavours = CC_FLAVOURS();
      const bases = CC_BASES();
      const sizes = CC_SIZES();
      const extras = CC_EXTRAS();
      const candles = CC_CANDLES();

      $('flavor-options').innerHTML = flavours.length ? flavours.map(f => {
        const c = f.colors || flavourColors(f.name);
        return `
        <div class="option ${state.flavor === f.id ? 'selected' : ''}" data-val="${f.id}" role="flavor">
          <span class="swatch" style="background:linear-gradient(135deg,${c[0]},${c[1]})"></span>
          <small>${f.name}</small>
          <span class="p">${priceTag(f.price)}</span>
        </div>`;
      }).join('') : '<p class="cc-empty">No flavours available yet — please check back soon.</p>';

      $('base-options').innerHTML = bases.length ? bases.map(b => {
        const c = b.colors || ['#fff7e6', '#f3dcc0'];
        return `
        <div class="option ${state.base === b.id ? 'selected' : ''}" data-val="${b.id}" role="base">
          <span class="swatch-mini" style="background:linear-gradient(135deg,${c[0]},${c[1]})"></span>
          <small>${b.name}</small>
          <span class="p">${priceTagPlus(b.price)}</span>
        </div>`;
      }).join('') : '<p class="cc-empty">No cake types available yet — please check back soon.</p>';

      $('size-options').innerHTML = sizes.length ? sizes.map(s => `
        <div class="option ${state.size === s.id ? 'selected' : ''}" data-val="${s.id}" role="size">
          <i class="fa-solid fa-ruler-combined icon"></i><small>${s.name}</small>
          <span class="p">${s.note ? s.note + ' • ' : ''}${+s.price ? priceTagPlus(s.price) : 'Base price'}</span>
        </div>`).join('') : '<p class="cc-empty">No sizes available yet — please check back soon.</p>';

      $('message-options').innerHTML = extras.length ? extras.map(x => `
        <div class="option ${state.extra === x.id ? 'selected' : ''}" data-val="${x.id}" role="extra">
          <i class="fa-solid ${x.icon || 'fa-pen'} icon"></i><small>${x.name}</small>
          <span class="p">${priceTag(x.price)}</span>
        </div>`).join('') : '<p class="cc-empty">No finishing options available yet.</p>';

      $('candle-options').innerHTML = candles.length ? candles.map(c => `
        <div class="option ${state.candle === c.id ? 'selected' : ''}" data-val="${c.id}" role="candle">
          <i class="fa-solid ${c.icon || 'fa-fire'} icon"></i><small>${c.name}</small>
          <span class="p">${priceTag(c.price)}</span>
        </div>`).join('') : '<p class="cc-empty">No candles available yet.</p>';

      ['flavor-options', 'base-options', 'size-options', 'message-options', 'candle-options'].forEach(id => {
        $(id).querySelectorAll('.option').forEach(o => o.addEventListener('click', () => {
          const group = o.closest('#flavor-options') ? 'flavor' : o.closest('#base-options') ? 'base' : o.closest('#size-options') ? 'size' : o.closest('#message-options') ? 'extra' : 'candle';
          state[group] = o.dataset.val;
          o.parentElement.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
          o.classList.add('selected');
          refresh();
        }));
      });
    }

    function refresh() {
      const flavour = CC_FLAVOURS().find(f => f.id === state.flavor);
      const base = CC_BASES().find(b => b.id === state.base);
      const size = CC_SIZES().find(s => s.id === state.size);
      const extra = CC_EXTRAS().find(x => x.id === state.extra);
      const candle = CC_CANDLES().find(c => c.id === state.candle);
      const fCol = (flavour && (flavour.colors || flavourColors(flavour.name))) || ['#ffe9d6', '#f7cfa4'];

      const g = `linear-gradient(180deg, ${fCol[1]}, ${fCol[0]})`;
      $('layer1').style.background = g;
      $('layer2').style.background = g;
      $('layer3').style.background = g;

      const rel = 1 + Math.min(0.45, ((size && +size.price) || 0) / BASE_PRICE * 0.3);
      $('layer3').style.width = (92 * rel) + 'px';
      $('layer2').style.width = (120 * rel) + 'px';
      $('layer1').style.width = (150 * rel) + 'px';
      $('frost-1').style.width = (162 * rel) + 'px';
      $('frost-2').style.width = (132 * rel) + 'px';
      $('frost-3').style.width = (104 * rel) + 'px';

      const name = $('cake-name').value.trim();
      const showCherry = base && base.id !== 'fondant' && base.id !== 'photo';
      $('cake-cherry').style.display = showCherry ? 'block' : 'none';

      const showCandle = !!candle && candle.id !== 'none';
      $('cake-candle').style.display = showCandle ? 'block' : 'none';
      $('cake-candle').innerHTML = showCandle ? `<i class="fa-solid ${candle.icon || 'fa-fire'}"></i>` : '';

      $('cake-message').textContent = name || (base && base.id === 'photo' ? 'Photo Cake — your memories on top!' : `${flavour ? flavour.name : 'Custom'} ${base ? base.name : 'Cake'}`);

      const total = BASE_PRICE
        + ((flavour && +flavour.price) || 0)
        + ((base && +base.price) || 0)
        + ((size && +size.price) || 0)
        + ((extra && +extra.price) || 0)
        + ((candle && +candle.price) || 0);

      $('sum-base').textContent = PKR(BASE_PRICE);
      $('sum-flavour').textContent = priceTag(flavour && flavour.price);
      $('sum-add').textContent = priceTagPlus(base && base.price);
      $('sum-size').textContent = size && +size.price ? priceTagPlus(size.price) : 'Free';
      $('sum-extra').textContent = priceTagPlus(extra && extra.price);
      $('sum-candle').textContent = candle && +candle.price ? priceTagPlus(candle.price) : 'Free';
      $('sum-total').textContent = PKR(total);
      return total;
    }

    document.getElementById('add-custom').addEventListener('click', () => {
      const flavour = CC_FLAVOURS().find(f => f.id === state.flavor);
      const base = CC_BASES().find(b => b.id === state.base);
      const size = CC_SIZES().find(s => s.id === state.size);
      const extra = CC_EXTRAS().find(x => x.id === state.extra);
      const candle = CC_CANDLES().find(c => c.id === state.candle);
      if (!flavour || !base || !size) { toast('Please choose a flavour, cake type and size', 'error'); return; }
      const custName = $('cust-name').value.trim();
      if (!custName) { toast('Please enter your name to place the order', 'error'); return; }
      const phone = $('cust-phone').value.trim() || 'Not provided';
      const email = $('cust-email').value.trim() || 'Not provided';
      const cityId = $('cc-city').value;
      const areaName = ($('cc-area').selectedOptions[0] || {}).textContent || '';
      const address = $('cc-addr').value.trim() || 'Pickup from bakery';
      const printName = $('cake-name').value.trim();
      const notes = $('cake-notes').value.trim();
      const total = refresh();

      const desc = [`Custom ${base.name} cake`, `${flavour.name} flavour`, size.name];
      if (extra && +extra.price) desc.push(extra.name);
      if (candle && +candle.price) desc.push(candle.name);
      const items = desc.join(' • ');
      const opts = items + (printName ? ` — "${printName}"` : '') + (notes ? ` • Note: ${notes}` : '');

      let orders = [];
      try { const raw = localStorage.getItem('od_orders'); if (raw) orders = JSON.parse(raw); if (!Array.isArray(orders)) orders = []; } catch (e) { orders = []; }
      let idNum = 1847;
      const nums = orders.map(o => parseInt(String((o && o.id) || '').replace(/\D+/g, ''), 10)).filter(n => !isNaN(n));
      if (nums.length) idNum = Math.max(...nums) + 1;
      orders.unshift({
        id: 'OD-' + idNum,
        customer: custName,
        email, phone, address,
        lines: [{ name: `Custom ${base.name} • ${size.name}`, qty: 1, price: total, opts }],
        items,
        delivery: 0, discount: 0,
        deliveryCity: cityName(cityId),
        deliveryArea: areaName,
        total, status: 'pending', payment: 'cod',
        placedAt: new Date().toISOString(),
        date: $('cake-date').value || new Date().toISOString().slice(0, 10),
        notes,
        attachment: ccFile ? ccFile.name : '',
        attachmentType: ccFile ? ccFile.type : '',
        source: 'custom',
      });
      localStorage.setItem('od_orders', JSON.stringify(orders));

      $('order-success-id').textContent = 'Order #' + orders[0].id;
      document.querySelector('.cake-builder').style.display = 'none';
      const s = $('order-success');
      s.style.display = 'block';
      s.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('Order placed! Our team will contact you shortly', 'success');
    });

    document.getElementById('new-cake-btn').addEventListener('click', () => {
      $('order-success').style.display = 'none';
      document.querySelector('.cake-builder').style.display = '';
      ['cust-name', 'cust-phone', 'cust-email', 'cc-addr', 'cake-name', 'cake-date', 'cake-notes'].forEach(id => { const el = $(id); if (el) el.value = ''; });
      const fileInput = $('cc-file-input');
      if (fileInput) fileInput.value = '';
      ccFile = null;
      $('cc-file-label').textContent = 'Attach photo or video';
      $('cc-file-name').style.display = 'none';
      $('cc-file-name').textContent = '';
      $('cc-file-btn').classList.remove('has-file');
      prefillSavedAddress();
      buildOptions();
      refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    ['cake-name', 'cake-date', 'cake-notes'].forEach(id => $(id).addEventListener('input', () => {
      state.name = $('cake-name').value;
      state.date = $('cake-date').value;
      state.notes = $('cake-notes').value;
      refresh();
    }));

    buildOptions();
    refresh();
    if (SHOP_CLOSED()) $('add-custom').style.display = 'none';
    if (!$('cc-city').options.length) setupAddressFields();