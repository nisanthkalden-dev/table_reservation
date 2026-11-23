import React from 'react';
import { Link } from 'react-router-dom';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.17.4.37 1 .42 2.2.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.22.6-.48 1-.9 1.4-.4.4-.8.7-1.4.9-.4.17-1 .37-2.2.42-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.48-1.4-.9-.4-.4-.7-.8-.9-1.4-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.22-.6.48-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.8.07-.9.04-1.4.19-1.7.32-.4.16-.7.34-1 .64-.3.3-.48.6-.64 1-.13.3-.28.8-.32 1.7C3.99 8.5 3.99 8.9 3.99 12s0 3.5.07 4.8c.04.9.19 1.4.32 1.7.16.4.34.7.64 1 .3.3.6.48 1 .64.3.13.8.28 1.7.32 1.3.07 1.7.07 4.8.07s3.5 0 4.8-.07c.9-.04 1.4-.19 1.7-.32.4-.16.7-.34 1-.64.3-.3.48-.6.64-1 .13-.3.28-.8.32-1.7.07-1.3.07-1.7.07-4.8s0-3.5-.07-4.8c-.04-.9-.19-1.4-.32-1.7a2.7 2.7 0 0 0-.64-1 2.7 2.7 0 0 0-1-.64c-.3-.13-.8-.28-1.7-.32C15.5 4 15.1 4 12 4Zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.2-2.9a1.17 1.17 0 1 1 0 2.34 1.17 1.17 0 0 1 0-2.34Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.2 2H21l-6.1 7 7.2 13h-5.6l-4.4-7.9L6.7 22H3.9l6.5-7.5L3.5 2h5.8l4 7 4.9-7Zm-1 18h1.5L7.3 3.6H5.7L17.2 20Z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2.3V18h16V7.3l-8 5.6-8-5.6Zm.4-.3h15.2L12 11.4 4.4 7Z" />
  </svg>
);

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="cd-footer">
      <div className="wrap">
        <div className="cd-footer-cta reveal">
          <div>
            <p className="eyebrow">Your Seat At The Fire</p>
            <h2>Come hungry.<br /><em>Leave changed.</em></h2>
            <p className="cd-footer-cta-copy">
              Eleven courses, one open flame, forty-two seats a night. The next chapter is yours to take.
            </p>
          </div>
          <Link to="/reservation" className="cd-btn cd-btn-gold" data-magnetic>
            Reserve a Table <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="cd-footer-grid">
          <div className="cd-footer-brand reveal">
            <h3>CINDRE</h3>
            <p className="cd-footer-tagline">Live-fire dining &middot; London</p>
            <p>119 Ashcroft Lane, Lower Marsh District. Open flame, closed Mondays.</p>
            <div className="cd-footer-social">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X"><XIcon /></a>
              <a href="mailto:table@cindre.com" aria-label="Email us"><MailIcon /></a>
            </div>
          </div>

          <div className="cd-footer-col reveal">
            <h5>Explore</h5>
            <Link to="/#hero">Home</Link>
            <a href="/#about">About CINDRE</a>
            <a href="/#location">Location</a>
            <a href="/#contact">Contact</a>
            <Link to="/reservation">Reservations</Link>
          </div>
        </div>

        <div className="cd-footer-bottom">
          <div className="cd-footer-bottom-left">
            {/* <span className="cd-star-badge">★ One Michelin Star, 2026 Guide</span> */}
            <span>&copy; 2026 CINDRE. All rights reserved.</span>
          </div>
          <button type="button" className="cd-to-top" onClick={scrollToTop}>
            Back to top <span aria-hidden="true">&uarr;</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
