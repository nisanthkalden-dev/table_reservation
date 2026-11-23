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

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isMobileMenuOpen]);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={`cd-header ${isScrolled ? 'is-scrolled' : ''}`} id="cdHeader">
      <div className="cd-header-inner">
        <Link to="/" className="cd-logo" onClick={closeMenu}>CINDRE</Link>
        <nav className="cd-nav">
          <a href="/#hero" onClick={closeMenu}>Home</a>
          <a href="/#about" onClick={closeMenu}>About</a>
          <a href="/#location" onClick={closeMenu}>Location</a>
          <a href="/#contact" onClick={closeMenu}>Contact</a>
        </nav>
        <div className="cd-header-right">
          {!isHome && (
            <Link to="/" className="cd-btn cd-btn-ghost" data-magnetic>
              &larr; Back to Home
            </Link>
          )}
          <button
            className={`cd-burger ${isMobileMenuOpen ? 'is-open' : ''}`}
            id="cdBurger"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="cdMobileMenu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <div className={`cd-mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`} id="cdMobileMenu">
        <a href="/#hero" onClick={closeMenu}>Home</a>
        <a href="/#about" onClick={closeMenu}>About</a>
        <a href="/#location" onClick={closeMenu}>Location</a>
        <a href="/#contact" onClick={closeMenu}>Contact</a>
        {!isHome && (
          <Link to="/" onClick={closeMenu}>
            &larr; Back to Home
          </Link>
        )}
      </div>
    </header>
  );
}
