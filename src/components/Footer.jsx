import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="cd-footer">
      <div className="wrap">
        <div className="cd-footer-grid">
          <div className="cd-footer-brand reveal">
            <h3>CINDRE</h3>
            <p>119 Ashcroft Lane, Lower Marsh District. Open flame, closed Mondays.</p>
            <div className="cd-footer-social">
              <a href="#" aria-label="Instagram">IG</a>
              <a href="#" aria-label="X">X</a>
              <a href="#" aria-label="Journal">J</a>
            </div>
          </div>
          <div className="cd-footer-col reveal">
            <h5>Explore</h5>
            <Link to="/#hero">Home</Link>
            <a href="/#about">About CINDRE</a>
            <a href="/#location">Location</a>
            <a href="/#contact">Contact</a>
            <Link to="/reservation">Reservation</Link>
          </div>
          <div className="cd-footer-col reveal">
            <h5>Hours</h5>
            <p>Tue – Sun, 6:00 – 11:00 PM</p>
            <p>Closed Mondays</p>
            <p>Bar opens at 5:30 PM</p>
          </div>
          <div className="cd-footer-col reveal">
            <h5>Contact</h5>
            <a href="tel:+10000000000">+1 (000) 000&#8209;0000</a>
            <a href="mailto:table@cindre.com">table@cindre.com</a>
            <p>Private events on request</p>
          </div>
        </div>
        <div className="cd-footer-bottom">
          <span className="cd-star-badge">★ One Michelin Star, 2026 Guide</span>
          <span>© 2026 CINDRE. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
