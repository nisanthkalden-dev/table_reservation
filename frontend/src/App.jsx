import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CursorAndEmbers from './components/CursorAndEmbers.jsx';
import Home from './pages/Home.jsx';
import Reservation from './pages/Reservation.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    // Magnetic buttons handler
    const isFinePointer = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFinePointer && !reduceMotion) {
      const onMouseMove = (e) => {
        const btn = e.target.closest('[data-magnetic]');
        if (btn) {
          const r = btn.getBoundingClientRect();
          const relX = e.clientX - r.left - r.width / 2;
          const relY = e.clientY - r.top - r.height / 2;
          btn.style.transform = `translate(${relX * 0.28}px, ${relY * 0.5}px)`;
        }
      };

      const onMouseOut = (e) => {
        const btn = e.target.closest('[data-magnetic]');
        if (btn) {
          btn.style.transition = 'transform .5s var(--ease)';
          btn.style.transform = 'translate(0,0)';
          setTimeout(() => { btn.style.transition = ''; }, 500);
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseout', onMouseOut);

      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseout', onMouseOut);
      };
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <CursorAndEmbers />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reservation" element={<Reservation />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
