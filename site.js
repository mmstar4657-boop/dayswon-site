(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* header, progress bar */
  var bar = document.getElementById('top-bar');
  var prog = document.getElementById('progress');
  function onScroll(){
    var y = window.scrollY || root.scrollTop;
    if(bar) bar.classList.toggle('scrolled', y > 40);
    if(prog){
      var max = root.scrollHeight - root.clientHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* mobile menu */
  var mb = document.getElementById('menu-btn');
  if(mb && bar){
    mb.addEventListener('click', function(){
      var open = !bar.classList.contains('nav-open');
      bar.classList.toggle('nav-open', open);
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  /* motion off for visitors who ask for reduced motion */
  var typing = true;
  function stopMotion(){
    root.classList.add('anim-paused');
    document.querySelectorAll('svg').forEach(function(s){ try{ s.pauseAnimations(); }catch(e){} });
    typing = false;
  }

  /* typewriter (home only) */
  var el = document.getElementById('type');
  var words = ['focus on growth', 'serve clients better', 'make faster decisions'];
  var wi = 0, ci = words[0].length, deleting = true;
  function tick(){
    if(!typing) return;
    var w = words[wi];
    if(deleting){
      ci--; el.textContent = w.slice(0, ci);
      if(ci <= 0){ deleting = false; wi = (wi + 1) % words.length; }
      setTimeout(tick, 45);
    } else {
      var nw = words[wi]; ci++; el.textContent = nw.slice(0, ci);
      if(ci >= nw.length){ deleting = true; setTimeout(tick, 1800); return; }
      setTimeout(tick, 80);
    }
  }
  if(reduce){ stopMotion(); } else if(el){ setTimeout(tick, 2200); }

  /* FAQ accordion */
  document.querySelectorAll('.qa button').forEach(function(b){
    b.addEventListener('click', function(){
      var item = b.parentElement, open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* automation flow demo (Dashboards & automations page) */
  var flow = document.getElementById('flow');
  if(flow && !reduce){
    var fnodes = flow.querySelectorAll('.fnode'), ffill = flow.querySelector('.flow-fill'), k = -1;
    flow.classList.add('flow-anim');
    var fstep = function(){
      k++;
      if(k >= fnodes.length){
        k = -1;
        fnodes.forEach(function(n){ n.classList.remove('on'); });
        ffill.style.width = '0%';
        setTimeout(fstep, 700); return;
      }
      fnodes[k].classList.add('on');
      ffill.style.width = (fnodes.length > 1 ? (k / (fnodes.length - 1)) * 100 : 100) + '%';
      setTimeout(fstep, k === fnodes.length - 1 ? 2400 : 1100);
    };
    setTimeout(fstep, 700);
  }

  /* GSAP motion */
  if(!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('gsap-on');

  function split(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(n){
      if(n.nodeType === 3){
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function(part){
          if(!part) return;
          if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = part; frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else if(n.nodeType === 1){ split(n); }
    });
  }

  // hero entrance (every page)
  var h = document.querySelector('.split');
  if(h){
    var heroEl = h.closest('.hero, .page-hero, .call');
    split(h);
    var tl = gsap.timeline({defaults:{ease:'power3.out'}});
    var chip = heroEl.querySelector('.chip, .label');
    if(chip) tl.from(chip, {y:16, opacity:0, duration:.6, clearProps:'transform,opacity'});
    tl.from(h.querySelectorAll('.w'), {y:42, opacity:0, duration:.8, stagger:.04}, chip ? '-=.3' : 0);
    var rest = heroEl.querySelectorAll('.hero-copy > .lede, .typeline, .hero-actions > *, .hero-copy .actions > *');
    if(rest.length) tl.from(rest, {y:18, opacity:0, duration:.6, stagger:.1, clearProps:'transform,opacity'}, '-=.5');
    var art = heroEl.querySelector('.hero-art');
    if(art){
      tl.from(art, {opacity:0, scale:1.08, duration:1.8, ease:'power2.out'}, 0);
      gsap.to(art, {yPercent:14, ease:'none', scrollTrigger:{trigger:heroEl, start:'top top', end:'bottom top', scrub:true}});
    }
    var inner = heroEl.querySelector('.hero-inner');
    if(inner) gsap.to(inner, {yPercent:-16, opacity:.25, ease:'none', scrollTrigger:{trigger:heroEl, start:'top top', end:'bottom top', scrub:true}});
  }

  // scroll reveals
  gsap.utils.toArray('.reveal').forEach(function(r){
    gsap.from(r, {y:40, opacity:0, duration:.9, ease:'power3.out', clearProps:'transform,opacity', scrollTrigger:{trigger:r, start:'top 88%', once:true}});
  });
  gsap.utils.toArray('[data-stagger]').forEach(function(g){
    gsap.from(g.children, {y:34, opacity:0, duration:.75, stagger:.1, ease:'power3.out', clearProps:'transform,opacity', scrollTrigger:{trigger:g, start:'top 85%', once:true}});
  });

  // illustrations: draw lines, pop shapes, grow bars, sweep magnifier
  gsap.utils.toArray('.ill').forEach(function(ill){
    var draws = Array.prototype.filter.call(ill.querySelectorAll('.draw'), function(p){ return !p.getAttribute('stroke-dasharray'); });
    draws.forEach(function(p){ try{ var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; }catch(e){} });
    var t = gsap.timeline({paused:true});
    var pops = ill.querySelectorAll('.pop'); if(pops.length) t.from(pops, {scale:.7, opacity:0, transformOrigin:'50% 50%', duration:.6, stagger:.08, ease:'back.out(1.7)'});
    if(draws.length) t.to(draws, {strokeDashoffset:0, duration:1.1, stagger:.12, ease:'power2.out'}, .1);
    var bars = ill.querySelectorAll('.bar'); if(bars.length) t.from(bars, {scaleY:0, transformOrigin:'50% 100%', duration:.9, stagger:.1, ease:'power3.out'}, .1);
    var mag = ill.querySelector('.mag'); if(mag) t.from(mag, {x:-150, duration:1.2, ease:'power3.inOut'}, 0);
    var hand = ill.querySelector('.hand'); if(hand) gsap.to(hand, {rotation:360, svgOrigin:'322 124', duration:6, repeat:-1, ease:'none'});
    ScrollTrigger.create({trigger:ill, start:'top 82%', once:true, onEnter:function(){ t.play(); }});
  });

  // timeline (How we work)
  if(document.querySelector('.tl')){
    gsap.to('.tl-fill', {scaleY:1, ease:'none', scrollTrigger:{trigger:'.tl', start:'top 65%', end:'bottom 65%', scrub:.4}});
    gsap.utils.toArray('.tl-step').forEach(function(s){
      ScrollTrigger.create({trigger:s, start:'top 65%', onEnter:function(){ s.classList.add('on'); }, onLeaveBack:function(){ s.classList.remove('on'); }});
    });
  }

  // call agenda ticks (Contact)
  var agenda = document.getElementById('agenda');
  if(agenda){
    gsap.from(agenda.querySelectorAll('li'), {x:30, opacity:0, duration:.6, stagger:.25, ease:'power3.out', delay:.4, clearProps:'transform,opacity'});
    gsap.from(agenda.querySelectorAll('.tick'), {scale:0, duration:.45, stagger:.25, delay:.75, ease:'back.out(2)'});
  }

  // count-up numbers and growing bars (dashboard mockups)
  gsap.utils.toArray('[data-count]').forEach(function(c){
    var end = +c.getAttribute('data-count'), pre = c.getAttribute('data-prefix') || '', suf = c.getAttribute('data-suffix') || '', o = {v:0};
    c.textContent = pre + '0' + suf;
    ScrollTrigger.create({trigger:c, start:'top 92%', once:true, onEnter:function(){
      gsap.to(o, {v:end, duration:1.6, ease:'power2.out', onUpdate:function(){ c.textContent = pre + Math.round(o.v).toLocaleString('en-US') + suf; }});
    }});
  });
  gsap.utils.toArray('.bars').forEach(function(b){
    gsap.from(b.children, {scaleY:0, transformOrigin:'50% 100%', duration:.8, stagger:.07, ease:'power3.out', scrollTrigger:{trigger:b, start:'top 90%', once:true}});
  });
  gsap.utils.toArray('.spark path').forEach(function(pth){
    try{ var L = pth.getTotalLength(); pth.style.strokeDasharray = L; pth.style.strokeDashoffset = L;
      gsap.to(pth, {strokeDashoffset:0, duration:1.6, ease:'power2.out', scrollTrigger:{trigger:pth, start:'top 92%', once:true}}); }catch(e){}
  });

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
