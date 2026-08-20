/* ============ OVEN DIARIES — DATA ============ */
const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'cakes', label: 'Cream Cakes' },
  { id: 'pastries', label: 'Pastries & Desserts' },
  { id: 'breads', label: 'Bread & Bakes' },
  { id: 'fastfood', label: 'Fast Food' },
  { id: 'drinks', label: 'Beverages' },
];

const IMG = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

const PRODUCTS = [
  { id: 1,  name: 'Classic Cream Cake',      cat: 'cakes',    img: IMG('1558636508-e0db3814bd1d'), bg: 'linear-gradient(135deg,#ffe3ec,#ffd0de)', price: 2450, oldPrice: 2800, tag: 'bestseller', desc: 'Vanilla sponge layered with fresh whipped cream.' },
  { id: 2,  name: 'Chocolate Fudge Cake',    cat: 'cakes',    img: IMG('1578985545062-69928b1d9587'), bg: 'linear-gradient(135deg,#e8c9b0,#d9a05b)', price: 2950, oldPrice: 0,    tag: '',           desc: 'Rich dark chocolate fudge with silky ganache.' },
  { id: 3,  name: 'Strawberry Dream Cake',   cat: 'cakes',    img: IMG('1565958011703-44f9829ba187'), bg: 'linear-gradient(135deg,#ffd6e0,#ffb3c6)', price: 2650, oldPrice: 0,    tag: 'new',        desc: 'Juicy strawberries, cream cheese frosting.' },
  { id: 4,  name: 'Pineapple Gateau',        cat: 'cakes',    img: IMG('1621303837174-89787a7d4729'), bg: 'linear-gradient(135deg,#fff3c4,#ffe08a)', price: 2350, oldPrice: 0,    tag: '',           desc: 'Caramelised pineapple with golden sponge.' },
  { id: 5,  name: 'Red Velvet Slice',        cat: 'cakes',    img: IMG('1555507036-ab1f4038808a'), bg: 'linear-gradient(135deg,#ffd6d6,#ff9d9d)', price: 850,  oldPrice: 1000, tag: 'bestseller', desc: 'Velvety red crumb with tangy cream cheese.' },
  { id: 6,  name: 'Black Forest Cupcake',    cat: 'cakes',    img: IMG('1614707267537-b85aaf00c4b7'), bg: 'linear-gradient(135deg,#e8d5c4,#c9a88f)', price: 350,  oldPrice: 0,    tag: '',           desc: 'Cherry + chocolate chip cupcake, topped with cream.' },
  { id: 7,  name: 'Donut Box (6 pcs)',       cat: 'pastries', img: IMG('1551024506-0bccd828d307'), bg: 'linear-gradient(135deg,#ffe3f0,#ffc2dd)', price: 1500, oldPrice: 1850, tag: 'sale',       desc: 'Glazed, chocolate & sprinkle coated donuts.' },
  { id: 8,  name: 'Cinnamon Rolls (4 pcs)',  cat: 'pastries', img: IMG('1621996346565-e3dbc646d9a9'), bg: 'linear-gradient(135deg,#f2e3c8,#e0c197)', price: 1200, oldPrice: 0,    tag: '',           desc: 'Warm, gooey, swirled with cinnamon butter.' },
  { id: 9,  name: 'Choco Lava Pastry',       cat: 'pastries', img: IMG('1606313564200-e75d5e30476c'), bg: 'linear-gradient(135deg,#e8c9b0,#cf9467)', price: 450,  oldPrice: 0,    tag: 'bestseller', desc: 'Molten centre pastry, bake to order.' },
  { id: 10, name: 'Eclair Deluxe',           cat: 'pastries', img: IMG('1569864358642-9d1684040f43'), bg: 'linear-gradient(135deg,#ffe6d5,#ffc9a1)', price: 550,  oldPrice: 0,    tag: '',           desc: 'Choux pastry filled with vanilla custard.' },
  { id: 11, name: 'Butter Croissant',        cat: 'breads',   img: IMG('1509365465985-25d11c17e812'), bg: 'linear-gradient(135deg,#fff0d6,#f5d9a8)', price: 350,  oldPrice: 0,    tag: '',           desc: '48-layer flaky butter croissant.' },
  { id: 12, name: 'Sourdough Loaf',          cat: 'breads',   img: IMG('1509440159596-0249088772ff'), bg: 'linear-gradient(135deg,#f6e7c8,#e5cf9f)', price: 700,  oldPrice: 0,    tag: '',           desc: 'Tangy, crusty, slow-fermented sourdough.' },
  { id: 13, name: 'Garlic Bread Stick',      cat: 'breads',   img: IMG('1484723091739-30a097e8f929'), bg: 'linear-gradient(135deg,#fff3d9,#f7d98c)', price: 600,  oldPrice: 0,    tag: 'new',        desc: 'Herbed garlic butter brushed baguette.' },
  { id: 14, name: 'Chicken Zinger Burger',   cat: 'fastfood', img: IMG('1568901346375-23c9450c58cd'), bg: 'linear-gradient(135deg,#ffe0c2,#ffc08a)', price: 650,  oldPrice: 780,  tag: 'bestseller', desc: 'Crispy zinger fillet, coleslaw & spicy mayo.' },
  { id: 15, name: 'Loaded Fries',            cat: 'fastfood', img: IMG('1571091718767-18b5b1457add'), bg: 'linear-gradient(135deg,#fff3c9,#ffe89a)', price: 550,  oldPrice: 0,    tag: '',           desc: 'Cheese sauce, chili flakes & herbs.' },
  { id: 16, name: 'Chicken Shawarma Roll',   cat: 'fastfood', img: IMG('1504674900247-0877df9cc836'), bg: 'linear-gradient(135deg,#ffe8d1,#f5c68f)', price: 450,  oldPrice: 0,    tag: '',           desc: 'Marinated chicken, garlic sauce & pickles.' },
  { id: 17, name: 'Hot Dog Special',         cat: 'fastfood', img: IMG('1528735602780-2552fd46c7af'), bg: 'linear-gradient(135deg,#ffe9dc,#ffcfa8)', price: 500,  oldPrice: 0,    tag: 'sale',       desc: 'Grilled sausage, onion relish & mustard.' },
  { id: 18, name: 'Chicken Tikka Pizza',     cat: 'fastfood', img: IMG('1565299624946-b28f40a0ae38'), bg: 'linear-gradient(135deg,#ffe5c9,#ffb977)', price: 1600, oldPrice: 1900, tag: 'new',        desc: 'Wood-fired base, smoky tikka chunks & cheese.' },
  { id: 19, name: 'Cold Coffee Shake',       cat: 'drinks',   img: IMG('1541746972996-4e0b0f43e02a'), bg: 'linear-gradient(135deg,#e8d9c8,#cbb293)', price: 550,  oldPrice: 0,    tag: '',           desc: 'Double shot espresso, ice cream & cream.' },
  { id: 20, name: 'Fresh Strawberry Shake',  cat: 'drinks',   img: IMG('1521305916504-4a1121188589'), bg: 'linear-gradient(135deg,#ffd6e0,#ffb3c6)', price: 600,  oldPrice: 0,    tag: 'new',        desc: 'Real strawberries blended with milk & honey.' },
  { id: 21, name: 'Mango Lassi',             cat: 'drinks',   img: IMG('1553279768-865429fa0078'), bg: 'linear-gradient(135deg,#fff0b3,#ffd966)', price: 450,  oldPrice: 0,    tag: '',           desc: 'Thick yogurt, ripe mango & cardamom.' },
  { id: 22, name: 'Fresh Lemonade Mint',     cat: 'drinks',   img: IMG('1437418747212-8d9709afab22'), bg: 'linear-gradient(135deg,#f4fbd8,#d9f27a)', price: 400,  oldPrice: 0,    tag: '',           desc: 'Squeezed lemons, mint & sparkling water.' },
];

const CUSTOM_CAKE_IMG = IMG('1588195538326-c5b1e9f80a1b');

const TESTIMONIALS = [
  { name: 'Ayesha Khan',   role: 'Birthday Mom',  bg: '#f2a7b3', stars: 5, text: 'Ordered a custom Barbie cake for my daughter — the team nailed every detail. Best bakery in Lahore, hands down!' },
  { name: 'Hamza Raza',    role: 'Foodie',        bg: '#d9a05b', stars: 5, text: 'The zinger burger and donuts are both incredible. You cannot find fresher cream cakes anywhere in town.' },
  { name: 'Sara Malik',    role: 'Event Planner', bg: '#6e9d5c', stars: 5, text: 'We ordered 200 cupcakes for a corporate event. Everything arrived on time, beautifully packed and delicious.' },
];

const COUPONS = {
  OVEN10: 10,
  BAKED15: 15,
  WELCOME20: 20,
};

/* ---------- Categories (core + admin-managed, persisted) ---------- */
function getUserCategories() {
  try { return JSON.parse(localStorage.getItem('od_user_categories') || '[]'); } catch (e) { return []; }
}
function saveUserCategories(list) { localStorage.setItem('od_user_categories', JSON.stringify(list)); }

function getCatRenames() {
  try { return JSON.parse(localStorage.getItem('od_cat_renames') || '{}'); } catch (e) { return {}; }
}
function saveCatRenames(map) { localStorage.setItem('od_cat_renames', JSON.stringify(map)); }

function getDeletedCatIds() {
  try { return JSON.parse(localStorage.getItem('od_deleted_categories') || '[]'); } catch (e) { return []; }
}
function saveDeletedCatIds(list) { localStorage.setItem('od_deleted_categories', JSON.stringify(list)); }

function getDeletedProductIds() {
  try { return JSON.parse(localStorage.getItem('od_deleted_products') || '[]'); } catch (e) { return []; }
}
function saveDeletedProductIds(list) { localStorage.setItem('od_deleted_products', JSON.stringify(list)); }

function categoryLabel(id) {
  const r = getCatRenames()[id];
  if (r) return r;
  const u = getUserCategories().find(c => c.id === id);
  if (u) return u.label;
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.label : id;
}

function ALL_CATEGORIES() {
  const ids = [
    ...CATEGORIES.filter(c => c.id !== 'all' && !getDeletedCatIds().includes(c.id)).map(c => c.id),
    ...getUserCategories().map(c => c.id),
  ];
  return ids.map(id => ({ id, label: categoryLabel(id) }));
}

function addCategory(label) {
  const list = getUserCategories();
  const id = slugify(label);
  if (ALL_CATEGORIES().some(c => c.id === id)) return { ok: false, msg: 'A category with this name already exists.' };
  list.push({ id, label });
  saveUserCategories(list);
  return { ok: true, id };
}

function renameCategory(id, label) {
  const list = getUserCategories();
  const i = list.findIndex(c => c.id === id);
  if (i > -1) { list[i].label = label; saveUserCategories(list); }
  else {
    const renames = getCatRenames();
    renames[id] = label;
    saveCatRenames(renames);
  }
}

function deleteCategory(catId) {
  const delCats = getDeletedCatIds();
  if (!delCats.includes(catId)) delCats.push(catId);
  saveDeletedCatIds(delCats);
  saveUserCategories(getUserCategories().filter(c => c.id !== catId));
  const delProd = new Set(getDeletedProductIds());
  PRODUCTS.filter(p => p.cat === catId).forEach(p => delProd.add(p.id));
  saveDeletedProductIds([...delProd]);
  saveUserProducts(getUserProducts().filter(p => p.cat !== catId));
  const overrides = getProductOverrides();
  Object.keys(overrides).forEach(k => { if (PRODUCTS.some(p => p.id === +k && p.cat === catId)) delete overrides[k]; });
  saveProductOverrides(overrides);
}

function slugify(s) {
  const slug = String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'cat-' + Date.now();
}

/* ---------- Admin-added products (persisted) ---------- */
function getUserProducts() {
  try { return JSON.parse(localStorage.getItem('od_user_products') || '[]'); } catch (e) { return []; }
}
function saveUserProducts(list) { localStorage.setItem('od_user_products', JSON.stringify(list)); }

function getProductOverrides() {
  try { return JSON.parse(localStorage.getItem('od_product_overrides') || '{}'); } catch (e) { return {}; }
}
function saveProductOverrides(map) { localStorage.setItem('od_product_overrides', JSON.stringify(map)); }

function mergeOverride(p) {
  const o = getProductOverrides()[p.id];
  return o ? { ...p, ...o } : p;
}

function ALL_PRODUCTS() {
  return [
    ...PRODUCTS.filter(p => !getDeletedProductIds().includes(p.id)).map(mergeOverride),
    ...getUserProducts(),
  ];
}
function findProduct(id) {
  const up = getUserProducts().find(p => p.id === id);
  if (up) return up;
  const core = PRODUCTS.find(p => p.id === id);
  return core && !getDeletedProductIds().includes(id) ? mergeOverride(core) : undefined;
}

function deleteProduct(id) {
  const list = getUserProducts();
  const kept = list.filter(p => p.id !== id);
  saveUserProducts(kept);
  if (kept.length !== list.length) return;
  const overrides = getProductOverrides();
  delete overrides[id];
  saveProductOverrides(overrides);
  const del = new Set(getDeletedProductIds());
  del.add(id);
  saveDeletedProductIds([...del]);
}

function saveProductEdit(id, data) {
  const users = getUserProducts();
  const i = users.findIndex(p => String(p.id) === String(id));
  if (i > -1) {
    users[i] = { ...users[i], ...data };
    saveUserProducts(users);
    return;
  }
  const base = PRODUCTS.find(p => String(p.id) === String(id));
  if (base) {
    const overrides = getProductOverrides();
    overrides[id] = { ...base, ...data };
    saveProductOverrides(overrides);
  }
}

/* ---------- Trending (best sellers, admin-managed, max 2 per category) ---------- */
const TRENDING_LIMIT = 2;
function getTrendingMap() {
  try {
    const m = JSON.parse(localStorage.getItem('od_trending'));
    if (m && typeof m === 'object' && !Array.isArray(m)) return m;
  } catch (e) {}
  return {};
}
function saveTrendingMap(m) { localStorage.setItem('od_trending', JSON.stringify(m)); }
function trendingIds(cat) {
  const t = getTrendingMap()[cat];
  return Array.isArray(t) ? t : [];
}
function isTrendingProduct(id) {
  const p = ALL_PRODUCTS().find(x => String(x.id) === String(id));
  return p ? trendingIds(p.cat).some(x => String(x) === String(id)) : false;
}
function setTrendingProduct(id) {
  const p = ALL_PRODUCTS().find(x => String(x.id) === String(id));
  if (!p) return { ok: false, msg: 'Product not found' };
  const list = trendingIds(p.cat);
  if (!list.some(x => String(x) === String(id))) {
    if (list.length >= TRENDING_LIMIT) return { ok: false, msg: 'Only ' + TRENDING_LIMIT + ' products per category can be trending — remove one first' };
    const m = getTrendingMap();
    m[p.cat] = [...list, id];
    saveTrendingMap(m);
    return { ok: true, name: p.name, on: true };
  }
  const m = getTrendingMap();
  m[p.cat] = m[p.cat].filter(x => x !== id);
  if (!m[p.cat].length) delete m[p.cat];
  saveTrendingMap(m);
  return { ok: true, name: p.name, on: false };
}
function TRENDING_PRODUCTS() {
  const map = getTrendingMap();
  return ALL_PRODUCTS().filter(p => (map[p.cat] || []).some(id => String(id) === String(p.id)));
}

/* ---------- Reviews (submitted from the track order page) ---------- */
function getReviews() {
  try {
    const r = JSON.parse(localStorage.getItem('od_reviews'));
    if (Array.isArray(r)) return r;
  } catch (e) {}
  return [];
}
function addReview(r) {
  const list = getReviews();
  list.unshift(r);
  localStorage.setItem('od_reviews', JSON.stringify(list));
}
function saveReviews(list) { localStorage.setItem('od_reviews', JSON.stringify(list)); }

/* ---------- Offers & delivery settings (admin-managed) ---------- */
function getOfferList() {
  try {
    const o = JSON.parse(localStorage.getItem('od_offers'));
    if (Array.isArray(o)) return o;
  } catch (e) {}
  return [];
}
function saveOfferList(o) { localStorage.setItem('od_offers', JSON.stringify(o)); }
function getActiveOffer() {
  try {
    const o = JSON.parse(localStorage.getItem('od_active_offer'));
    if (o && typeof o === 'object') return o;
  } catch (e) {}
  return null;
}
function saveActiveOffer(o) { localStorage.setItem('od_active_offer', JSON.stringify(o)); }

function getDeliverySettings() {
  try {
    const s = JSON.parse(localStorage.getItem('od_delivery'));
    if (s && typeof s === 'object' && (s.mode === 'free' || s.mode === 'paid')) return s;
  } catch (e) {}
  return { mode: 'free' };
}
function saveDeliverySettings(s) { localStorage.setItem('od_delivery', JSON.stringify(s)); }
function getDeliveryAreas() {
  try {
    const a = JSON.parse(localStorage.getItem('od_delivery_areas'));
    if (Array.isArray(a)) return a;
  } catch (e) {}
  return [];
}
function saveDeliveryAreas(a) { localStorage.setItem('od_delivery_areas', JSON.stringify(a)); }

/* ---------- Delivery cities ---------- */
const CITIES = [
  { id: 'lahore', name: 'Lahore' },
  { id: 'karachi', name: 'Karachi' },
  { id: 'islamabad', name: 'Islamabad' },
  { id: 'rawalpindi', name: 'Rawalpindi' },
  { id: 'faisalabad', name: 'Faisalabad' },
  { id: 'gujranwala', name: 'Gujranwala' },
  { id: 'sialkot', name: 'Sialkot' },
  { id: 'multan', name: 'Multan' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'peshawar', name: 'Peshawar' },
  { id: 'quetta', name: 'Quetta' },
];
function cityName(id) {
  const c = getCities().find(x => x.id === id);
  return (c || {}).name || '';
}
function getCities() {
  try {
    const hidden = new Set(JSON.parse(localStorage.getItem('od_hidden_cities') || '[]'));
    const custom = JSON.parse(localStorage.getItem('od_custom_cities') || '[]');
    const defaults = CITIES.filter(c => !hidden.has(c.id));
    return [...defaults, ...(Array.isArray(custom) ? custom.filter(c => !hidden.has(c.id)) : [])];
  } catch (e) {}
  return CITIES;
}
function saveCustomCities(c) { localStorage.setItem('od_custom_cities', JSON.stringify(c)); }
function deliveryAreasFor(cityId) {
  const areas = getDeliveryAreas().filter(a => a && a.name && a.name.trim());
  if (!areas.some(a => a.city)) return areas;
  return areas.filter(a => String(a.city || '') === String(cityId || ''));
}

const FLAVORS = [
  { id: 'vanilla', name: 'Vanilla', colors: ['#fff7e6', '#fde9c8'] },
  { id: 'chocolate', name: 'Chocolate', colors: ['#6b4532', '#8a5a41'] },
  { id: 'strawberry', name: 'Strawberry', colors: ['#f9c6d2', '#f49bb0'] },
  { id: 'redvelvet', name: 'Red Velvet', colors: ['#c94f4f', '#a93c3c'] },
  { id: 'mango', name: 'Mango', colors: ['#ffdf70', '#ffc93c'] },
  { id: 'pistachio', name: 'Pistachio', colors: ['#cfe6b8', '#a8cf8a'] },
  { id: 'blueberry', name: 'Blueberry', colors: ['#b9c3f0', '#93a2e0'] },
  { id: 'butterscotch', name: 'Butterscotch', colors: ['#f2d3a7', '#d9a05b'] },
];

const SIZES = [
  { id: 'half',   name: 'Half Kg',   multiplier: 1,   note: 'serves 4-6' },
  { id: 'one',    name: '1 Kg',      multiplier: 1.85, note: 'serves 8-12' },
  { id: 'onehalf',name: '1.5 Kg',    multiplier: 2.6,  note: 'serves 12-16' },
  { id: 'two',    name: '2 Kg',      multiplier: 3.3,  note: 'serves 16-24' },
];

const CAKE_BASES = [
  { id: 'cream',     name: 'Cream Cake', add: 0,    colors: ['#fff7e6', '#f3dcc0'] },
  { id: 'chocolate', name: 'Chocolate',  add: 300,  colors: ['#6b4532', '#4a2f22'] },
  { id: 'photo',     name: 'Photo Cake', add: 500,  colors: ['#ffe9a8', '#ffc24b'] },
  { id: 'fondant',   name: 'Fondant',    add: 1500, colors: ['#f7c8d2', '#ef9fb0'] },
];

const CAKE_CANDLES = [
  { id: 'none',    name: 'No Candle',      icon: 'fa-ban' },
  { id: 'basic',   name: 'Classic Candle', icon: 'fa-fire' },
  { id: 'sparkle', name: 'Sparkler',       icon: 'fa-star' },
  { id: 'number',  name: 'Number Candle',  icon: 'fa-hashtag' },
];

const CAKE_EXTRAS = [
  { id: 'none',    name: 'No Message',       icon: 'fa-ban',    price: 0 },
  { id: 'written', name: 'Written Message',  icon: 'fa-pen',    price: 150 },
  { id: 'topper',  name: 'Custom Topper',    icon: 'fa-gift',   price: 400 },
];

/* ---------- Custom cake options (admin-managed, persisted) ---------- */
function getCCList(key) {
  try { const v = JSON.parse(localStorage.getItem('od_cc_' + key)); if (Array.isArray(v)) return v; } catch (e) {}
  return null;
}
function saveCCList(key, list) { localStorage.setItem('od_cc_' + key, JSON.stringify(list)); }

function normalizeCC(items, dflt) {
  return items.map(i => {
    const d = dflt.find(x => x.id === i.id) || {};
    return {
      id: i.id,
      name: String(i.name || d.name || 'Option').trim(),
      price: +i.price || +(d.price || 0),
      colors: i.colors || d.colors,
      icon: i.icon || d.icon,
      note: i.note || d.note || '',
    };
  });
}

function CC_FLAVOURS() {
  const d = FLAVORS.map(f => ({ id: f.id, name: f.name, price: 0, colors: f.colors }));
  const s = getCCList('flavours');
  return s ? normalizeCC(s, d) : d;
}
function CC_BASES() {
  const d = CAKE_BASES.map(b => ({ id: b.id, name: b.name, price: b.add, colors: b.colors }));
  const s = getCCList('bases');
  return s ? normalizeCC(s, d) : d;
}
function CC_SIZES() {
  const d = SIZES.map(s => ({ id: s.id, name: s.name, price: s.id === 'half' ? 0 : Math.round((s.multiplier - 1) * 2450 / 50) * 50, note: s.note }));
  const s = getCCList('sizes');
  return s ? normalizeCC(s, d) : d;
}
function CC_EXTRAS() {
  const d = CAKE_EXTRAS.map(x => ({ id: x.id, name: x.name, price: x.price, icon: x.icon }));
  const s = getCCList('extras');
  return s ? normalizeCC(s, d) : d;
}
function CC_CANDLES() {
  const d = CAKE_CANDLES.map(c => ({ id: c.id, name: c.name, price: 0, icon: c.icon }));
  const s = getCCList('candles');
  return s ? normalizeCC(s, d) : d;
}

/* ---------- Shop product variants (flavour + size per category) ---------- */
const SIZES_SHOP = {
  cakes:    [ { id: 'half',    name: 'Half Kg',     mult: 1    }, { id: 'one',     name: '1 Kg',     mult: 1.85 }, { id: 'onehalf', name: '1.5 Kg', mult: 2.6  }, { id: 'two', name: '2 Kg', mult: 3.3 } ],
  pastries: [ { id: 'half',    name: 'Half Kg',     mult: 1    }, { id: 'one',     name: '1 Kg',     mult: 1.85 }, { id: 'onehalf', name: '1.5 Kg', mult: 2.6  }, { id: 'two', name: '2 Kg', mult: 3.3 } ],
  breads:   [ { id: 'single',  name: 'Single (1 pc)', mult: 1  }, { id: 'family',  name: 'Family Pack', mult: 2.2 } ],
  fastfood: [ { id: 'regular', name: 'Regular',     mult: 1    }, { id: 'large',   name: 'Large',     mult: 1.55 }, { id: 'meal',  name: 'Meal + Drink', mult: 1.9 } ],
  drinks:   [ { id: 'regular', name: 'Regular',     mult: 1    }, { id: 'large',   name: 'Large',     mult: 1.5  } ],
};

const FLAVOURS_SHOP = {
  cakes:    [ { id: 'vanilla',     name: 'Vanilla',     colors: ['#fff7e6', '#fde9c8'] }, { id: 'chocolate',  name: 'Chocolate',  colors: ['#6b4532', '#8a5a41'] }, { id: 'strawberry', name: 'Strawberry', colors: ['#f9c6d2', '#f49bb0'] }, { id: 'mango', name: 'Mango', colors: ['#ffdf70', '#ffc93c'] }, { id: 'pistachio', name: 'Pistachio', colors: ['#cfe6b8', '#a8cf8a'] } ],
  pastries: [ { id: 'classic',     name: 'Classic',     colors: ['#fff7e6', '#fde9c8'] }, { id: 'chocolate',  name: 'Chocolate',  colors: ['#6b4532', '#8a5a41'] }, { id: 'caramel',    name: 'Caramel',    colors: ['#f2d3a7', '#d9a05b'] }, { id: 'berry', name: 'Berry', colors: ['#f9c6d2', '#f49bb0'] } ],
  breads:   [ { id: 'plain',       name: 'Plain',       colors: ['#fff0d6', '#f5d9a8'] }, { id: 'garlic',     name: 'Garlic',     colors: ['#f2e3c8', '#d9c08f'] }, { id: 'wholewheat', name: 'Whole Wheat', colors: ['#e8d5ae', '#c9b37f'] }, { id: 'cheese', name: 'Cheese', colors: ['#ffe9a8', '#ffc24b'] } ],
  fastfood: [ { id: 'classic',     name: 'Classic',     colors: ['#ffe0c2', '#ffc08a'] }, { id: 'spicy',      name: 'Spicy',      colors: ['#ffb3a8', '#f4694a'] }, { id: 'cheese',     name: 'Cheese Burst', colors: ['#ffe9a8', '#ffc24b'] }, { id: 'bbq', name: 'BBQ', colors: ['#c9a88f', '#a37c5f'] } ],
  drinks:   [ { id: 'original',    name: 'Original',    colors: ['#fff0d6', '#f5d9a8'] }, { id: 'chocolate',  name: 'Chocolate',  colors: ['#6b4532', '#8a5a41'] }, { id: 'caramel',    name: 'Caramel',    colors: ['#f2d3a7', '#d9a05b'] }, { id: 'fruity', name: 'Fruity', colors: ['#f9c6d2', '#f49bb0'] } ],
};

function shopSizes(cat) { return SIZES_SHOP[cat] || SIZES_SHOP.cakes; }
function shopFlavours(cat) { return FLAVOURS_SHOP[cat] || FLAVOURS_SHOP.cakes; }
function sizeMult(cat, id) { return (shopSizes(cat).find(s => s.id === id) || { mult: 1 }).mult; }
function sizeLabel(cat, id) { return (shopSizes(cat).find(s => s.id === id) || {}).name || ''; }
function flavourLabel(cat, id) { return (shopFlavours(cat).find(f => f.id === id) || {}).name || ''; }

/* ---------- Per-product variants (admin-defined, fall back to category defaults) ---------- */
function flavourColors(name) {
  const n = String(name || '').toLowerCase();
  const f = FLAVORS.find(x => x.name.toLowerCase() === n || n.includes(x.name.toLowerCase()));
  return f ? f.colors : ['#ffe9d6', '#f7cfa4'];
}
function pSizes(p) {
  return (p.sizes && p.sizes.length) ? p.sizes.map(s => ({ id: slugify(s), name: s, mult: 1 })) : shopSizes(p.cat);
}
function pFlavours(p) {
  return (p.flavours && p.flavours.length) ? p.flavours.map(f => ({ id: slugify(f), name: f, colors: flavourColors(f) })) : shopFlavours(p.cat);
}
function pSizeMult(p, id) { return (pSizes(p).find(s => s.id === id) || { mult: 1 }).mult; }
function pSizeLabel(p, id) { const s = pSizes(p).find(x => x.id === id); return (s || {}).name || ''; }
function pFlavourLabel(p, id) { const f = pFlavours(p).find(x => x.id === id); return (f || {}).name || ''; }
function variantImage(p, flavourName, sizeName, weight) {
  const imgs = (p.images || []).filter(i => i.url);
  if (!imgs.length) return p.img || '';
  const tags = [flavourName, sizeName, weight].filter(Boolean);
  const hit = tags.length ? imgs.find(i => tags.some(t => t && String(i.label || '').toLowerCase().includes(t.toLowerCase()))) : null;
  return (hit || imgs[0]).url;
}

const INITIAL_ORDERS = [
  { id: 'OD-1842', customer: 'Ayesha Khan', email: 'ayesha.khan@gmail.com', phone: '0300-1112233', address: 'House 4, Block C, Gulberg III, Lahore', lines: [{ name: 'Classic Cream Cake', qty: 1, price: 2450, opts: 'Size: 1 Kg • Flavour: Vanilla' }, { name: 'Donut Box', qty: 1, price: 1500, opts: '' }], items: 'Classic Cream Cake (1 Kg) + Donut Box', total: 3950, status: 'delivered', placedAt: '2026-08-10T14:30:00' },
  { id: 'OD-1843', customer: 'Hamza Raza', email: 'hamza.raza@outlook.com', phone: '0311-4455667', address: 'Street 12, Model Town, Lahore', lines: [{ name: 'Chicken Zinger Burger', qty: 2, price: 650, opts: 'Flavour: Spicy' }, { name: 'Loaded Fries', qty: 1, price: 550, opts: '' }], items: 'Zinger Burger x2 + Loaded Fries', total: 1850, status: 'confirmed', placedAt: '2026-08-12T18:05:00' },
  { id: 'OD-1844', customer: 'Sara Malik', email: 'sara.malik@gmail.com', phone: '0322-9988776', address: 'House 21, DHA Phase 5, Lahore', lines: [{ name: 'Custom Fondant Cake', qty: 1, price: 8100, opts: '2 Kg • Fondant', isCustom: true }], items: 'Custom Fondant Cake (2 Kg)', total: 8100, status: 'pending', placedAt: '2026-08-14T11:20:00' },
  { id: 'OD-1845', customer: 'Bilal Ahmed', email: 'bilal.ahmed@yahoo.com', phone: '0333-5566778', address: 'Flat B-7, Johar Town, Lahore', lines: [{ name: 'Black Forest Cupcake', qty: 12, price: 350, opts: '' }, { name: 'Cold Coffee Shake', qty: 1, price: 550, opts: 'Size: Large' }], items: 'Cupcakes x12 + Cold Coffee', total: 4750, status: 'pending', placedAt: '2026-08-15T09:45:00' },
  { id: 'OD-1846', customer: 'Fatima Noor', email: 'fatima.noor@gmail.com', phone: '0345-2233445', address: 'House 9, Garden Town, Lahore', lines: [{ name: 'Strawberry Dream Cake', qty: 1, price: 2650, opts: 'Size: 1 Kg • Flavour: Strawberry' }], items: 'Strawberry Dream Cake', total: 2650, status: 'delivered', placedAt: '2026-08-11T16:10:00' },
];

const PKR = n => 'Rs. ' + Number(n).toLocaleString('en-PK');

/* ---------- Product art: real image with gradient fallback ---------- */
function productArt(p) {
  return `
  <div class="img-wrap" style="background:${p.bg}">
    ${p.tag ? `<span class="p-tag ${p.tag}">${p.tag.toUpperCase()}</span>` : ''}
    ${p.img ? `<img class="p-img" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">` : ''}
    <button class="p-wish" data-wish="${p.id}" title="Wishlist">${isWished(p.id) ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>'}</button>
  </div>`;
}

function isWished(id) {
  try { return JSON.parse(localStorage.getItem('od_wishlist') || '[]').includes(id); } catch (e) { return false; }
}

function toggleWish(id, btn) {
  let w = JSON.parse(localStorage.getItem('od_wishlist') || '[]');
  const i = w.indexOf(id);
  if (i > -1) { w.splice(i, 1); } else { w.push(id); }
  localStorage.setItem('od_wishlist', JSON.stringify(w));
  btn.classList.toggle('active', isWished(id));
  btn.innerHTML = isWished(id) ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
}

function updateWishlistIcons() {
  document.querySelectorAll('.p-wish').forEach(b => {
    const id = +b.dataset.wish;
    b.innerHTML = isWished(id) ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
    b.classList.toggle('active', isWished(id));
  });
}