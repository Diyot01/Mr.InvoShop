const STORAGE_KEY = 'dukaan_ledger_inventory_v1';
const BILLS_KEY = 'dukaan_ledger_bills_v1';
const SETTINGS_KEY = 'dukaan_ledger_settings_v1';

let items = [];
let bills = [];
let cart = [];
let editingId = null;
let settings = { shopName:'', address:'', gst:'', phone:'' };

function loadItems(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    items = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Could not read saved inventory', e);
    items = [];
  }
}

function loadBills(){
  try{
    const raw = localStorage.getItem(BILLS_KEY);
    bills = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Could not read saved bills', e);
    bills = [];
  }
}

function loadSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(raw) settings = { ...settings, ...JSON.parse(raw) };
  }catch(e){
    console.error('Could not read shop settings', e);
  }
}

function saveSettings(){
  try{
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    touchSavedIndicator();
  }catch(e){
    console.error('Could not save shop settings', e);
  }
}

function saveItems(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    touchSavedIndicator();
  }catch(e){
    console.error('Could not save inventory', e);
    alert('Could not save. Your browser storage may be full or disabled.');
  }
}

function saveBills(){
  try{
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    touchSavedIndicator();
  }catch(e){
    console.error('Could not save bills', e);
  }
}

function touchSavedIndicator(){
  document.getElementById('lastSaved').textContent = 'saved ' + new Date().toLocaleTimeString();
}

function uid(prefix){
  return (prefix||'it') + '_' + Date.now() + '_' + Math.floor(Math.random()*10000);
}

function fmt(n){
  return Number(n||0).toLocaleString('en-IN', {maximumFractionDigits:2});
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  if(tab === 'billing') renderBillPicker();
  if(tab === 'history') renderHistory();
}

function refreshCategoryFilter(){
  const sel = document.getElementById('categoryFilter');
  const current = sel.value;
  const cats = Array.from(new Set(items.map(i=>i.category).filter(Boolean))).sort();
  sel.innerHTML = '<option value="">All categories</option>' +
    cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = cats.includes(current) ? current : '';
}

function renderInventory(){
  const search = document.getElementById('search').value.trim().toLowerCase();
  const catFilter = document.getElementById('categoryFilter').value;

  const filtered = items.filter(i=>{
    const matchesSearch = !search || i.name.toLowerCase().includes(search) || (i.sku||'').toLowerCase().includes(search);
    const matchesCat = !catFilter || i.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');

  if(filtered.length === 0){
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(i=>{
      const qty = Number(i.qty||0);
      const threshold = Number(i.threshold||0);
      const isLow = qty <= threshold;
      const value = qty * Number(i.price||0);
      return `
        <tr>
          <td>${escapeHtml(i.name)}</td>
          <td class="data-font">${escapeHtml(i.sku||'—')}</td>
          <td>${escapeHtml(i.category||'—')}</td>
          <td class="data-font ${isLow ? 'qty-low' : ''}">${fmt(qty)}</td>
          <td class="data-font">${fmt(i.price)}</td>
          <td class="data-font">${fmt(value)}</td>
          <td><span class="tag ${isLow ? 'low' : ''}">${isLow ? 'Low stock' : 'OK'}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn-outline btn-small" onclick="openEdit('${i.id}')">Edit</button>
              <button class="btn-danger btn-small" onclick="deleteItem('${i.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('statCount').textContent = items.length;
  document.getElementById('statUnits').textContent = fmt(items.reduce((s,i)=>s+Number(i.qty||0),0));
  document.getElementById('statValue').textContent = fmt(items.reduce((s,i)=>s+Number(i.qty||0)*Number(i.price||0),0));
  document.getElementById('statLow').textContent = items.filter(i=>Number(i.qty||0) <= Number(i.threshold||0)).length;

  refreshCategoryFilter();
}

function openAdd(){
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add item';
  document.getElementById('fName').value = '';
  document.getElementById('fSku').value = '';
  document.getElementById('fCategory').value = '';
  document.getElementById('fQty').value = '';
  document.getElementById('fPrice').value = '';
  document.getElementById('fThreshold').value = '';
  document.getElementById('modalBackdrop').classList.add('open');
  document.getElementById('fName').focus();
}

function openEdit(id){
  const item = items.find(i=>i.id===id);
  if(!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit item';
  document.getElementById('fName').value = item.name;
  document.getElementById('fSku').value = item.sku||'';
  document.getElementById('fCategory').value = item.category||'';
  document.getElementById('fQty').value = item.qty;
  document.getElementById('fPrice').value = item.price;
  document.getElementById('fThreshold').value = item.threshold;
  document.getElementById('modalBackdrop').classList.add('open');
}

function closeModal(){
  document.getElementById('modalBackdrop').classList.remove('open');
}

function saveItem(){
  const name = document.getElementById('fName').value.trim();
  if(!name){ alert('Item name is required.'); return; }
  const data = {
    name,
    sku: document.getElementById('fSku').value.trim(),
    category: document.getElementById('fCategory').value.trim(),
    qty: Number(document.getElementById('fQty').value) || 0,
    price: Number(document.getElementById('fPrice').value) || 0,
    threshold: Number(document.getElementById('fThreshold').value) || 0,
  };

  if(editingId){
    const idx = items.findIndex(i=>i.id===editingId);
    if(idx > -1) items[idx] = {...items[idx], ...data};
  } else {
    items.push({id: uid('it'), ...data});
  }

  saveItems();
  closeModal();
  renderInventory();
}

function deleteItem(id){
  const item = items.find(i=>i.id===id);
  if(!item) return;
  if(!confirm(`Delete "${item.name}" from inventory?`)) return;
  items = items.filter(i=>i.id!==id);
  saveItems();
  renderInventory();
}

function openSettings(){
  document.getElementById('sShopName').value = settings.shopName || '';
  document.getElementById('sAddress').value = settings.address || '';
  document.getElementById('sGst').value = settings.gst || '';
  document.getElementById('sPhone').value = settings.phone || '';
  document.getElementById('settingsBackdrop').classList.add('open');
}

function closeSettings(){
  document.getElementById('settingsBackdrop').classList.remove('open');
}

function saveSettingsForm(){
  settings = {
    shopName: document.getElementById('sShopName').value.trim(),
    address: document.getElementById('sAddress').value.trim(),
    gst: document.getElementById('sGst').value.trim(),
    phone: document.getElementById('sPhone').value.trim(),
  };
  saveSettings();
  closeSettings();
}

function renderBillPicker(){
  const search = document.getElementById('billSearch').value.trim().toLowerCase();
  const tbody = document.getElementById('billPickerBody');
  const emptyState = document.getElementById('billPickerEmpty');

  const filtered = items.filter(i=>{
    return !search || i.name.toLowerCase().includes(search) || (i.sku||'').toLowerCase().includes(search);
  });

  if(filtered.length === 0){
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(i=>{
      const qty = Number(i.qty||0);
      const outOfStock = qty <= 0;
      return `
        <tr>
          <td>${escapeHtml(i.name)}</td>
          <td class="data-font ${qty<=Number(i.threshold||0) ? 'qty-low' : ''}">${fmt(qty)}</td>
          <td class="data-font">${fmt(i.price)}</td>
          <td>
            <button class="btn-outline btn-small" ${outOfStock ? 'disabled title="Out of stock"' : ''} onclick="addToCart('${i.id}')">
              ${outOfStock ? 'Out of stock' : '+ Add'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function addToCart(itemId){
  const item = items.find(i=>i.id===itemId);
  if(!item) return;
  const existing = cart.find(c=>c.id===itemId);
  const currentCartQty = existing ? existing.qty : 0;

  if(currentCartQty + 1 > Number(item.qty||0)){
    alert(`Only ${item.qty} unit(s) of "${item.name}" in stock.`);
    return;
  }

  if(existing){
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: Number(item.price||0), qty: 1, availableQty: Number(item.qty||0) });
  }
  renderCart();
}

function changeCartQty(itemId, delta){
  const line = cart.find(c=>c.id===itemId);
  const item = items.find(i=>i.id===itemId);
  if(!line || !item) return;

  const newQty = line.qty + delta;
  if(newQty <= 0){
    cart = cart.filter(c=>c.id!==itemId);
  } else if(newQty > Number(item.qty||0)){
    alert(`Only ${item.qty} unit(s) of "${item.name}" in stock.`);
    return;
  } else {
    line.qty = newQty;
  }
  renderCart();
}

function removeFromCart(itemId){
  cart = cart.filter(c=>c.id!==itemId);
  renderCart();
}

function renderCart(){
  const tbody = document.getElementById('cartBody');
  const emptyState = document.getElementById('cartEmpty');

  if(cart.length === 0){
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    tbody.innerHTML = cart.map(c=>{
      const lineTotal = c.qty * c.price;
      return `
        <tr>
          <td>${escapeHtml(c.name)}</td>
          <td>
            <div class="qty-stepper">
              <button class="btn-outline btn-small" onclick="changeCartQty('${c.id}', -1)">−</button>
              <span class="data-font">${c.qty}</span>
              <button class="btn-outline btn-small" onclick="changeCartQty('${c.id}', 1)">+</button>
            </div>
          </td>
          <td class="data-font">${fmt(c.price)}</td>
          <td class="data-font">${fmt(lineTotal)}</td>
          <td><button class="btn-danger btn-small" onclick="removeFromCart('${c.id}')">✕</button></td>
        </tr>
      `;
    }).join('');
  }

  const total = cart.reduce((s,c)=>s + c.qty * c.price, 0);
  document.getElementById('cartTotal').textContent = '₹' + fmt(total);
}

function clearCart(){
  if(cart.length && !confirm('Clear the current bill?')) return;
  cart = [];
  document.getElementById('customerName').value = '';
  renderCart();
}

function completeSale(){
  if(cart.length === 0){ alert('Add at least one item to the bill first.'); return; }

  for(const line of cart){
    const item = items.find(i=>i.id===line.id);
    if(!item || Number(item.qty||0) < line.qty){
      alert(`Not enough stock for "${line.name}". Please adjust the bill.`);
      renderBillPicker();
      renderCart();
      return;
    }
  }

  cart.forEach(line=>{
    const item = items.find(i=>i.id===line.id);
    item.qty = Number(item.qty) - line.qty;
  });
  saveItems();

  const bill = {
    id: uid('bill'),
    number: bills.length + 1,
    date: new Date().toISOString(),
    customer: document.getElementById('customerName').value.trim() || 'Walk-in customer',
    payment: document.getElementById('paymentMode').value || 'Cash',
    lines: cart.map(c=>({ name:c.name, qty:c.qty, price:c.price })),
    total: cart.reduce((s,c)=>s + c.qty * c.price, 0)
  };
  bills.push(bill);
  saveBills();

  showReceipt(bill);

  cart = [];
  document.getElementById('customerName').value = '';
  document.getElementById('paymentMode').value = 'Cash';
  renderCart();
  renderInventory();
  renderBillPicker();
}

function showReceipt(bill){
  const content = document.getElementById('receiptContent');
  const shopName = settings.shopName || 'Your Shop Name';
  const metaLines = [];
  if(settings.address) metaLines.push(escapeHtml(settings.address));
  const gstPhoneParts = [];
  if(settings.gst) gstPhoneParts.push(`GSTIN: ${escapeHtml(settings.gst)}`);
  if(settings.phone) gstPhoneParts.push(`Ph: ${escapeHtml(settings.phone)}`);
  if(gstPhoneParts.length) metaLines.push(gstPhoneParts.join(' &nbsp;·&nbsp; '));

  const totalItems = bill.lines.reduce((s,l)=>s + l.qty, 0);

  content.innerHTML = `
    <div class="receipt-inner">
      <div class="r-shopname">${escapeHtml(shopName)}</div>
      ${metaLines.length ? `<div class="r-shopmeta">${metaLines.join('<br>')}</div>` : ''}
      <hr class="r-divider">
      <div class="r-meta-row"><span>Bill No.</span><strong>#${bill.number}</strong></div>
      <div class="r-meta-row"><span>Date</span><strong>${new Date(bill.date).toLocaleString('en-IN')}</strong></div>
      <div class="r-meta-row"><span>Customer</span><strong>${escapeHtml(bill.customer)}</strong></div>
      <div class="r-meta-row"><span>Payment mode</span><strong>${escapeHtml(bill.payment || 'Cash')}</strong></div>
      <table>
        <thead><tr><th>Item</th><th class="r-col-qty">Qty</th><th class="r-col-amt">Amount</th></tr></thead>
        <tbody>
          ${bill.lines.map(l=>`
            <tr>
              <td>${escapeHtml(l.name)}</td>
              <td class="r-col-qty">${l.qty}</td>
              <td class="r-col-amt">${fmt(l.qty*l.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="r-total"><span>Total (${totalItems} item${totalItems===1?'':'s'})</span><span class="data-font">₹${fmt(bill.total)}</span></div>
      <div class="r-thanks">Thank you for shopping with us!</div>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="document.getElementById('receiptBackdrop').classList.remove('open')">Close</button>
      <button class="btn-primary" onclick="window.print()">Print invoice</button>
    </div>
  `;
  document.getElementById('receiptBackdrop').classList.add('open');
}

function renderHistory(){
  const tbody = document.getElementById('historyBody');
  const emptyState = document.getElementById('historyEmpty');

  if(bills.length === 0){
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = bills.slice().reverse().map(b=>`
    <tr>
      <td class="data-font">#${b.number}</td>
      <td class="data-font">${new Date(b.date).toLocaleString()}</td>
      <td>${escapeHtml(b.customer)}</td>
      <td>${b.lines.length}</td>
      <td class="data-font">${fmt(b.total)}</td>
      <td><button class="btn-outline btn-small" onclick='showReceipt(${JSON.stringify(b).replace(/'/g,"&#39;")})'>View</button></td>
    </tr>
  `).join('');
}

function exportBackup(){
  const payload = { items, bills, settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory-backup-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importBackup(file){
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      const parsed = JSON.parse(e.target.result);
      const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
      const rawBills = Array.isArray(parsed) ? [] : (parsed.bills || []);
      const rawSettings = Array.isArray(parsed) ? null : (parsed.settings || null);

      const withIds = rawItems.map(i => ({ id: i.id || uid('it'), name: i.name||'Unnamed', sku:i.sku||'', category:i.category||'', qty:Number(i.qty)||0, price:Number(i.price)||0, threshold:Number(i.threshold)||0 }));

      if(!confirm(`Import ${withIds.length} item(s) and ${rawBills.length} bill(s)? This will replace your current data on this device.`)) return;

      items = withIds;
      bills = rawBills;
      if(rawSettings) settings = { shopName:'', address:'', gst:'', phone:'', ...rawSettings };
      saveItems();
      saveBills();
      if(rawSettings) saveSettings();
      renderInventory();
      renderBillPicker();
      renderHistory();
    }catch(err){
      alert('Could not read that file. Make sure it is a backup exported from this app.');
    }
  };
  reader.readAsText(file);
}

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>switchTab(btn.dataset.tab));
});

document.getElementById('addBtn').addEventListener('click', openAdd);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', saveItem);
document.getElementById('modalBackdrop').addEventListener('click', (e)=>{ if(e.target.id==='modalBackdrop') closeModal(); });
document.getElementById('search').addEventListener('input', renderInventory);
document.getElementById('categoryFilter').addEventListener('change', renderInventory);

document.getElementById('billSearch').addEventListener('input', renderBillPicker);
document.getElementById('clearCartBtn').addEventListener('click', clearCart);
document.getElementById('completeSaleBtn').addEventListener('click', completeSale);
document.getElementById('receiptBackdrop').addEventListener('click', (e)=>{ if(e.target.id==='receiptBackdrop') e.target.classList.remove('open'); });

document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('settingsCancelBtn').addEventListener('click', closeSettings);
document.getElementById('settingsSaveBtn').addEventListener('click', saveSettingsForm);
document.getElementById('settingsBackdrop').addEventListener('click', (e)=>{ if(e.target.id==='settingsBackdrop') closeSettings(); });

document.getElementById('exportBtn').addEventListener('click', exportBackup);
document.getElementById('importBtn').addEventListener('click', ()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', (e)=>{
  if(e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = '';
});

loadSettings();
loadItems();
loadBills();
renderInventory();
renderBillPicker();