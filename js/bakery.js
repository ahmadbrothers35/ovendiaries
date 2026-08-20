    const grid = document.getElementById('shop-grid');
    const noResults = document.getElementById('no-results');
    let activeCat = 'all', query = '', sort = 'featured';

    document.getElementById('filters').innerHTML =
      '<button class="chip active" data-cat="all">All Items</button>' +
      ALL_CATEGORIES().map(c => `<button class="chip" data-cat="${esc(c.id)}">${esc(c.label)}</button>`).join('');

    const apply = () => {
      let list = ALL_PRODUCTS().filter(p => {
        const matchCat = activeCat === 'all' || p.cat === activeCat;
        const q = query.trim().toLowerCase();
        const matchQ = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.cat.includes(q);
        return matchCat && matchQ;
      });
      if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
      if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
      if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
      grid.style.opacity = 0;
      setTimeout(() => {
        grid.innerHTML = list.map((p, i) => productCardHTML(p, i)).join('');
        grid.style.opacity = 1;
        grid.style.transition = 'opacity 0.35s ease';
        noResults.style.display = list.length ? 'none' : 'block';
        bindProductEvents(grid);
        if (SHOP_CLOSED()) grid.querySelectorAll('.add-btn').forEach(b => b.style.display = 'none');
      }, 150);
    };

    document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCat = chip.dataset.cat;
      apply();
    }));

    let searchTimer;
    document.getElementById('search').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { query = e.target.value; apply(); }, 200);
    });

    document.getElementById('sort').addEventListener('change', e => { sort = e.target.value; apply(); });

    const urlCat = new URLSearchParams(location.search).get('cat');
    if (urlCat && ALL_CATEGORIES().some(c => c.id === urlCat)) {
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === urlCat));
      activeCat = urlCat;
    }
    apply();