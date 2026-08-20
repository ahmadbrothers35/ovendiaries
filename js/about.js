    /* ---------- Complaint form ---------- */
    let compFile = null;

    document.getElementById('file-input').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { toast('File is too large — max 20 MB', 'error'); e.target.value = ''; return; }
      compFile = f;
      document.getElementById('file-label').textContent = 'Attached:';
      const nameEl = document.getElementById('file-name');
      nameEl.textContent = f.name + ' (' + (f.size / 1024).toFixed(0) + ' KB)';
      nameEl.style.display = '';
      document.getElementById('file-btn').classList.add('has-file');
    });

    document.getElementById('comp-form').addEventListener('submit', e => {
      e.preventDefault();
      const oid = document.getElementById('comp-oid').value.trim();
      const details = document.getElementById('comp-details').value.trim();
      const desc = document.getElementById('comp-desc').value.trim();
      if (!oid) { toast('Please enter your order ID', 'error'); return; }
      if (!details) { toast('Please enter your customer details', 'error'); return; }
      if (!desc) { toast('Please describe the issue', 'error'); return; }

      let list = [];
      try { list = JSON.parse(localStorage.getItem('od_complaints') || '[]'); } catch (err) {}
      const id = 'CMP-' + (1001 + list.length);
      list.unshift({
        id,
        orderId: oid,
        customer: details,
        description: desc,
        file: compFile ? compFile.name : '',
        fileType: compFile ? compFile.type : '',
        at: new Date().toISOString(),
      });
      localStorage.setItem('od_complaints', JSON.stringify(list));

      document.getElementById('comp-success-id').textContent = id;
      document.getElementById('comp-form-wrap').style.display = 'none';
      document.getElementById('comp-success').style.display = 'block';
      document.getElementById('comp-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('Complaint lodged — we are on it', 'success');
    });

    document.getElementById('comp-another').addEventListener('click', () => {
      document.getElementById('comp-form').reset();
      compFile = null;
      document.getElementById('file-label').textContent = 'Attach a photo or video';
      document.getElementById('file-name').style.display = 'none';
      document.getElementById('file-btn').classList.remove('has-file');
      document.getElementById('comp-success').style.display = 'none';
      document.getElementById('comp-form-wrap').style.display = 'block';
    });