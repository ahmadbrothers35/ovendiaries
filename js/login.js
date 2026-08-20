    const $ = id => document.getElementById(id);
    const next = new URLSearchParams(location.search).get('next') || 'index.html';
    let tab = 'login';

    const switchTab = t => {
      tab = t;
      document.querySelectorAll('#auth-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
      $('view-login').style.display = t === 'login' ? '' : 'none';
      $('view-signup').style.display = t === 'signup' ? '' : 'none';
      $('view-welcome').style.display = 'none';
    };
    document.querySelectorAll('#auth-tabs .tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    document.querySelectorAll('[data-switch]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); switchTab(a.dataset.switch); }));

    const showError = (form, msg) => {
      const old = form.querySelector('.auth-error');
      if (old) old.remove();
      const err = document.createElement('div');
      err.className = 'auth-error shake';
      err.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>${msg}`;
      form.prepend(err);
      setTimeout(() => err.classList.remove('shake'), 600);
    };

    document.querySelectorAll('.password-toggle').forEach(btn => btn.addEventListener('click', () => {
      const inp = $(btn.dataset.eye);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.innerHTML = inp.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    }));

    const viewWelcome = (u, msg) => {
      $('welcome-name').textContent = u.name;
      $('welcome-msg').textContent = msg;
      const isAdmin = u.role === 'admin';
      $('welcome-continue').href = isAdmin ? 'admin.html' : next;
      $('welcome-continue').innerHTML = isAdmin
        ? '<i class="fa-solid fa-gauge-high"></i> Open Dashboard'
        : '<i class="fa-solid fa-arrow-right"></i> Continue Shopping';
      $('view-login').style.display = 'none';
      $('view-signup').style.display = 'none';
      $('view-welcome').style.display = '';
      $('view-welcome').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    $('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const email = $('login-email').value.trim().toLowerCase();
      const pass = $('login-pass').value;
      if (!email || !pass) { showError($('login-form'), 'Enter your email and password'); return; }
      const r = Auth.login(email, pass);
      if (!r.ok) { showError($('login-form'), r.msg); return; }
      viewWelcome(r.u, 'Logged in successfully');
    });

    $('signup-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('signup-name').value.trim();
      const email = $('signup-email').value.trim().toLowerCase();
      const pass = $('signup-pass').value;
      if (!name) { showError($('signup-form'), 'Enter your name'); return; }
      if (!/^\S+@\S+\.\S+$/.test(email)) { showError($('signup-form'), 'Enter a valid email address'); return; }
      if (pass.length < 6) { showError($('signup-form'), 'Password must be at least 6 characters'); return; }
      const r = Auth.signup(name, email, pass);
      if (!r.ok) { showError($('signup-form'), r.msg); return; }
      viewWelcome({ name, email }, 'Account created — welcome to the family!');
    });

    $('admin-enter').addEventListener('click', () => {
      const fields = $('admin-fields');
      if (fields.style.display === 'none') { fields.style.display = 'grid'; $('admin-email').focus(); return; }
      const email = $('admin-email').value.trim().toLowerCase();
      const pass = $('admin-pass').value;
      if (!email || !pass) { toast('Enter your admin email and password', 'error'); return; }
      const r = Auth.login(email, pass);
      if (!r.ok) { toast(r.msg, 'error'); return; }
      if (r.u.role !== 'admin') { Auth.logout(); toast('This account is not a management account', 'error'); return; }
      toast('Welcome back, ' + r.u.name + ' — opening the dashboard', 'success');
      setTimeout(() => location.href = 'admin.html', 650);
    });
    ['admin-email', 'admin-pass'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('admin-enter').click(); }));