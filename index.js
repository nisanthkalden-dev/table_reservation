/* =========================================================
   CINDRE — reservation logic & motion
   ========================================================= */
(function(){
  "use strict";
 
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
 
  /* ---------------- Data ---------------- */
  var TABLES = {
    'indoor-noir': {
      name:'Indoor Noir', min:2, max:6, seatWord:'Table',
      desc:'Candlelit and close to the pass, beneath a charcoal-plastered ceiling.',
      image:'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
      numRange:[1,14]
    },
    'chefs-counter': {
      name:"Chef's Counter", min:1, max:2, seatWord:'Seat',
      desc:'Eight seats, one flame — tasting menu only, three-hour seating.',
      image:'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1200&auto=format&fit=crop',
      numRange:[1,8]
    },
    'garden-terrace': {
      name:'Garden Terrace', min:2, max:8, seatWord:'Table',
      desc:'Open air beneath olive trees and hanging lanterns.',
      image:'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=1200&auto=format&fit=crop',
      numRange:[15,24]
    },
    'rooftop-private': {
      name:'Rooftop Private', min:4, max:12, seatWord:'Room',
      desc:'A glass-enclosed room above the city, held entirely for your party.',
      image:'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop',
      numRange:[25,28]
    }
  };
 
  var ALL_TIMES = ['5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM'];
 
  var REVIEWS = [
    {q:'The lamb arrived still smoking. I have not stopped thinking about it.', who:'A. Whitfield'},
    {q:'Forty-two seats, and every one of them earns its reputation.', who:'M. Delacroix'},
    {q:'Quietly the best tasting menu in the city right now.', who:'R. Okafor'},
    {q:'Booked eight weeks out. Worth every day of the wait.', who:'S. Lindqvist'},
    {q:'The Chef\u2019s Counter is the hottest ticket nobody talks about.', who:'J. Marchetti'},
    {q:'Service that reads the table without ever hovering.', who:'P. Nakamura'}
  ];
 
  /* ---------------- State ---------------- */
  var state = {
    selectedTable: 'indoor-noir',
    date: null,
    time: null,
    guests: 2,
    occasion: 'None in particular'
  };
 
  var today = new Date(); today.setHours(0,0,0,0);
  var maxBookDate = new Date(today); maxBookDate.setDate(maxBookDate.getDate()+60);
 
  var cal = { viewYear: today.getFullYear(), viewMonth: today.getMonth(), activeTrigger: null };
 
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function randomInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function randomCode(len){
    var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out='';
    for(var i=0;i<len;i++){ out+=chars[randomInt(0,chars.length-1)]; }
    return out;
  }
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 
  function formatDateLabel(d){
    return DOW_SHORT[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0,3) + ' ' + d.getDate();
  }
 
  /* ---------------- Image fallback wiring ---------------- */
  function wireImageFallback(img, fallbackTargetSelectorFn){
    img.addEventListener('error', function(){
      var target = fallbackTargetSelectorFn ? fallbackTargetSelectorFn(img) : img.parentElement;
      if(target) target.classList.add('img-fallback');
      img.style.opacity = '0';
      img.style.pointerEvents = 'none';
    });
  }
 
  document.addEventListener('DOMContentLoaded', function(){
 
    /* ===== Header scroll state ===== */
    var header = document.getElementById('cdHeader');
    var lastY = -1, ticking=false;
    function onScroll(){
      if(!ticking){
        window.requestAnimationFrame(function(){
          var y = window.scrollY || window.pageYOffset;
          if(y > 40) header.classList.add('is-scrolled'); else header.classList.remove('is-scrolled');
          ticking=false;
        });
        ticking=true;
      }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
 
    /* ===== Mobile menu ===== */
    var burger = document.getElementById('cdBurger');
    var mobileMenu = document.getElementById('cdMobileMenu');
    burger.addEventListener('click', function(){
      mobileMenu.classList.toggle('is-open');
      burger.classList.toggle('is-open');
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ mobileMenu.classList.remove('is-open'); });
    });
 
    /* ===== Hero image fallback + fade-in ===== */
    var heroImg = document.getElementById('heroImg');
    wireImageFallback(heroImg, function(){ return document.getElementById('heroBg'); });
    if(heroImg.complete && heroImg.naturalWidth>0){ heroImg.classList.add('is-loaded'); }
    heroImg.addEventListener('load', function(){ heroImg.classList.add('is-loaded'); });
    document.getElementById('hero').classList.add('is-inview');
 
    /* ===== Hero kinetic title reveal ===== */
    var words = document.querySelectorAll('.cd-word');
    words.forEach(function(w,i){
      setTimeout(function(){ w.classList.add('is-shown'); }, 260 + i*130);
    });
    setTimeout(function(){
      var sub = document.querySelector('.cd-hero-sub');
      var cue = document.querySelector('.cd-scroll-cue');
      if(sub){ sub.style.transition='opacity .9s var(--ease), transform .9s var(--ease)'; sub.style.opacity=1; sub.style.transform='translateY(0)'; }
      if(cue){ cue.style.transition='opacity .9s var(--ease)'; cue.style.opacity=1; }
    }, 900);
    var sub0 = document.querySelector('.cd-hero-sub');
    if(sub0){ sub0.style.opacity=0; sub0.style.transform='translateY(14px)'; }
    var cue0 = document.querySelector('.cd-scroll-cue');
    if(cue0){ cue0.style.opacity=0; }
 
    /* ===== Scroll reveal (IntersectionObserver, robust w/o GSAP) ===== */
    var revealEls = document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window){
      var counters = new WeakMap();
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var el = entry.target;
            var parent = el.parentElement;
            var idx = counters.get(parent) || 0;
            setTimeout(function(){ el.classList.add('is-in'); }, reduceMotion?0:idx*90);
            counters.set(parent, idx+1);
            io.unobserve(el);
          }
        });
      }, {threshold:0.15, rootMargin:'0px 0px -60px 0px'});
      revealEls.forEach(function(el){ io.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add('is-in'); });
    }
 
    /* ===== Lenis smooth scroll + GSAP ScrollTrigger bridge ===== */
    var lenis = null;
    try{
      if(window.Lenis){
        lenis = new window.Lenis({ duration: 1.05, easing: function(t){ return 1-Math.pow(1-t,3); }, smoothWheel:true });
        function raf(time){ lenis.raf(time); if(window.ScrollTrigger) window.ScrollTrigger.update(); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        if(window.gsap && window.ScrollTrigger){
          window.gsap.registerPlugin(window.ScrollTrigger);
        }
      }
    }catch(e){ lenis = null; }
    window.__cindreLenis = lenis;
 
    /* ===== Custom cursor ===== */
    if(isFinePointer && !reduceMotion){
      var dot = document.getElementById('cdCursorDot');
      var ring = document.getElementById('cdCursorRing');
      var mx=0,my=0, rx=0, ry=0;
      window.addEventListener('mousemove', function(e){
        mx=e.clientX; my=e.clientY;
        dot.style.left=mx+'px'; dot.style.top=my+'px';
      });
      (function loop(){
        rx += (mx-rx)*0.18; ry += (my-ry)*0.18;
        ring.style.left=rx+'px'; ring.style.top=ry+'px';
        requestAnimationFrame(loop);
      })();
      var hoverables = 'a, button, .cd-card, input, .cd-pill, .cd-chip, .cd-cal-day, .cd-date-trigger';
      document.addEventListener('mouseover', function(e){
        if(e.target.closest && e.target.closest(hoverables)) ring.classList.add('cd-cursor-active');
      });
      document.addEventListener('mouseout', function(e){
        if(e.target.closest && e.target.closest(hoverables)) ring.classList.remove('cd-cursor-active');
      });
    } else {
      var cursorEl = document.getElementById('cdCursor');
      if(cursorEl) cursorEl.style.display='none';
    }
 
    /* ===== Magnetic buttons ===== */
    if(isFinePointer && !reduceMotion){
      document.querySelectorAll('[data-magnetic]').forEach(function(btn){
        btn.addEventListener('mousemove', function(e){
          var r = btn.getBoundingClientRect();
          var relX = e.clientX - r.left - r.width/2;
          var relY = e.clientY - r.top - r.height/2;
          btn.style.transform = 'translate('+(relX*0.28)+'px,'+(relY*0.5)+'px)';
        });
        btn.addEventListener('mouseleave', function(){
          btn.style.transition='transform .5s var(--ease)';
          btn.style.transform='translate(0,0)';
          setTimeout(function(){ btn.style.transition=''; }, 500);
        });
        btn.addEventListener('mousedown', function(){ btn.style.transition='transform .1s var(--ease)'; });
      });
    }
 
    /* ===== 3D tilt on cards ===== */
    if(isFinePointer && !reduceMotion){
      document.querySelectorAll('[data-tilt]').forEach(function(card){
        card.addEventListener('mousemove', function(e){
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left)/r.width - 0.5;
          var py = (e.clientY - r.top)/r.height - 0.5;
          var rotY = px * 10, rotX = py * -10;
          card.style.transform = 'perspective(900px) rotateX('+rotX+'deg) rotateY('+rotY+'deg) translateY(-12px)';
          card.style.boxShadow = '0 30px 60px -18px rgba(212,175,55,.32)';
          card.style.borderColor = 'rgba(212,175,55,.6)';
          card.style.zIndex = 5;
        });
        card.addEventListener('mouseleave', function(){
          card.style.transform = '';
          card.style.zIndex = '';
          if(!card.classList.contains('is-selected')){
            card.style.boxShadow=''; card.style.borderColor='';
          }
        });
      });
    }
 
    /* ===== Card image fallback ===== */
    document.querySelectorAll('.cd-card-media img').forEach(function(img){
      wireImageFallback(img, function(im){ return im.closest('.cd-card-media'); });
    });
    document.querySelectorAll('#reserveImg1, #reserveImg2').forEach(function(img){
      wireImageFallback(img, function(im){ return im.closest('.cd-reserve-frame'); });
    });
 
    /* ===== Ember particles ===== */
    initEmbers();
 
    /* ===== Marquee content ===== */
    buildMarquee();
 
    /* ===== Occasion chips ===== */
    var chips = document.querySelectorAll('.cd-chip');
    chips.forEach(function(chip){
      if(chip.dataset.occ === state.occasion) chip.classList.add('is-selected');
      chip.addEventListener('click', function(){
        chips.forEach(function(c){ c.classList.remove('is-selected'); });
        chip.classList.add('is-selected');
        state.occasion = chip.dataset.occ;
      });
    });
 
    /* ===== Date triggers ===== */
    document.getElementById('heroDateTrigger').addEventListener('click', function(e){ openCalendar(e.currentTarget); });
    document.getElementById('formDateTrigger').addEventListener('click', function(e){ openCalendar(e.currentTarget); });
 
    document.addEventListener('click', function(e){
      var pop = document.getElementById('calendarPop');
      if(!pop.classList.contains('is-open')) return;
      if(pop.contains(e.target)) return;
      if(cal.activeTrigger && cal.activeTrigger.contains(e.target)) return;
      closeCalendar();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ closeCalendar(); closeModal(); }
    });
 
    renderCalendar();
    renderTimePills();
 
    /* ===== Form submit ===== */
    document.getElementById('resForm').addEventListener('submit', handleSubmit);
 
    /* ===== Init table state (no auto-scroll) ===== */
    applyTableSelection('indoor-noir', {scroll:false, highlightCard:true});
 
  });
 
  /* ---------------- Guests ---------------- */
  window.stepGuests = function(delta){
    var t = TABLES[state.selectedTable];
    var next = clamp(state.guests + delta, t.min, t.max);
    if(next === state.guests) return;
    state.guests = next;
    updateGuestUI();
  };
 
  function updateGuestUI(){
    var heroNum = document.getElementById('heroGuestNum');
    var formNum = document.getElementById('formGuestNum');
    [heroNum, formNum].forEach(function(el){
      el.textContent = state.guests;
      el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
    });
  }
 
  /* ---------------- Table selection ---------------- */
  window.selectTable = function(key){
    applyTableSelection(key, {scroll:true, highlightCard:true});
  };
 
  function applyTableSelection(key, opts){
    opts = opts || {};
    var t = TABLES[key];
    if(!t) return;
    state.selectedTable = key;
    state.guests = clamp(state.guests, t.min, t.max);
    updateGuestUI();
 
    document.getElementById('heroTableLabel').textContent = t.name;
 
    var noteEl = document.getElementById('guestNote');
    if(key === 'chefs-counter'){
      noteEl.textContent = "Chef's Counter seats " + t.min + '\u2013' + t.max + ' guests \u00b7 tasting menu only';
    } else {
      noteEl.textContent = t.name + ' seats ' + t.min + '\u2013' + t.max + ' guests';
    }
 
    if(opts.highlightCard){
      document.querySelectorAll('.cd-card').forEach(function(c){
        var sel = c.dataset.key === key;
        c.classList.toggle('is-selected', sel);
        if(!sel){ c.style.boxShadow=''; c.style.borderColor=''; }
      });
    }
 
    document.getElementById('reserveCapTitle').textContent = t.name;
    document.getElementById('reserveCapDesc').textContent = t.desc;
 
    var img1 = document.getElementById('reserveImg1');
    var img2 = document.getElementById('reserveImg2');
    var showing = img1.classList.contains('is-active') ? img1 : img2;
    var hidden = showing === img1 ? img2 : img1;
    hidden.onload = function(){
      hidden.classList.add('is-active');
      showing.classList.remove('is-active');
    };
    hidden.src = t.image;
 
    if(opts.scroll){
      setTimeout(function(){ smoothScrollTo('#reserve', -30); }, 200);
    }
  }
 
  /* ---------------- Calendar ---------------- */
  function renderCalendar(){
    var label = document.getElementById('calMonthLabel');
    label.textContent = MONTHS[cal.viewMonth] + ' ' + cal.viewYear;
 
    var grid = document.getElementById('calGrid');
    grid.innerHTML = '';
 
    var firstOfMonth = new Date(cal.viewYear, cal.viewMonth, 1);
    var startDow = firstOfMonth.getDay();
    var daysInMonth = new Date(cal.viewYear, cal.viewMonth+1, 0).getDate();
 
    for(var i=0;i<startDow;i++){
      var empty = document.createElement('span');
      empty.className = 'cd-cal-day is-empty';
      grid.appendChild(empty);
    }
 
    for(var d=1; d<=daysInMonth; d++){
      var thisDate = new Date(cal.viewYear, cal.viewMonth, d);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cd-cal-day';
      btn.textContent = d;
    //   var isClosedDay = thisDate.getDay() === 1; // Monday
       var isClosedDay = false; // Monday
      var isPast = thisDate < today;
      var isTooFar = thisDate > maxBookDate;
      if(isClosedDay || isPast || isTooFar){
        btn.classList.add('is-disabled');
        btn.title = isClosedDay ? 'false' : (isPast ? 'Date has passed' : 'Not yet bookable');
        btn.disabled = true;
      } else {
        (function(dt){
          btn.addEventListener('click', function(){ selectDate(dt); });
        })(thisDate);
      }
      if(state.date && thisDate.getTime() === state.date.getTime()){
        btn.classList.add('is-selected');
      }
      grid.appendChild(btn);
    }
  }
 
  window.calShift = function(dir){
    cal.viewMonth += dir;
    if(cal.viewMonth < 0){ cal.viewMonth = 11; cal.viewYear--; }
    if(cal.viewMonth > 11){ cal.viewMonth = 0; cal.viewYear++; }
    renderCalendar();
  };
 
  function openCalendar(trigger){
    var pop = document.getElementById('calendarPop');
    if(pop.classList.contains('is-open') && cal.activeTrigger === trigger){
      closeCalendar();
      return;
    }
    cal.activeTrigger = trigger;
    var r = trigger.getBoundingClientRect();
    var top = r.bottom + 10;
    var left = r.left;
    var popWidth = 320;
    if(left + popWidth > window.innerWidth - 16) left = window.innerWidth - popWidth - 16;
    if(left < 16) left = 16;
    var maxTop = window.innerHeight - 380;
    if(top > maxTop) top = Math.max(16, r.top - 400);
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    pop.classList.add('is-open');
    renderCalendar();
  }
 
  function closeCalendar(){
    document.getElementById('calendarPop').classList.remove('is-open');
    cal.activeTrigger = null;
  }
 
  function selectDate(dateObj){
    state.date = dateObj;
    state.time = null;
    document.querySelectorAll('.date-label').forEach(function(el){ el.textContent = formatDateLabel(dateObj); });
    document.getElementById('formDateTrigger').classList.remove('has-error');
    hideError('dateError');
    closeCalendar();
    renderTimePills();
  }
 
  /* ---------------- Time pills ---------------- */
  function isSlotBooked(dateObj, index){
    var d = dateObj.getDate();
    return ((d + index*3) % 7 === 0);
  }
 
  function renderTimePills(){
    var container = document.getElementById('timePills');
    container.innerHTML = '';
    if(!state.date){
      var msg = document.createElement('p');
      msg.style.cssText = 'font-size:13px;color:var(--smoke);margin:0;';
      msg.textContent = 'Select a date to see available times.';
      container.appendChild(msg);
      return;
    }
    ALL_TIMES.forEach(function(t, i){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cd-pill';
      btn.textContent = t;
      var booked = isSlotBooked(state.date, i);
      if(booked){
        btn.classList.add('is-booked');
        btn.title = 'Booked';
        btn.disabled = true;
      } else {
        btn.addEventListener('click', function(){
          container.querySelectorAll('.cd-pill').forEach(function(p){ p.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          state.time = t;
          hideError('timeError');
        });
        if(state.time === t) btn.classList.add('is-selected');
      }
      container.appendChild(btn);
    });
  }
 
  /* ---------------- Hero quick check ---------------- */
  window.checkAvailability = function(){
    if(!state.date){
      openCalendar(document.getElementById('heroDateTrigger'));
      smoothScrollTo('#hero', 0);
      return;
    }
    smoothScrollTo('#reserve', -30);
  };
 
  window.scrollToReserve = function(){ smoothScrollTo('#reserve', -30); };
 
  function smoothScrollTo(selector, offset){
    var el = document.querySelector(selector);
    if(!el) return;
    if(window.__cindreLenis){
      window.__cindreLenis.scrollTo(el, { offset: offset||0 });
    } else {
      var top = el.getBoundingClientRect().top + window.pageYOffset + (offset||0);
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }
 
  /* ---------------- Validation helpers ---------------- */
  function showError(id){ var e=document.getElementById(id); if(e) e.classList.add('is-shown'); }
  function hideError(id){ var e=document.getElementById(id); if(e) e.classList.remove('is-shown'); }
 
  /* ---------------- Submit ---------------- */
  // function handleSubmit(e){
  //   e.preventDefault();
  //   var valid = true;
 
  //   var dateTrigger = document.getElementById('formDateTrigger');
  //   if(!state.date){ dateTrigger.classList.add('has-error'); showError('dateError'); valid=false; }
  //   else { dateTrigger.classList.remove('has-error'); hideError('dateError'); }
 
  //   if(!state.time){ showError('timeError'); valid=false; } else { hideError('timeError'); }
 
  //   var nameInput = document.getElementById('fullName');
  //   var nameGroup = nameInput.closest('.cd-float');
  //   if(nameInput.value.trim().length < 2){ nameGroup.classList.add('has-error'); showError('nameError'); valid=false; }
  //   else { nameGroup.classList.remove('has-error'); hideError('nameError'); }
 
  //   var phoneInput = document.getElementById('phone');
  //   var phoneGroup = phoneInput.closest('.cd-float');
  //   var phoneOk = /^[0-9+()\-\s]{7,}$/.test(phoneInput.value.trim());
  //   if(!phoneOk){ phoneGroup.classList.add('has-error'); showError('phoneError'); valid=false; }
  //   else { phoneGroup.classList.remove('has-error'); hideError('phoneError'); }
 
  //   if(!valid){
  //     var firstError = document.querySelector('.has-error, .cd-error.is-shown');
  //     if(firstError) firstError.scrollIntoView({behavior:'smooth', block:'center'});
  //     return;
  //   }
 
  //   var btn = document.getElementById('submitBtn');
  //   btn.classList.add('is-loading');
  //   btn.disabled = true;
 
  //   setTimeout(function(){
  //     btn.classList.remove('is-loading');
  //     btn.disabled = false;
  //     completeBooking(nameInput.value.trim(), phoneInput.value.trim());
  //     var r = btn.getBoundingClientRect();
  //     burstEmbers(r.left + r.width/2, r.top + r.height/2);
  //   }, 1150);
  // }
 
  function completeBooking(name, phone){
    var t = TABLES[state.selectedTable];
    var num = randomInt(t.numRange[0], t.numRange[1]);
    var code = 'CINDRE-' + randomCode(6);
 
    document.getElementById('modalCode').textContent = 'Confirmation \u2014 ' + code;
 
    var details = document.getElementById('modalDetails');
    details.innerHTML = '';
    var rows = [
      ['Guest', name],
      ['Seating', t.name + ' \u00b7 ' + t.seatWord + ' ' + num],
      ['Date', formatDateLabel(state.date)],
      ['Time', state.time],
      ['Party', state.guests + (state.guests===1?' guest':' guests')],
      ['Occasion', state.occasion]
    ];
    rows.forEach(function(r){
      var row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<span>'+r[0]+'</span><span>'+escapeHtml(r[1])+'</span>';
      details.appendChild(row);
    });
 
    var qrData = encodeURIComponent(code + ' | ' + t.name + ' ' + t.seatWord + ' ' + num + ' | ' + formatDateLabel(state.date) + ' ' + state.time + ' | ' + state.guests + ' guests');
    var qrImg = document.getElementById('modalQr');
    qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=F5F1EA&color=0A0A0A&data=' + qrData;
    qrImg.onerror = function(){ qrImg.closest('.cd-modal-qr').style.display='none'; };
 
    window.__lastBooking = { name:name, phone:phone, table:t, num:num, code:code };
 
    openModal();
  }
 
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
 
  function openModal(){ document.getElementById('modalBackdrop').classList.add('is-open'); }
  window.closeModal = function(){ document.getElementById('modalBackdrop').classList.remove('is-open'); };
 
  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'modalBackdrop'){ window.closeModal(); }
  });
 
  /* ---------------- Add to calendar (.ics) ---------------- */
  window.downloadIcs = function(){
    if(!state.date || !state.time) return;
    var start = parseTimeToDate(state.date, state.time);
    var end = new Date(start.getTime() + 2*60*60*1000);
    function fmt(d){
      return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
    }
    function pad(n){ return (n<10?'0':'')+n; }
    var b = window.__lastBooking || {};
    var summary = 'Reservation at CINDRE';
    var desc = (b.table ? b.table.name + ' \u00b7 ' + b.table.seatWord + ' ' + b.num : '') + ', party of ' + state.guests;
    var ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CINDRE//Reservation//EN','BEGIN:VEVENT',
      'UID:' + (b.code||randomCode(8)) + '@cindre.com',
      'DTSTART:' + fmt(start), 'DTEND:' + fmt(end),
      'SUMMARY:' + summary,
      'DESCRIPTION:' + desc,
      'LOCATION:119 Ashcroft Lane\\, Lower Marsh District',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], {type:'text/calendar'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'cindre-reservation.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  };
 
  function parseTimeToDate(dateObj, timeStr){
    var m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    var h = parseInt(m[1],10), min = parseInt(m[2],10), ap = m[3].toUpperCase();
    if(ap==='PM' && h!==12) h+=12;
    if(ap==='AM' && h===12) h=0;
    var d = new Date(dateObj);
    d.setHours(h, min, 0, 0);
    return d;
  }
 
  /* ---------------- Marquee ---------------- */
  function buildMarquee(){
    var t1 = document.getElementById('marqueeTrack1');
    var t2 = document.getElementById('marqueeTrack2');
    var setA = REVIEWS.slice(0,3), setB = REVIEWS.slice(3,6);
    fillTrack(t1, setA);
    fillTrack(t2, setB);
  }
  function fillTrack(track, items){
    var html = '';
    for(var pass=0; pass<2; pass++){
      items.forEach(function(r){
        html += '<span class="cd-review">"'+escapeHtml(r.q)+'" <span class="stars">\u2605\u2605\u2605\u2605\u2605</span> <span class="dot"></span> <span class="who">'+escapeHtml(r.who)+'</span></span>';
      });
    }
    track.innerHTML = html;
  }
 
  /* ---------------- Ember particle system ---------------- */
  function initEmbers(){
    var canvas = document.getElementById('emberCanvas');
    var ctx = canvas.getContext('2d');
    var W, H, dpr = Math.min(window.devicePixelRatio||1, 2);
 
    function resize(){
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W*dpr; canvas.height = H*dpr;
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize);
 
    var ambient = [];
    var ambientCount = reduceMotion ? 0 : 22;
    for(var i=0;i<ambientCount;i++){
      ambient.push(makeAmbient());
    }
    function makeAmbient(){
      return {
        x: Math.random()*W,
        y: H + Math.random()*H,
        r: 1 + Math.random()*1.8,
        speed: 0.25 + Math.random()*0.55,
        drift: (Math.random()-0.5)*0.4,
        alpha: 0.15 + Math.random()*0.35,
        hue: Math.random()>0.5 ? '212,175,55' : '201,104,61'
      };
    }
 
    var bursts = [];
    window.__cindreBurst = function(x,y){
      for(var i=0;i<20;i++){
        bursts.push({
          x:x, y:y,
          vx:(Math.random()-0.5)*2.6,
          vy:-1.2 - Math.random()*2.2,
          r: 1.4 + Math.random()*2,
          life: 1,
          decay: 0.012 + Math.random()*0.014,
          hue: Math.random()>0.4 ? '212,175,55' : '224,137,90'
        });
      }
    };
 
    function tick(){
      ctx.clearRect(0,0,W,H);
      ambient.forEach(function(p){
        p.y -= p.speed;
        p.x += p.drift;
        if(p.y < -10){ p.y = H + 10; p.x = Math.random()*W; }
        ctx.beginPath();
        ctx.fillStyle = 'rgba('+p.hue+','+p.alpha+')';
        ctx.shadowColor = 'rgba('+p.hue+',0.9)';
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      for(var i=bursts.length-1;i>=0;i--){
        var b = bursts[i];
        b.x += b.vx; b.y += b.vy; b.vy += 0.02; b.life -= b.decay;
        if(b.life<=0){ bursts.splice(i,1); continue; }
        ctx.beginPath();
        ctx.fillStyle = 'rgba('+b.hue+','+Math.max(b.life,0)+')';
        ctx.shadowColor = 'rgba('+b.hue+',0.9)';
        ctx.shadowBlur = 8;
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function burstEmbers(x,y){ if(window.__cindreBurst) window.__cindreBurst(x,y); }
 
})();


async function handlesubmit(e) {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const table = document.getElementById("table").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  const { error } = await supabase
    .from('reservations')
    .insert([{
      name: name,
      phone: phone,
      table_number: table,
      date: date,
      time_slot: time
    }]);

  if (error) {
    if (error.code === '23505') {
      alert("❌ Table already booked for this time");
    } else {
      console.error(error);
      alert("Something went wrong");
    }
  } else {
    alert("✅ Booking Confirmed");
  }
}



async function getBookedTables(date, time) {
  const { data } = await supabase
    .from('reservations')
    .select('table_number')
    .eq('date', date)
    .eq('time_slot', time);

  return data.map(item => item.table_number);
}



supabase
  .channel('reservations')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'reservations' },
    payload => {
      console.log("New booking:", payload);
      // update UI instantly
    }
  )
  .subscribe();

// supabase------------

const supabaseUrl = "https://nebngrifzhbnbdiozgeo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYm5ncmlmemhibmJkaW96Z2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MTQxMDgsImV4cCI6MjEwMDM5MDEwOH0.SVpLWbuG-ouv5EccwWgA6G5YCDa26G7WzkHsgH2tNWg";

const supabase = supabase.createClient(supabaseUrl, supabaseKey);