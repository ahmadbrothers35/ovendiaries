/* ============ OVEN DIARIES — AUTH (local demo) ============ */

const Auth = {
  users() {
    try {
      const seeded = JSON.parse(localStorage.getItem('od_users'));
      if (Array.isArray(seeded)) {
        let changed = false;
        seeded.forEach(u => {
          if (u.email === 'admin@ovendiaries.pk' && u.pass === 'admin123' && u.name === 'Oven Admin') {
            u.name = 'Fatima Tanveer'; u.email = 'saman@ovendiaries.pk'; u.pass = 'saman5599-';
            changed = true;
          }
        });
        if (changed) localStorage.setItem('od_users', JSON.stringify(seeded));
        return seeded;
      }
    } catch (e) {}
    const defaults = [
      { name: 'Fatima Tanveer', email: 'saman@ovendiaries.pk', pass: 'saman5599-', role: 'admin' },
      { name: 'Demo User',  email: 'demo@ovendiaries.pk', pass: 'demo123',  role: 'user' },
    ];
    localStorage.setItem('od_users', JSON.stringify(defaults));
    return defaults;
  },
  saveUsers(u) { localStorage.setItem('od_users', JSON.stringify(u)); },
  current() {
    try { return JSON.parse(localStorage.getItem('od_current')); } catch (e) { return null; }
  },
  session() { return !!this.current(); },
  login(email, pass) {
    const u = this.users().find(x => x.email.toLowerCase() === email.toLowerCase() && x.pass === pass);
    if (!u) return { ok: false, msg: 'Invalid email or password. Try saman@ovendiaries.pk / saman5599-' };
    if (u.banned) return { ok: false, msg: 'This account has been banned. Contact the bakery for help.' };
    localStorage.setItem('od_current', JSON.stringify({ name: u.name, email: u.email, role: u.role }));
    return { ok: true, u };
  },
  signup(name, email, pass) {
    const users = this.users();
    if (users.find(x => x.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, msg: 'An account with this email already exists.' };
    users.push({ name, email, pass, role: 'user' });
    this.saveUsers(users);
    localStorage.setItem('od_current', JSON.stringify({ name, email, role: 'user' }));
    return { ok: true };
  },
  logout() { localStorage.removeItem('od_current'); },
};

const requireUser = () => {
  const u = Auth.current();
  if (!u) {
    const redirect = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    location.href = 'login.html?next=' + redirect;
    return null;
  }
  return u;
};

const requireAdmin = () => {
  const u = Auth.current();
  if (!u) { location.href = 'login.html?next=admin.html'; return null; }
  if (u.role !== 'admin') { location.href = 'index.html'; return null; }
  return u;
};