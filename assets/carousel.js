/*
 Carousel.js — simple reusable carousel that supports images and videos
 Usage:
  - Markup approach:
      <div id="myCarousel" class="carousel">
        <div class="carousel-slide" data-type="image" data-src="assets/images/slide1.jpg"></div>
        <div class="carousel-slide" data-type="video" data-src="assets/videos/clip.mp4" data-poster="assets/images/clip-poster.jpg"></div>
      </div>
    const c = new Carousel(document.getElementById('myCarousel'), {autoplay:true, interval:5000});

  - JS slides approach:
    const c = new Carousel(container, {slides:[{type:'image', src:'...'}, {type:'video', src:'...'}]});

 Features:
  - Prev/Next controls and indicators
  - Autoplay with pause on hover
  - Supports inline images and <video> elements (paused when not active)
  - Keyboard left/right navigation
  - API: next(), prev(), goTo(index), play(), pause()
*/
(function(window){
  class Carousel {
    constructor(container, options = {}){
      if(!container) throw new Error('Carousel: container required');
      this.container = container;
      this.options = Object.assign({autoplay:true, interval:5000, indicators:true, controls:true}, options);
      this.slides = [];
      this.current = 0;
      this.timer = null;
      this._build();
      this._bind();
      if(this.options.autoplay) this.play();
    }

    _build(){
      // create wrapper
      this.container.classList.add('carousel-wrapper');
      // read slides from DOM or options
      const existing = Array.from(this.container.querySelectorAll('.carousel-slide'));
      if(existing.length){
        this.slides = existing.map(el => this._normalizeSlideFromNode(el));
      } else if(Array.isArray(this.options.slides)){
        this.slides = this.options.slides.map(s => this._normalizeSlideFromData(s));
        // render slides
        this.container.innerHTML = '';
        this.slides.forEach(s => this.container.appendChild(this._renderSlideNode(s)));
      }

      // wrap slides in inner container
      const slides = Array.from(this.container.querySelectorAll('.carousel-slide'));
      this.slidesNodes = slides;
      slides.forEach((el, i)=>{
        el.dataset.index = i;
        el.classList.toggle('active', i===0);
      });

      // controls
      if(this.options.controls){
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'carousel-prev';
        this.prevBtn.setAttribute('aria-label','Previous slide');
        this.prevBtn.innerHTML = '‹';
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'carousel-next';
        this.nextBtn.setAttribute('aria-label','Next slide');
        this.nextBtn.innerHTML = '›';
        this.container.appendChild(this.prevBtn);
        this.container.appendChild(this.nextBtn);
      }

      // indicators
      if(this.options.indicators){
        this.indicatorWrap = document.createElement('div');
        this.indicatorWrap.className = 'carousel-indicators';
        this.slides.forEach((_, i)=>{
          const b = document.createElement('button');
          b.className = 'carousel-indicator';
          b.setAttribute('aria-label', `Go to slide ${i+1}`);
          b.dataset.index = i;
          if(i===0) b.classList.add('active');
          this.indicatorWrap.appendChild(b);
        });
        this.container.appendChild(this.indicatorWrap);
      }
    }

    _normalizeSlideFromNode(node){
      const type = node.dataset.type || (node.querySelector('video') ? 'video' : 'image');
      const src = node.dataset.src || (node.querySelector('img') && node.querySelector('img').src) || '';
      const poster = node.dataset.poster || (node.querySelector('video') && node.querySelector('video').poster) || '';
      return {type, src, poster, node};
    }

    _normalizeSlideFromData(data){
      return {type: data.type || 'image', src: data.src || '', poster: data.poster || '', node: null};
    }

    _renderSlideNode(s){
      const el = document.createElement('div');
      el.className = 'carousel-slide';
      if(s.type === 'video'){
        const v = document.createElement('video');
        v.src = s.src;
        if(s.poster) v.poster = s.poster;
        v.playsInline = true;
        v.setAttribute('preload','metadata');
        v.controls = false;
        v.muted = true; // keep muted so it can autoplay if desired
        v.setAttribute('playsinline','');
        el.appendChild(v);
      }else{
        const img = document.createElement('img');
        img.src = s.src;
        img.alt = s.alt || '';
        el.appendChild(img);
      }
      return el;
    }

    _bind(){
      // clicks
      if(this.prevBtn) this.prevBtn.addEventListener('click', ()=>{ this.prev(); });
      if(this.nextBtn) this.nextBtn.addEventListener('click', ()=>{ this.next(); });
      if(this.indicatorWrap){
        this.indicatorWrap.addEventListener('click', (e)=>{
          const b = e.target.closest('button.carousel-indicator');
          if(!b) return;
          const idx = Number(b.dataset.index);
          this.goTo(idx);
        });
      }

      // pause on hover
      this.container.addEventListener('mouseenter', ()=> this.pause());
      this.container.addEventListener('mouseleave', ()=> { if(this.options.autoplay) this.play(); });

      // keyboard
      this._keyHandler = (e)=>{
        if(e.key === 'ArrowLeft') this.prev();
        if(e.key === 'ArrowRight') this.next();
      };
      this.container.addEventListener('focusin', ()=> window.addEventListener('keydown', this._keyHandler));
      this.container.addEventListener('focusout', ()=> window.removeEventListener('keydown', this._keyHandler));

      // ensure videos pause when not active
      this.container.addEventListener('transitionend', ()=> this._pauseAllVideosExcept(this.current));
    }

    _pauseAllVideosExcept(index){
      this.slidesNodes.forEach((node, i)=>{
        const v = node.querySelector('video');
        if(v){
          if(i === index){
            // optionally play when active
            if(this.options.playVideoOnActive) v.play().catch(()=>{});
          }else{
            v.pause();
            try{ v.currentTime = 0; }catch(e){}
          }
        }
      });
    }

    next(){
      const next = (this.current + 1) % this.slidesNodes.length;
      this.goTo(next);
    }
    prev(){
      const prev = (this.current - 1 + this.slidesNodes.length) % this.slidesNodes.length;
      this.goTo(prev);
    }
    goTo(index){
      if(index === this.current) return;
      const old = this.slidesNodes[this.current];
      const next = this.slidesNodes[index];
      if(!next) return;
      old.classList.remove('active');
      next.classList.add('active');
      // update indicators
      if(this.indicatorWrap){
        const prevBtn = this.indicatorWrap.querySelector('button.active');
        if(prevBtn) prevBtn.classList.remove('active');
        const newBtn = this.indicatorWrap.querySelector(`button[data-index=\"${index}\"]`);
        if(newBtn) newBtn.classList.add('active');
      }
      this.current = index;
      this._pauseAllVideosExcept(index);
      // reset autoplay timer
      if(this.options.autoplay){
        this.pause();
        this.play();
      }
    }

    play(){
      if(this.timer) return;
      this.timer = setInterval(()=> this.next(), this.options.interval);
    }
    pause(){
      if(this.timer){
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    // helper to add slides dynamically
    addSlides(slides){
      slides.forEach(s=>{
        const normalized = this._normalizeSlideFromData(s);
        const node = this._renderSlideNode(normalized);
        this.container.querySelector('.columns-inner') ? this.container.querySelector('.columns-inner').appendChild(node) : this.container.appendChild(node);
        this.slides.push(normalized);
      });
      // refresh internal nodes
      this.slidesNodes = Array.from(this.container.querySelectorAll('.carousel-slide'));
    }
  }

  window.Carousel = Carousel;
})(window);
