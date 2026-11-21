import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={`cd-header ${isScrolled ? 'is-scrolled' : ''}`} id="cdHeader">
      <div className="cd-header-inner">
        <Link to="/" className="cd-logo" onClick={closeMenu}>CINDRE</Link>
        <nav className="cd-nav">
          <Link to="/#hero">Home</Link>
          <a href="/#about">About</a>
          <a href="/#location">Location</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div className="cd-header-right">
          {isHome ? (
            <Link to="/reservation" className="cd-btn cd-btn-gold" data-magnetic>
              Reservation
            </Link>
          ) : (
            <Link to="/" className="cd-btn cd-btn-ghost" data-magnetic>
              &larr; Back to Home
            </Link>
          )}
          <button
            className={`cd-burger ${isMobileMenuOpen ? 'is-open' : ''}`}
            id="cdBurger"
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <div className={`cd-mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`} id="cdMobileMenu">
        <Link to="/#hero" onClick={closeMenu}>Home</Link>
        <a href="/#about" onClick={closeMenu}>About</a>
        <a href="/#location" onClick={closeMenu}>Location</a>
        <a href="/#contact" onClick={closeMenu}>Contact</a>
        {isHome ? (
          <Link to="/reservation" className="cd-mobile-res-btn" onClick={closeMenu}>
            Reservation &rarr;
          </Link>
        ) : (
          <Link to="/" onClick={closeMenu}>
            &larr; Back to Home
          </Link>
        )}
      </div>
    </header>
  );
}
