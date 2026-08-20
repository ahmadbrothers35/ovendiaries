    /* Hero image slider — auto-advancing, with blurred hero background synced to active slide */
    (() => {
      const slider = document.querySelector('.hero-slider');
      if (!slider) return;
      const slides = [...slider.querySelectorAll('.hero-slide')];
      const bg = document.getElementById('hero-bg');
      const syncBg = i => {
        if (!bg) return;
        const img = slides[i] && slides[i].querySelector('img');
        const src = img && img.getAttribute('src');
        if (src && bg.getAttribute('data-src') !== src) {
          bg.style.backgroundImage = `url("${src}")`;
          bg.setAttribute('data-src', src);
        }
      };
      const KEY = 'od_hero_cur';
      const save = i => localStorage.setItem(KEY, JSON.stringify({ i, t: Date.now() }));
      let cur = 0;
      try {
        const s = JSON.parse(localStorage.getItem(KEY));
        if (s && typeof s.i === 'number') cur = ((s.i % slides.length) + slides.length) % slides.length;
      } catch (e) {}
      let timer = null;
      const go = i => {
        cur = (i + slides.length) % slides.length;
        slides.forEach((s, j) => s.classList.toggle('active', j === cur));
        syncBg(cur);
        save(cur);
      };
      const play = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 3500); };
      go(cur);
      slider.addEventListener('mouseenter', () => clearInterval(timer));
      slider.addEventListener('mouseleave', play);
      play();
    })();

    /* Category cards — real images (dynamic categories incl. admin-added) */
    const catNames = { cakes: ['Classic Cream Cake', 'Chocolate Fudge', 'Red Velvet'], pastries: ['Donuts', 'Eclairs', 'Cinnamon Rolls'], breads: ['Croissants', 'Sourdough', 'Garlic Sticks'], fastfood: ['Zinger', 'Pizza', 'Shawarma'], drinks: ['Milk Shakes', 'Lassi', 'Lemonades'] };
    const catVisuals = {
      cakes: IMG('1558636508-e0db3814bd1d'),
      pastries: IMG('1551024506-0bccd828d307'),
      breads: IMG('1509440159596-0249088772ff'),
      fastfood: IMG('1568901346375-23c9450c58cd'),
      drinks: IMG('1541746972996-4e0b0f43e02a'),
    };
    document.getElementById('cats-grid').innerHTML = ALL_CATEGORIES().map((c, i) => `
      <div class="cat-card reveal-zoom ${i % 2 ? 'delay-2' : 'delay-1'}" onclick="location.href='bakery.html?cat=${c.id}'">
        <div class="img-wrap" style="background:linear-gradient(135deg,#ffe9d6,#f7cfa4)">
          ${catVisuals[c.id] ? `<img src="${catVisuals[c.id]}" alt="${esc(c.label)}" loading="lazy" onerror="this.style.display='none'">` : `<i class="fa-solid fa-cake-candles" style="font-size:2.4rem;color:var(--primary)"></i>`}
        </div>
        <div class="body">
          <h3>${esc(c.label)}</h3>
          <p>${catNames[c.id] ? catNames[c.id].join(' • ') : 'Freshly baked, made to order'}</p>
          <span class="link">Explore ${esc(c.label)} <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>`);

    /* Offers — admin-managed percentage deals + free delivery card */
    (() => {
      const list = getOfferList().filter(o => o && o.title && +o.percent > 0);
      const freeDelivery = (getDeliverySettings().mode || 'free') === 'free';
      if (!list.length && !freeDelivery) { document.getElementById('offers-sec').style.display = 'none'; return; }
      const active = getActiveOffer();
      const cards = [];
      if (freeDelivery) {
        cards.push(`
        <div class="offer-card offer-free reveal-zoom" style="animation-delay:0.06s">
          <span class="offer-badge"><i class="fa-solid fa-circle-check"></i> ALWAYS FREE</span>
          <div class="offer-free-icon"><i class="fa-solid fa-truck-fast"></i></div>
          <div class="offer-info">
            <span class="offer-tag">Delivery Deal</span>
            <h3>Free Delivery</h3>
            <p>City-wide delivery on every order — Rs. 0 at checkout.</p>
            <a href="bakery.html" class="offer-cta">Order now <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>`);
      }
      cards.push(...list.map((o, i) => `
        <div class="offer-card offer-${(i % 4) + 1} ${active && String(active.id) === String(o.id) ? 'offer-live' : ''} reveal-zoom" style="animation-delay:${0.12 + i * 0.12}s">
          <span class="offer-badge"><i class="fa-solid fa-bullhorn"></i> LIVE NOW</span>
          <div class="offer-pct"><span class="pct-row"><b>${+o.percent}</b><span>%</span></span><small class="offer-off">OFF</small></div>
          <div class="offer-info">
            <span class="offer-tag">Percentage Offer</span>
            <h3>${esc(o.title)}</h3>
            <p>Flat ${+o.percent}% off on everything at Oven Diaries — added to your cart automatically.</p>
            <a href="bakery.html" class="offer-cta">Shop the sale <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>`));
      document.getElementById('offers-grid').innerHTML = cards.join('');
    })();

    /* Bestsellers — admin trending picks (max 2 per category), fallback to tagged products */
    const trending = TRENDING_PRODUCTS();
    renderProducts(document.getElementById('bestsellers'), (trending.length ? trending : PRODUCTS.filter(p => p.tag === 'bestseller')).slice(0, 4));

    /* Testimonials — admin-shown reviews (max 3) from the Reviews panel, fallback to defaults */
    const revBg = ['#f2a7b3', '#d9a05b', '#6e9d5c', '#c9a227', '#8a6d1f'];
    const shownReviews = getReviews().filter(r => r && r.shown).slice(0, 3);
    const testi = shownReviews.length ? shownReviews : TESTIMONIALS;
    document.getElementById('testimonials').innerHTML = testi.map((t, i) => `
      <div class="testi-card reveal ${'delay-' + (i + 1)}">
        <div class="quote">"</div>
        <div class="stars">${'★'.repeat(Math.min(5, +t.stars || 5))}</div>
        <p>${esc(t.text || '')}</p>
        <div class="testi-user">
          ${t.img
            ? `<img class="avatar" src="${esc(t.img)}" alt="${esc(t.name || '')}" onerror="this.style.display='none'">`
            : `<div class="avatar" style="background:${esc(t.bg || revBg[i % revBg.length])}"><span class="avatar-letter">${esc((t.name || '?')[0])}</span></div>`}
          <div><b>${esc(t.name || '')}</b><span>${esc(t.orderId ? 'Order ' + t.orderId : (t.role || 'Verified customer'))}</span></div>
        </div>
      </div>`);