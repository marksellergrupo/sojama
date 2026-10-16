const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu móvel
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
function alternarMenu(abrir) {
  const aberto = abrir ?? !menu.classList.contains('aberto');
  menu.classList.toggle('aberto', aberto);
  burger.classList.toggle('x', aberto);
  burger.setAttribute('aria-expanded', aberto);
  document.body.classList.toggle('menu-aberto', aberto);
}
burger?.addEventListener('click', () => alternarMenu());
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => alternarMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') alternarMenu(false); });
addEventListener('resize', () => { if (innerWidth > 960) alternarMenu(false); });

// Cabeçalho, barra de progresso e parallax
const header = document.querySelector('header.site');
const barra = document.querySelector('.progress');
const paralax = [...document.querySelectorAll('[data-vel]')];
const imgPar = [...document.querySelectorAll('img[data-par]')];
let tick = false;
function aoRolar() {
  const y = scrollY;
  header?.classList.toggle('rolou', y > 20);
  const max = document.documentElement.scrollHeight - innerHeight;
  if (barra) barra.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (!reduz) paralax.forEach(el => { el.style.transform = `translate3d(0,${y * parseFloat(el.dataset.vel)}px,0)`; });
  if (!reduz) imgPar.forEach(im => {
    const r = im.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const max = Math.max(0, (im.offsetHeight - im.parentElement.clientHeight) / 2);
    const d = Math.max(-max, Math.min(max, (r.top + r.height / 2 - innerHeight / 2) * parseFloat(im.dataset.par)));
    im.style.transform = `translate3d(0,${(-d).toFixed(1)}px,0)`;
  });
  tick = false;
}
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(aoRolar); } }, { passive: true });
aoRolar();

// Revelar elementos ao rolar
const io = new IntersectionObserver((entradas) => {
  entradas.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.rv, .rv-l, .rv-img').forEach(el => io.observe(el));

// Números animados
function contar(el) {
  const fim = parseFloat(el.dataset.to);
  const suf = el.dataset.suf || '';
  if (reduz) { el.textContent = fim + suf; return; }
  const dur = 2000, t0 = performance.now();
  const f = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    el.textContent = Math.round(fim * e) + suf;
    if (p < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
const ioNum = new IntersectionObserver((entradas) => {
  entradas.forEach(e => { if (e.isIntersecting) { contar(e.target); ioNum.unobserve(e.target); } });
}, { threshold: .6 });
document.querySelectorAll('.conta').forEach(el => ioNum.observe(el));

// Botões magnéticos (fora do hero)
if (!reduz && matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('.btn, .pill').forEach(b => {
    if (b.closest('.hero')) return;
    b.addEventListener('mousemove', (ev) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(ev.clientX - r.left - r.width / 2) * .22}px,${(ev.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; b.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; });
    b.addEventListener('mouseenter', () => { b.style.transition = 'background .3s,color .3s,box-shadow .3s'; });
  });
}

// Transição suave entre páginas
document.querySelectorAll('a[href]').forEach(a => {
  const h = a.getAttribute('href');
  if (!h || h.startsWith('#') || h.startsWith('http') || h.startsWith('mailto') || h.startsWith('tel') || a.target) return;
  a.addEventListener('click', (ev) => {
    if (ev.metaKey || ev.ctrlKey || reduz) return;
    ev.preventDefault();
    document.body.classList.add('sai');
    setTimeout(() => { location.href = h; }, 240);
  });
});
addEventListener('pageshow', () => document.body.classList.remove('sai'));

// Formulário de contacto -> email
document.getElementById('form-contacto')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const corpo = `Nome: ${f.get('nome')}\nTelefone: ${f.get('telefone')}\nServiço: ${f.get('servico')}\n\n${f.get('mensagem')}`;
  location.href = `mailto:geral@sojama.co?subject=${encodeURIComponent('Pedido de proposta - ' + f.get('servico'))}&body=${encodeURIComponent(corpo)}`;
});

// Slideshow do hero
const sl = document.querySelector('.slider');
if (sl) {
  const slides = [...sl.querySelectorAll('.slide')];
  const dots = [...sl.querySelectorAll('.sl-dots button')];
  const cont = sl.querySelector('.sl-count');
  const n = slides.length, DUR = 6500;
  let i = 0, timer;
  const tocar = () => {
    clearTimeout(timer);
    sl.classList.remove('corre'); void sl.offsetWidth;
    if (reduz || document.hidden) return;
    sl.classList.add('corre');
    timer = setTimeout(() => ir(i + 1), DUR);
  };
  function ir(k) {
    slides[i].classList.remove('on'); dots[i].classList.remove('on');
    i = (k + n) % n;
    slides[i].classList.add('on'); dots[i].classList.add('on');
    cont.textContent = `0${i + 1} / 0${n}`;
    tocar();
  }
  sl.querySelector('.sl-next').addEventListener('click', () => ir(i + 1));
  sl.querySelector('.sl-prev').addEventListener('click', () => ir(i - 1));
  dots.forEach((d, k) => d.addEventListener('click', () => ir(k)));
  let x0 = null;
  sl.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  sl.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1));
  });
  sl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ir(i + 1); if (e.key === 'ArrowLeft') ir(i - 1); });
  document.addEventListener('visibilitychange', tocar);
  tocar();
}
