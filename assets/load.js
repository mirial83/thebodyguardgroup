function setYear(){
  const el = document.getElementById('year');
  if(!el) return;
  el.textContent = '2025';
}

async function loadPage(name){
  const main = document.getElementById('main-content');
  if(!main) return;
  try{
    const url = new URL(`pages/${name}.html`, location.href).href;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Not found');
    const html = await res.text();
    // ensure main is visible (defensive)
    main.style.display = '';
    main.innerHTML = html;
    // move focus for accessibility
    try{ main.focus(); }catch(e){}
    // initialize any carousels present in the loaded content
    if(window.Carousel){
      const carousels = main.querySelectorAll('.carousel');
      carousels.forEach(el => {
        try{
          if(!el._carouselInstance) el._carouselInstance = new Carousel(el, {autoplay:true, interval:3000});
        }catch(e){ console.warn('Carousel init failed', e); }
      });
    }
  }catch(err){
    main.innerHTML = `<div class="page"><h2>Page not found</h2><p>Could not load '${name}'.</p></div>`;
  }
}

function linkHandler(e){
  const a = e.target.closest('a[data-page]');
  if(!a) return;
  e.preventDefault();
  const page = a.getAttribute('data-page');
  // use hash routing so GitHub Pages serves index/404 without server rewrites
  if(!page || page === 'home'){
    location.hash = '';
  }else{
    location.hash = page.startsWith('#') ? page : `#${page}`;
  }
}

// use hashchange for navigation (compatible with GitHub Pages)
window.addEventListener('hashchange', ()=>{
  const raw = location.hash.replace(/^#\/?/, '');
  const name = raw || 'home';
  loadPage(name);
});

document.addEventListener('DOMContentLoaded', ()=>{
  setYear();
  document.body.addEventListener('click', linkHandler);
  // initial load: prefer hash, fallback to root path
  const rawHash = location.hash.replace(/^#\/?/, '');
  if(rawHash){
    loadPage(rawHash);
    return;
  }
  // fallback to pathname (useful for local dev and project pages)
  const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
  let name = 'home';
  if(rawPath && rawPath !== 'index.html'){
    const first = rawPath.split('/')[0];
    if(!first.includes('.') && !first.includes(':')){
      name = first || 'home';
    }
  }
  // Try fetching the candidate page first; if it doesn't exist, fall back to 'home'.
  (async ()=>{
    try{
      const candidateUrl = new URL(`pages/${name}.html`, location.href).href;
      const r = await fetch(candidateUrl, {method:'GET'});
      if(r.ok){
        loadPage(name);
        return;
      }
    }catch(e){
        // initial load: prefer hash; otherwise always load 'home'
        if(rawHash){
          loadPage(rawHash);
        } else {
          loadPage('home');
        }
