// Utility
const $ = (q,ctx=document)=>ctx.querySelector(q);
const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));
const formatIDR = n => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR'}).format(n);

// Demo products
const PRODUCTS = [
  {id:'pen-gel', name:'Pulpen Gel 0.5mm', price:8000, tag:'baru', rating:4.8},
  {id:'notebook-grid', name:'Notebook Grid A5', price:32000, tag:'populer', rating:4.9},
  {id:'marker-pastel', name:'Highlighter Pastel (6pcs)', price:45000, tag:'promo', rating:4.7},
  {id:'sticky-cute', name:'Sticky Notes Lucu', price:12000, tag:'baru', rating:4.6},
  {id:'pencil-mech', name:'Pensil Mekanik 0.7', price:15000, tag:'populer', rating:4.8},
  {id:'washi', name:'Washi Tape Set', price:28000, tag:'favorit', rating:4.9},
  {id:'eraser-soft', name:'Penghapus Soft', price:6000, tag:'murah', rating:4.5},
  {id:'ruler', name:'Penggaris 30cm', price:7000, tag:'murah', rating:4.4},
];

// Local storage
const storage = {
  get(){ try { return JSON.parse(localStorage.getItem('gs_cart')||'{}') } catch { return {} } },
  set(data){ localStorage.setItem('gs_cart', JSON.stringify(data)); }
};

// Theme toggle
(() => {
  const btn = $('#themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('gs_theme');
  if(saved){ document.documentElement.classList.toggle('dark', saved==='dark'); }
  else { document.documentElement.classList.toggle('dark', prefersDark); }

  btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('gs_theme', isDark?'dark':'light');
    toast(isDark?'Mode gelap aktif 🌙':'Mode terang aktif ☀️');
  });
})();

// Year
$('#year').textContent = new Date().getFullYear();

// Toast
let toastTimer;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

// Build product cards with canvas placeholders
function drawCanvasThumb(canvas, seed){
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;
  // bg gradient
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#ff9ec9');
  g.addColorStop(1,'#ffd166');
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  // doodles
  ctx.globalAlpha = .18;
  ctx.fillStyle = '#231b2c';
  for(let i=0;i<8;i++){
    const x = (Math.sin(seed+i)*.5+.5)*w;
    const y = (Math.cos(seed*1.3+i)*.5+.5)*h;
    const r = 16 + ((i*13+seed)%24);
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // foreground icon
  ctx.fillStyle = '#231b2c';
  ctx.font = '700 28px Poppins';
  ctx.fillText('✎', 24, 42);
}

// State
let cart = storage.get();
updateCartCount();

// Render products
const grid = $('#productGrid');
function renderProducts(list){
  grid.innerHTML = '';
  list.forEach((p, idx)=>{
    const card = document.createElement('article');
    card.className = 'product-card reveal';
    card.innerHTML = `
      <div class="p-media"><canvas></canvas></div>
      <div class="p-body">
        <div class="badge">${p.tag}</div>
        <h4>${p.name}</h4>
        <div class="price">
          <strong>${formatIDR(p.price)}</strong>
          <span class="muted">★ ${p.rating.toFixed(1)}</span>
        </div>
        <div class="p-actions">
          <div class="qty" aria-label="Atur jumlah">
            <button class="minus" aria-label="Kurangi">−</button>
            <input type="number" min="1" value="1" aria-label="Jumlah"/>
            <button class="plus" aria-label="Tambah">+</button>
          </div>
          <button class="btn secondary add">Tambah</button>
        </div>
      </div>`;
    grid.appendChild(card);
    const canvas = $('canvas', card);
    requestAnimationFrame(()=>drawCanvasThumb(canvas, idx+Math.random()*10));
    const minus = $('.minus', card), plus = $('.plus', card), qty = $('input', card), add = $('.add', card);
    minus.addEventListener('click', ()=> qty.value = Math.max(1, Number(qty.value)-1));
    plus.addEventListener('click', ()=> qty.value = Number(qty.value)+1);
    add.addEventListener('click', ()=> addToCart(p.id, Number(qty.value)));
  });
}
renderProducts(PRODUCTS);

// Filters
$('#search').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
  renderProducts(filtered);
});
$('#sort').addEventListener('change', e=>{
  const v = e.target.value;
  let arr = [...PRODUCTS];
  if(v==='murah') arr.sort((a,b)=>a.price-b.price);
  if(v==='mahal') arr.sort((a,b)=>b.price-a.price);
  if(v==='baru') arr.reverse();
  renderProducts(arr);
});

// Cart logic
function addToCart(id, qty=1){
  cart[id] = (cart[id]||0) + qty;
  storage.set(cart);
  updateCartCount();
  toast('Ditambahkan ke keranjang 🛒');
  openCart();
  renderCart();
}
function removeFromCart(id){
  delete cart[id];
  storage.set(cart);
  updateCartCount();
  renderCart();
}
function setQty(id, qty){
  if(qty<=0){ removeFromCart(id); return; }
  cart[id] = qty;
  storage.set(cart);
  updateCartCount();
  renderCart();
}
function updateCartCount(){
  const n = Object.values(cart).reduce((a,b)=>a+b,0);
  $('#cartCount').textContent = n;
}
function cartEntries(){
  return Object.entries(cart).map(([id, qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return {...p, qty, line: p.price*qty};
  });
}
function cartTotal(){
  return cartEntries().reduce((a,b)=>a+b.line, 0);
}
function renderCart(){
  const wrap = $('#cartItems');
  wrap.innerHTML = '';
  const entries = cartEntries();
  if(entries.length===0){
    wrap.innerHTML = '<p class="muted">Keranjang masih kosong.</p>';
  } else {
    entries.forEach(it=>{
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="thumb" aria-hidden="true"></div>
        <div class="meta">
          <strong>${it.name}</strong>
          <span class="muted">${formatIDR(it.price)} × </span>
        </div>
        <div class="actions">
          <input type="number" min="1" value="${it.qty}" aria-label="Jumlah">
          <button class="btn ghost remove" aria-label="Hapus">🗑</button>
        </div>`;
      const qtyInput = $('input', row);
      qtyInput.addEventListener('change', ()=> setQty(it.id, Number(qtyInput.value)));
      $('.remove', row).addEventListener('click', ()=> removeFromCart(it.id));
      wrap.appendChild(row);
    });
  }
  $('#cartTotal').textContent = formatIDR(cartTotal());
}

// Drawer controls
const drawer = $('#cartDrawer');
const overlay = $('#overlay');
function openCart(){
  drawer.classList.add('open');
  overlay.classList.add('show');
  drawer.setAttribute('aria-hidden','false');
}
function closeCart(){
  drawer.classList.remove('open');
  overlay.classList.remove('show');
  drawer.setAttribute('aria-hidden','true');
}
$('#openCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', ()=>{
  if(drawer.classList.contains('open')) closeCart();
});

// Checkout
const checkoutModal = $('#checkoutModal');
$('#checkoutBtn').addEventListener('click', ()=>{
  if(cartEntries().length===0){ toast('Keranjang kosong. Tambahkan produk dulu ya!'); return; }
  checkoutModal.showModal();
  closeCart();
});
$('#closeCheckout').addEventListener('click', ()=>checkoutModal.close());
$('#checkoutForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const order = { items: cartEntries(), total: cartTotal(), customer: data, at: new Date().toISOString() };
  console.log('Order (demo):', order);
  toast('Pesanan diterima! (demo)');
  cart = {};
  storage.set(cart);
  updateCartCount();
  renderCart();
  e.target.reset();
  checkoutModal.close();
});

// Contact form (demo)
$('#contactForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  toast('Pesan terkirim! (demo)');
  e.target.reset();
});

// Slider
(function(){
  const slider = $('#slider');
  const dots = $$('.dot');
  let index = 0, timer;
  function go(i){
    index = i;
    slider.style.transform = `translateX(-${i*100}%)`;
    dots.forEach((d,idx)=>d.classList.toggle('active', idx===i));
  }
  function next(){ go((index+1)%3); }
  dots.forEach((d,idx)=> d.addEventListener('click', ()=>{ go(idx); reset(); }));
  function reset(){
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }
  reset();
})();

// Reveal on scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.style.animationDelay = (Math.random()*0.25)+'s'; e.target.classList.add('reveal'); io.unobserve(e.target); }
  })
},{threshold:.08});
$$('.product-card').forEach(el=>io.observe(el));

// Initial
renderCart();
