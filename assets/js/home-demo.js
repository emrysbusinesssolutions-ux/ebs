/* ==========================================================================
   EBS — home page interactive POS demo
   Vanilla, no dependencies, sample data only.
   ========================================================================== */
(() => {
  'use strict';

  const shell = document.getElementById('homeDemo');
  if (!shell) return;

  const cartEl = document.getElementById('demoCart');
  const totalEl = document.getElementById('demoTotal');
  const countEl = document.getElementById('demoCount');
  const toastEl = document.getElementById('demoToast');
  const chargeBtn = document.getElementById('demoCharge');
  const resetBtn = document.getElementById('demoReset');

  const cart = new Map();
  const fmt = n => window.EBSMoney ? window.EBSMoney.formatMoney(n) : `฿${Number(n).toLocaleString('en-US')}`;
  let toastTimer = 0;

  const totals = () => {
    let qty = 0;
    let sum = 0;
    cart.forEach(item => { qty += item.qty; sum += item.price * item.qty; });
    return { qty, sum };
  };

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  }

  function render() {
    const { qty, sum } = totals();
    if (countEl) countEl.textContent = qty === 1 ? '1 item' : `${qty} items`;
    if (totalEl) totalEl.textContent = fmt(sum);

    if (!cart.size) {
      cartEl.innerHTML = '<li class="demo-cart__empty">Tap a product to start a sale.</li>';
      return;
    }

    cartEl.innerHTML = '';
    cart.forEach((item, name) => {
      const li = document.createElement('li');
      li.className = 'demo-cart__row';

      const label = document.createElement('span');
      label.className = 'demo-cart__name';
      label.textContent = name;

      const qtyWrap = document.createElement('span');
      qtyWrap.className = 'demo-qty';
      const dec = document.createElement('button');
      dec.type = 'button';
      dec.dataset.act = 'dec';
      dec.dataset.name = name;
      dec.setAttribute('aria-label', `Decrease ${name}`);
      dec.textContent = '−';
      const count = document.createElement('span');
      count.textContent = String(item.qty);
      const inc = document.createElement('button');
      inc.type = 'button';
      inc.dataset.act = 'inc';
      inc.dataset.name = name;
      inc.setAttribute('aria-label', `Increase ${name}`);
      inc.textContent = '+';
      qtyWrap.append(dec, count, inc);

      const line = document.createElement('span');
      line.className = 'demo-cart__line';
      line.textContent = fmt(item.price * item.qty);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'demo-remove';
      remove.dataset.remove = name;
      remove.setAttribute('aria-label', `Remove ${name}`);
      remove.textContent = '×';

      li.append(label, qtyWrap, line, remove);
      cartEl.appendChild(li);
    });
  }

  shell.addEventListener('click', event => {
    const add = event.target.closest('.demo-product');
    if (add) {
      const name = add.dataset.name;
      const price = Number(add.dataset.price) || 0;
      const current = cart.get(name) || { price, qty: 0 };
      current.qty += 1;
      cart.set(name, current);
      render();
      return;
    }

    const step = event.target.closest('[data-act]');
    if (step) {
      const name = step.dataset.name;
      const item = cart.get(name);
      if (!item) return;
      if (step.dataset.act === 'inc') item.qty += 1;
      else item.qty -= 1;
      if (item.qty <= 0) cart.delete(name);
      render();
      return;
    }

    const remove = event.target.closest('[data-remove]');
    if (remove) {
      cart.delete(remove.dataset.remove);
      render();
    }
  });

  if (chargeBtn) {
    chargeBtn.addEventListener('click', () => {
      const { qty, sum } = totals();
      if (!qty) {
        toast('Add a product first — tap any tile.');
        return;
      }
      toast(`Sale complete · ${fmt(sum)} — receipt printed (demo)`);
      cart.clear();
      render();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      cart.clear();
      render();
      toast('Demo reset.');
    });
  }

  document.addEventListener('ebs:currency', render);
  render();
})();
