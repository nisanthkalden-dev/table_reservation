import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nebngrifzhbnbdiozgeo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYm5ncmlmemhibmJkaW96Z2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MTQxMDgsImV4cCI6MjEwMDM5MDEwOH0.SVpLWbuG-ouv5EccwWgA6G5YCDa26G7WzkHsgH2tNWg";
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = {
  'indoor-noir': {
    name: 'Indoor Noir', min: 2, max: 6, seatWord: 'Table',
    desc: 'Candlelit and close to the pass, beneath a charcoal-plastered ceiling.',
    image: '/assets/images/indoor-noir.jpg',
    numRange: [1, 14]
  },
  'chefs-counter': {
    name: "Chef's Counter", min: 1, max: 2, seatWord: 'Seat',
    desc: 'Eight seats, one flame — tasting menu only, three-hour seating.',
    image: '/assets/images/chefs-counter.jpg',
    numRange: [1, 8]
  },
  'garden-terrace': {
    name: 'Garden Terrace', min: 2, max: 8, seatWord: 'Table',
    desc: 'Open air beneath olive trees and hanging lanterns.',
    image: '/assets/images/garden-terrace.jpg',
    numRange: [15, 24]
  },
  'rooftop-private': {
    name: 'Rooftop Private', min: 4, max: 12, seatWord: 'Room',
    desc: 'A glass-enclosed room above the city, held entirely for your party.',
    image: '/assets/images/rooftop-private.jpg',
    numRange: [25, 28]
  }
};

const ALL_TIMES = ['5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomCode(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[randomInt(0, chars.length - 1)];
  return out;
}
function formatDateLabel(d) {
  if (!d) return 'Select a date';
  return DOW_SHORT[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
}

export default function Reservation() {
  const [selectedTable, setSelectedTable] = useState('indoor-noir');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [guests, setGuests] = useState(2);
  const [occasion, setOccasion] = useState('None in particular');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [dateError, setDateError] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calendar popover
  const [isCalOpen, setIsCalOpen] = useState(false);
  const [calPos, setCalPos] = useState({ top: 0, left: 0 });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxBookDate = new Date(today); maxBookDate.setDate(maxBookDate.getDate() + 60);
  const [calView, setCalView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  // Confirmation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
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

    // 3D tilt on cards
    const isFinePointer = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    if (isFinePointer && !reduceMotion) {
      const cards = document.querySelectorAll('[data-tilt]');
      cards.forEach((card) => {
        card.onmousemove = (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          const rotY = px * 10, rotX = py * -10;
          card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-12px)`;
          card.style.boxShadow = '0 30px 60px -18px rgba(212,175,55,.32)';
          card.style.borderColor = 'rgba(212,175,55,.6)';
          card.style.zIndex = 5;
        };
        card.onmouseleave = () => {
          card.style.transform = '';
          card.style.zIndex = '';
          if (!card.classList.contains('is-selected')) {
            card.style.boxShadow = '';
            card.style.borderColor = '';
          }
        };
      });
    }
  }, []);

  useEffect(() => {
    // Lock page scroll while the confirmation modal is open.
    if (!modalOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => { if (e.key === 'Escape') setModalOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen]);

  useEffect(() => {
    // Dismiss the calendar on outside tap or Escape (mobile-friendly).
    if (!isCalOpen) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest('.cd-calendar') && !e.target.closest('.cd-date-trigger')) {
        setIsCalOpen(false);
      }
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setIsCalOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isCalOpen]);

  const handleTableSelect = (key) => {
    setSelectedTable(key);
    const t = TABLES[key];
    setGuests(prev => clamp(prev, t.min, t.max));
    const formWrap = document.getElementById('reserveFormWrap');
    if (formWrap) {
      formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStepGuests = (delta) => {
    const t = TABLES[selectedTable];
    setGuests(prev => clamp(prev + delta, t.min, t.max));
  };

  const openCalendar = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    let top = r.bottom + 10;
    let left = r.left;
    const popWidth = 320;
    if (left + popWidth > window.innerWidth - 16) left = window.innerWidth - popWidth - 16;
    if (left < 16) left = 16;
    const maxTop = window.innerHeight - 380;
    if (top > maxTop) top = Math.max(16, r.top - 400);
    setCalPos({ top, left });
    setIsCalOpen(true);
  };

  const selectDate = (d) => {
    setDate(d);
    setTime(null);
    setDateError(false);
    setIsCalOpen(false);
  };

  const isSlotBooked = (dateObj, index) => {
    const d = dateObj.getDate();
    return ((d + index * 3) % 7 === 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;

    if (!date) { setDateError(true); valid = false; } else { setDateError(false); }
    if (!time) { setTimeError(true); valid = false; } else { setTimeError(false); }
    if (fullName.trim().length < 2) { setNameError(true); valid = false; } else { setNameError(false); }
    const phoneOk = /^[0-9+()\-\s]{7,}$/.test(phone.trim());
    if (!phoneOk) { setPhoneError(true); valid = false; } else { setPhoneError(false); }

    if (!valid) return;

    setIsLoading(true);
    const tableInfo = TABLES[selectedTable];
    const tableNumber = randomInt(tableInfo.numRange[0], tableInfo.numRange[1]);
    const code = 'CINDRE-' + randomCode(6);

    try {
      const dateFormatted = date.toISOString().split('T')[0];
      const { error } = await supabase.from('reservations').insert([{
        name: fullName.trim(),
        phone: phone.trim(),
        table_number: tableNumber,
        date: dateFormatted,
        time_slot: time
      }]);

      if (error && error.code === '23505') {
        alert("❌ Table already booked for this time");
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Supabase insert note:", err);
    }

    setTimeout(() => {
      setIsLoading(false);
      setBookingResult({
        name: fullName.trim(),
        phone: phone.trim(),
        table: tableInfo,
        num: tableNumber,
        code: code,
        date: date,
        time: time,
        guests: guests,
        occasion: occasion
      });
      setModalOpen(true);
      if (window.__cindreBurst) {
        const btn = document.getElementById('submitBtn');
        if (btn) {
          const r = btn.getBoundingClientRect();
          window.__cindreBurst(r.left + r.width / 2, r.top + r.height / 2);
        }
      }
    }, 800);
  };

  const downloadIcs = () => {
    if (!bookingResult || !bookingResult.date || !bookingResult.time) return;
    const timeMatch = bookingResult.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let h = parseInt(timeMatch[1], 10), min = parseInt(timeMatch[2], 10), ap = timeMatch[3].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    const start = new Date(bookingResult.date);
    start.setHours(h, min, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const pad = (n) => (n < 10 ? '0' : '') + n;
    const fmt = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CINDRE//Reservation//EN', 'BEGIN:VEVENT',
      `UID:${bookingResult.code}@cindre.com`,
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:Reservation at CINDRE`,
      `DESCRIPTION:${bookingResult.table.name} · ${bookingResult.table.seatWord} ${bookingResult.num}, party of ${bookingResult.guests}`,
      `LOCATION:119 Ashcroft Lane\\, Lower Marsh District`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cindre-reservation.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Calendar days generation
  const firstOfMonth = new Date(calView.year, calView.month, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(calView.year, calView.month + 1, 0).getDate();
  const calDays = [];
  for (let i = 0; i < startDow; i++) calDays.push({ empty: true, key: `empty-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(calView.year, calView.month, d);
    const isPast = thisDate < today;
    const isTooFar = thisDate > maxBookDate;
    calDays.push({
      d,
      dateObj: thisDate,
      disabled: isPast || isTooFar,
      selected: date && thisDate.getTime() === date.getTime(),
      key: `day-${d}`
    });
  }

  const currentTable = TABLES[selectedTable];

  return (
    <main>
      {/* PAGE INTRO */}
      <section className="cd-page-intro">
        <div className="wrap">
          <p className="eyebrow reveal">Reservations</p>
          <h1 className="reveal">Reserve Your Seat at the Flame</h1>
          <p className="cd-intro-desc reveal">Forty-two seats each evening. Seatings Tuesday through Sunday. Select an ambiance and reserve your table below.</p>
        </div>
      </section>

      {/* TABLE SELECTION */}
      <section className="cd-tables" id="tables" style={{ paddingTop: '20px' }}>
        <div className="wrap">
          <div className="cd-tables-head reveal">
            <div>
              <p className="eyebrow">The Room</p>
              <h2>Four dining experiences</h2>
            </div>
            <p>Choose an atmosphere. Every seating offers direct sightlines to the live hearth.</p>
          </div>

          <div className="cd-bento">
            {Object.entries(TABLES).map(([key, t], idx) => (
              <div
                key={key}
                className={`cd-card reveal ${selectedTable === key ? 'is-selected' : ''}`}
                data-key={key}
                data-tilt
                onClick={() => handleTableSelect(key)}
              >
                <div className="cd-card-media">
                  <img alt={t.name} src={t.image} />
                </div>
                <div className="cd-card-scrim"></div>
                <div className="cd-card-grain"></div>
                <div className="cd-card-check">✓</div>
                <div className="cd-card-body">
                  <span className="cd-card-index">0{idx + 1} — {t.name}</span>
                  <h3>{t.name}</h3>
                  <span className="cd-card-cap">{t.min}–{t.max} guests</span>
                  <p className="cd-card-desc">{t.desc}</p>
                  <span className="cd-card-cta">Select This &nbsp;→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESERVATION FORM */}
      <section className="cd-reserve" id="reserveFormWrap">
        <div className="wrap">
          <div className="cd-reserve-grid">
            <div className="cd-reserve-visual reveal">
              <div className="cd-reserve-frame" id="reserveFrame">
                <img
                  className="is-active"
                  alt="Selected seating area"
                  src={currentTable.image}
                />
                <div className="cd-reserve-frame-scrim"></div>
                <div className="cd-reserve-caption">
                  <h4>{currentTable.name}</h4>
                  <p>{currentTable.desc}</p>
                </div>
              </div>
            </div>

            <div className="cd-reserve-form">
              <div className="cd-form-head reveal">
                <p className="eyebrow">Booking Details</p>
                <h2>The Reservation</h2>
                <p>Seatings run nightly, Tuesday through Sunday. We hold each table for fifteen minutes past your reserved time.</p>
              </div>

              <form id="resForm" onSubmit={handleSubmit} noValidate>
                {/* DATE */}
                <div className="cd-field-group reveal">
                  <label className="cd-field-label">Date</label>
                  <div
                    className={`cd-date-trigger ${dateError ? 'has-error' : ''}`}
                    onClick={openCalendar}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openCalendar(e);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    aria-expanded={isCalOpen}
                  >
                    <span className="cd-date-val date-label">{formatDateLabel(date)}</span>
                    <span className="cd-chev">▾</span>
                  </div>
                  {dateError && <p className="cd-error is-shown">Please choose a date.</p>}
                </div>

                {/* TIME */}
                <div className="cd-field-group reveal">
                  <label className="cd-field-label">Time</label>
                  <div className="cd-pills">
                    {!date ? (
                      <span className="cd-empty-pill-msg">Select a date above to view seatings</span>
                    ) : (
                      ALL_TIMES.map((tm, idx) => {
                        const booked = isSlotBooked(date, idx);
                        return (
                          <button
                            key={tm}
                            type="button"
                            className={`cd-pill ${booked ? 'is-disabled' : ''} ${time === tm ? 'is-selected' : ''}`}
                            disabled={booked}
                            onClick={() => { setTime(tm); setTimeError(false); }}
                          >
                            {tm}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {timeError && <p className="cd-error is-shown">Please choose a time.</p>}
                </div>

                {/* PARTY SIZE */}
                <div className="cd-field-group reveal">
                  <label className="cd-field-label">Party Size</label>
                  <div className="cd-stepper-row">
                    <div className="cd-stepper">
                      <button
                        className="cd-step-btn"
                        type="button"
                        onClick={() => handleStepGuests(-1)}
                        aria-label="Fewer guests"
                      >
                        &#8722;
                      </button>
                      <span className="cd-guest-num">{guests}</span>
                      <button
                        className="cd-step-btn"
                        type="button"
                        onClick={() => handleStepGuests(1)}
                        aria-label="More guests"
                      >
                        &#43;
                      </button>
                    </div>
                    <span className="cd-stepper-note">
                      {selectedTable === 'chefs-counter'
                        ? `Chef's Counter seats ${currentTable.min}–${currentTable.max} guests · tasting menu only`
                        : `${currentTable.name} seats ${currentTable.min}–${currentTable.max} guests`}
                    </span>
                  </div>
                </div>

                {/* OCCASION */}
                <div className="cd-field-group reveal">
                  <label className="cd-field-label">Occasion</label>
                  <div className="cd-chips">
                    {['None in particular', 'Anniversary', 'Birthday', 'Proposal', 'Business Dinner'].map((occ) => (
                      <button
                        key={occ}
                        type="button"
                        className={`cd-chip ${occasion === occ ? 'is-selected' : ''}`}
                        onClick={() => setOccasion(occ)}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NAME & PHONE */}
                <div className="cd-field-group reveal">
                  <div className="cd-input-row">
                    <div className={`cd-float ${nameError ? 'has-error' : ''}`}>
                      <input
                        type="text"
                        id="fullName"
                        placeholder=" "
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setNameError(false); }}
                      />
                      <label htmlFor="fullName">Full Name</label>
                      {nameError && <p className="cd-error is-shown">Please enter your name.</p>}
                    </div>

                    <div className={`cd-float ${phoneError ? 'has-error' : ''}`}>
                      <input
                        type="tel"
                        id="phone"
                        placeholder=" "
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setPhoneError(false); }}
                      />
                      <label htmlFor="phone">Phone Number</label>
                      {phoneError && <p className="cd-error is-shown">Enter a valid phone number.</p>}
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className={`cd-btn cd-btn-gold cd-btn-block reveal ${isLoading ? 'is-loading' : ''}`}
                  data-magnetic
                  id="submitBtn"
                  disabled={isLoading}
                >
                  <span className="cd-btn-spinner"></span>
                  <span className="cd-btn-label">Confirm Reservation</span>
                </button>
                <p className="cd-submit-note reveal">
                  A credit card is required to secure Rooftop Private and Chef's Counter bookings. No charge unless you no-show.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CALENDAR POPOVER */}
      <div
        className={`cd-calendar ${isCalOpen ? 'is-open' : ''}`}
        id="calendarPop"
        style={{ top: `${calPos.top}px`, left: `${calPos.left}px` }}
      >
        <div className="cd-cal-head">
          <div className="cd-cal-nav">
            <button
              type="button"
              onClick={() => setCalView(prev => {
                let month = prev.month - 1;
                let year = prev.year;
                if (month < 0) { month = 11; year--; }
                return { year, month };
              })}
              aria-label="Previous month"
            >
              ←
            </button>
          </div>
          <strong>{MONTHS[calView.month]} {calView.year}</strong>
          <div className="cd-cal-nav">
            <button
              type="button"
              onClick={() => setCalView(prev => {
                let month = prev.month + 1;
                let year = prev.year;
                if (month > 11) { month = 0; year++; }
                return { year, month };
              })}
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>
        <div className="cd-cal-dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
        <div className="cd-cal-grid">
          {calDays.map(item => (
            item.empty ? (
              <span className="cd-cal-day is-empty" key={item.key}></span>
            ) : (
              <button
                key={item.key}
                type="button"
                className={`cd-cal-day ${item.disabled ? 'is-disabled' : ''} ${item.selected ? 'is-selected' : ''}`}
                disabled={item.disabled}
                onClick={() => selectDate(item.dateObj)}
              >
                {item.d}
              </button>
            )
          ))}
        </div>
        <p className="cd-cal-note">CINDRE is closed Mondays. Bookings open 60 days in advance.</p>
      </div>

      {/* CONFIRMATION MODAL */}
      <div
        className={`cd-modal-backdrop ${modalOpen ? 'is-open' : ''}`}
        id="modalBackdrop"
        onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <div className="cd-modal" role="dialog" aria-modal="true">
          <button className="cd-modal-close" onClick={() => setModalOpen(false)} aria-label="Close">✕</button>
          <div className="cd-check-wrap">
            <svg viewBox="0 0 24 24"><path d="M4 12.5L9.5 18L20 6"></path></svg>
          </div>
          <h3>Reservation Confirmed</h3>
          <p className="cd-modal-code">{bookingResult ? `CONFIRMATION — ${bookingResult.code}` : ''}</p>
          <div className="cd-modal-details">
            {bookingResult && (
              <>
                <div className="row"><span>Guest</span><span>{bookingResult.name}</span></div>
                <div className="row"><span>Seating</span><span>{bookingResult.table.name} · {bookingResult.table.seatWord} {bookingResult.num}</span></div>
                <div className="row"><span>Date</span><span>{formatDateLabel(bookingResult.date)}</span></div>
                <div className="row"><span>Time</span><span>{bookingResult.time}</span></div>
                <div className="row"><span>Party</span><span>{bookingResult.guests} {bookingResult.guests === 1 ? 'guest' : 'guests'}</span></div>
                <div className="row"><span>Occasion</span><span>{bookingResult.occasion}</span></div>
              </>
            )}
          </div>
          {bookingResult && (
            <div className="cd-modal-qr">
              <img
                alt="Reservation QR code"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=F5F1EA&color=0A0A0A&data=${encodeURIComponent(
                  `${bookingResult.code} | ${bookingResult.table.name} | ${formatDateLabel(bookingResult.date)} ${bookingResult.time} | ${bookingResult.guests} guests`
                )}`}
              />
            </div>
          )}
          <div className="cd-modal-actions">
            <button className="cd-btn cd-btn-ghost" onClick={downloadIcs}>Add to Calendar</button>
            <button className="cd-btn cd-btn-gold" onClick={() => setModalOpen(false)}>Done</button>
          </div>
        </div>
      </div>
    </main>
  );
}
