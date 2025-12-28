function setYear(){
  const el = document.getElementById('year');
  if(!el) return;
  el.textContent = '2025';
}

async function loadPage(name, push=true){
  const main = document.getElementById('main-content');
  try{
    const res = await fetch(`pages/${name}.html`);
    if(!res.ok) throw new Error('Not found');
    const html = await res.text();
    main.innerHTML = html;
    main.focus();
    // initialize any carousels present in the loaded content
    if(window.Carousel){
      const carousels = main.querySelectorAll('.carousel');
      carousels.forEach(el => {
        try{
          if(!el._carouselInstance) el._carouselInstance = new Carousel(el, {autoplay:true, interval:3000});
        }catch(e){ console.warn('Carousel init failed', e); }
      });
    }
    if(push) history.pushState({page:name}, '', name==='home' ? '/' : `/${name}`);
  }catch(err){
    main.innerHTML = `<div class="page"><h2>Page not found</h2><p>Could not load '${name}'.</p></div>`;
  }
}

function linkHandler(e){
  const a = e.target.closest('a[data-page]');
  if(!a) return;
  e.preventDefault();
  const page = a.getAttribute('data-page');
  loadPage(page);
}

window.addEventListener('popstate', (ev)=>{
  const state = ev.state && ev.state.page ? ev.state.page : 'home';
  loadPage(state, false);
});

document.addEventListener('DOMContentLoaded', ()=>{
  setYear();
  document.body.addEventListener('click', linkHandler);
  // initial load: check path
  const raw = window.location.pathname.replace(/^\/+/, '');
  let name = 'home';
  if(raw && raw !== 'index.html'){
    const first = raw.split('/')[0];
    // if it looks like a filename (has a dot) or a Windows drive, default to home
    if(!first.includes('.') && !first.includes(':')){
      name = first || 'home';
    }
  }
  loadPage(name, false);
});
