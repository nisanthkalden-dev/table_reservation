import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const REVIEWS = [
  { q: 'The lamb arrived still smoking. I have not stopped thinking about it.', who: 'A. Whitfield' },
  { q: 'Forty-two seats, and every one of them earns its reputation.', who: 'M. Delacroix' },
  { q: 'Quietly the best tasting menu in the city right now.', who: 'R. Okafor' },
  { q: 'Booked eight weeks out. Worth every day of the wait.', who: 'S. Lindqvist' },
  { q: "The Chef's Counter is the hottest ticket nobody talks about.", who: 'J. Marchetti' },
  { q: 'Service that reads the table without ever hovering.', who: 'P. Nakamura' }
];

export default function Home() {
  useEffect(() => {
    // Reveal kinetic words in hero
    const words = document.querySelectorAll('.cd-word');
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('is-shown'), 260 + i * 130);
    });

    setTimeout(() => {
      const sub = document.querySelector('.cd-hero-sub');
      const actions = document.querySelector('.cd-hero-actions');
      const cue = document.querySelector('.cd-scroll-cue');
      if (sub) {
        sub.style.transition = 'opacity .9s var(--ease), transform .9s var(--ease)';
        sub.style.opacity = '1';
        sub.style.transform = 'translateY(0)';
      }
      if (actions) {
        actions.style.opacity = '1';
        actions.style.transform = 'translateY(0)';
      }
      if (cue) {
        cue.style.transition = 'opacity .9s var(--ease)';
        cue.style.opacity = '1';
      }
    }, 900);

    // Scroll reveal observer
    const revealEls = document.querySelectorAll('.reveal');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window) {
      const counters = new WeakMap();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const parent = el.parentElement;
            const idx = counters.get(parent) || 0;
            setTimeout(() => el.classList.add('is-in'), reduceMotion ? 0 : idx * 90);
            counters.set(parent, idx + 1);
            io.unobserve(el);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-in'));
    }

    // Hash scroll support
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    }
  }, []);

  const setA = REVIEWS.slice(0, 3);
  const setB = REVIEWS.slice(3, 6);

  const renderMarqueeItems = (items) => (
    <>
      {[0, 1].map((pass) => (
        <React.Fragment key={pass}>
          {items.map((r, i) => (
            <span className="cd-review" key={`${pass}-${i}`}>
              "{r.q}" <span className="stars">★★★★★</span> <span className="dot"></span> <span className="who">{r.who}</span>
            </span>
          ))}
        </React.Fragment>
      ))}
    </>
  );

  return (
    <main id="top">
      {/* HERO SECTION */}
      <section className="cd-hero is-inview" id="hero">
        <div className="cd-hero-bg" id="heroBg">
          <img
            id="heroImg"
            className="is-loaded"
            alt="Live-fire dish plated at CINDRE"
            src="/assets/images/hero.jpg"
          />
          <div className="cd-hero-gradient"></div>
        </div>
        <div className="cd-hero-content">
          <p className="eyebrow"></p>
          <h1 className="cd-hero-title">
            <span className="cd-line"><span className="cd-word">Reserve</span></span>
            <span className="cd-line"><span className="cd-word">Your</span></span>
            <span className="cd-line"><span className="cd-word cd-italic">Moment</span></span>
          </h1>
          <p className="cd-hero-sub">Eleven courses, one open flame. CINDRE seats forty-two guests a night — never more.</p>
          <div className="cd-hero-actions">
            <Link to="/reservation" className="cd-btn cd-btn-gold" data-magnetic>
              Reservation
              <span style={{ fontSize: '1.1em', marginLeft: '8px' }}>&rarr;</span>
            </Link>
            <a href="#about" className="cd-btn cd-btn-ghost" data-magnetic>
              Discover CINDRE
            </a>
          </div>
          <div className="cd-scroll-cue"><span></span>Scroll</div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="cd-about" id="about">
        <div className="wrap">
          <div className="cd-about-grid">
            <div className="cd-about-text reveal">
              <p className="eyebrow">The Philosophy</p>
              <h2>Cooking with raw embers, timeless precision, and local roots.</h2>
              <p className="cd-lead">Founded in 2021 by Chef Julian Vane, CINDRE strips modern gastronomy down to its primal element: wood fire.</p>
              <p>Every morning, our hearth is fed with cured silver birch, fruitwood, and holm oak coals. There are no gas burners, immersion circulators, or shortcuts in our kitchen. From dry-aged dairy beef to delicate sea urchin, every dish is touched directly by smoke and ember heat.</p>
              
              <div className="cd-stats-row">
                <div className="cd-stat-item">
                  <span className="cd-stat-num">42</span>
                  <span className="cd-stat-label">Seats Per Night</span>
                </div>
                <div className="cd-stat-item">
                  <span className="cd-stat-num">11</span>
                  <span className="cd-stat-label">Course Tasting Menu</span>
                </div>
                <div className="cd-stat-item">
                  <span className="cd-stat-num">★ 1</span>
                  <span className="cd-stat-label">Michelin Star</span>
                </div>
              </div>

              <div style={{ marginTop: '36px' }}>
                <Link to="/reservation" className="cd-btn cd-btn-gold" data-magnetic>
                  Book a Table &rarr;
                </Link>
              </div>
            </div>

            <div className="cd-about-media reveal">
              <div className="cd-about-img-frame">
                <img alt="Chef Julian plating at the open hearth" src="/assets/images/chef.jpg" />
                <div className="cd-about-badge">
                  <span className="badge-title">Chef Julian Vane</span>
                  <span className="badge-sub">Live-Fire Hearthmaster</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION SECTION */}
      <section className="cd-location" id="location">
        <div className="wrap">
          <div className="cd-section-head reveal">
            <p className="eyebrow">Our Sanctuary</p>
            <h2>In the Heart of Lower Marsh</h2>
            <p>A converted 19th-century brick iron foundry tucked away in Ashcroft Lane.</p>
          </div>

          <div className="cd-location-grid">
            <div className="cd-location-card reveal">
              <div className="cd-loc-icon">⏱</div>
              <h3>Dinner Hours</h3>
              <ul className="cd-hours-list">
                <li><span>Tuesday – Thursday</span><strong>6:00 PM – 10:30 PM</strong></li>
                <li><span>Friday & Saturday</span><strong>5:30 PM – 11:00 PM</strong></li>
                <li><span>Sunday</span><strong>6:00 PM – 10:00 PM</strong></li>
                <li><span>Monday</span><em>Closed (Private events)</em></li>
              </ul>
              <p className="cd-loc-detail">The Hearth Bar opens nightly 30 minutes before dining service.</p>
              <a href="https://maps.google.com/?q=Lower+Marsh+London+SE1+7SG" target="_blank" rel="noopener noreferrer" className="cd-text-link">Get Directions &nearr;</a>
            </div>

            <div className="cd-location-map reveal">
              <iframe
                title="Restaurant Location Map"
                src="https://maps.google.com/maps?q=Lower%20Marsh%20London%20SE1%207SG&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS MARQUEE */}
      <section className="cd-reviews">
        <div className="cd-reviews-head reveal">
          <p className="eyebrow" style={{ justifyContent: 'center' }}>Word Of Mouth</p>
          <h2>Forty-two seats.<br />Every night, spoken for.</h2>
        </div>

        <div className="cd-marquee cd-reviews-row">
          <div className="cd-marquee-track">{renderMarqueeItems(setA)}</div>
        </div>
        <div className="cd-marquee cd-reviews-row">
          <div className="cd-marquee-track dir-r">{renderMarqueeItems(setB)}</div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="cd-contact" id="contact">
        <div className="wrap">
          <div className="cd-contact-wrapper reveal">
            <div className="cd-contact-info">
              <p className="eyebrow">Connect</p>
              <h2>Get in Touch with Our Concierge</h2>
              <p>Questions about dietary requirements, buyout inquiries, or special occasions? Our sommelier and reservations host are available daily.</p>
              
              <div className="cd-contact-rows">
                <div className="cd-c-row">
                  <span className="cd-c-label">Telephone</span>
                  <a href="tel:+10000000000">+1 (000) 000&#8209;0000</a>
                </div>
                <div className="cd-c-row">
                  <span className="cd-c-label">Reservations Desk</span>
                  <a href="mailto:table@cindre.com">table@cindre.com</a>
                </div>
                <div className="cd-c-row">
                  <span className="cd-c-label">Press & Private Dining</span>
                  <a href="mailto:events@cindre.com">events@cindre.com</a>
                </div>
              </div>
            </div>

            <div className="cd-contact-card">
              <h3>Ready for dinner?</h3>
              <p>Bookings open 60 days in advance. Select from our four seating environments.</p>
              <div className="cd-contact-cta-box">
                <Link to="/reservation" className="cd-btn cd-btn-gold cd-btn-block" data-magnetic>
                  Go to Reservations Page &rarr;
                </Link>
              </div>
              <span className="cd-contact-subnote">Instant confirmation & calendar invite</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
