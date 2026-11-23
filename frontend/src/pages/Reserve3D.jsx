import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import RestaurantScene from '../three/RestaurantScene.jsx';
import {
  RESTAURANT,
  TABLES,
  TABLE_BY_ID,
  TIME_SLOTS,
  buildAvailability,
  formatDateLong,
  formatDateShort,
  tableLocation,
  toDateKey,
} from '../data/restaurantLayout.js';
import '../styles/reserve.css';

function midnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function makeReservationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 6; i += 1) body += chars[Math.floor(Math.random() * chars.length)];
  return `CINDRE-${body}`;
}

function dateChipLabel(date, today) {
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, addDays(today, 1))) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

function SummaryRows({ date, time, tableId }) {
  const table = TABLE_BY_ID[tableId];
  return (
    <div className="rsv-summary">
      <div className="rsv-summary-row">
        <span>Restaurant</span>
        <strong>{RESTAURANT.name}</strong>
      </div>
      <div className="rsv-summary-row">
        <span>Date</span>
        <strong>{formatDateLong(date)}</strong>
      </div>
      <div className="rsv-summary-row">
        <span>Time</span>
        <strong>{time}</strong>
      </div>
      <div className="rsv-summary-row">
        <span>Guests</span>
        <strong>{table ? `${table.seats} guests` : '—'}</strong>
      </div>
      <div className="rsv-summary-row">
        <span>Table</span>
        <strong className="is-accent">{tableId}</strong>
      </div>
      <div className="rsv-summary-row">
        <span>Location</span>
        <strong>{table ? tableLocation(table) : '—'}</strong>
      </div>
    </div>
  );
}

export default function Reserve3D() {
  const today = useMemo(() => midnight(new Date()), []);
  const dateOptions = useMemo(() => [0, 1, 2].map((n) => addDays(today, n)), [today]);

  const [date, setDate] = useState(today);
  const [time, setTime] = useState('7:30 PM');
  const [selectedId, setSelectedId] = useState(null);
  const [hover, setHover] = useState(null);
  const [bookedBySlot, setBookedBySlot] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const confirmTimer = useRef(null);
  const peekTimer = useRef(null);
  const pinnedId = useRef(null);

  const dateKey = toDateKey(date);
  const slotKey = `${dateKey}|${time}`;

  const availability = useMemo(
    () => buildAvailability(dateKey, time, bookedBySlot[slotKey] || []),
    [dateKey, time, bookedBySlot, slotKey],
  );

  const availableCount = useMemo(
    () => Object.values(availability).filter((s) => s === 'available').length,
    [availability],
  );

  const selectedTable = selectedId ? TABLE_BY_ID[selectedId] : null;
  const hoverTable = hover ? TABLE_BY_ID[hover.id] : null;
  const hoverStatus = hover
    ? selectedId === hover.id
      ? 'selected'
      : availability[hover.id]
    : null;

  useEffect(() => {
    document.body.classList.add('rsv-lock');
    return () => {
      document.body.classList.remove('rsv-lock');
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      if (peekTimer.current) clearTimeout(peekTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!bookingOpen && !successOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setBookingOpen(false);
        setSuccessOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [bookingOpen, successOpen]);

  const clearPeek = () => {
    pinnedId.current = null;
    if (peekTimer.current) clearTimeout(peekTimer.current);
  };

  const changeDate = (next) => {
    if (confirming || sameDay(next, date)) return;
    clearPeek();
    setDate(next);
    setSelectedId(null);
    setHover(null);
  };

  const changeTime = (next) => {
    if (confirming || next === time) return;
    clearPeek();
    setTime(next);
    setSelectedId(null);
    setHover(null);
  };

  const handleSelectTable = (id) => {
    if (confirming) return;
    clearPeek();
    setSelectedId(id);
  };

  const handleHoverTable = (id, x, y) => {
    clearPeek();
    setHover({ id, x, y });
  };

  const handleHoverEnd = () => {
    if (pinnedId.current) return;
    setHover(null);
  };

  const handleBookedTable = (id, x, y) => {
    clearPeek();
    pinnedId.current = id;
    setHover({ id, x, y });
    peekTimer.current = setTimeout(() => {
      pinnedId.current = null;
      setHover(null);
    }, 3200);
  };

  const handleConfirm = () => {
    if (!selectedId || confirming) return;
    const table = TABLE_BY_ID[selectedId];
    const id = selectedId;
    const confirmedDate = date;
    const confirmedTime = time;
    setConfirming(true);
    confirmTimer.current = setTimeout(() => {
      setBookedBySlot((prev) => ({
        ...prev,
        [slotKey]: [...(prev[slotKey] || []), id],
      }));
      setResult({
        code: makeReservationCode(),
        date: confirmedDate,
        time: confirmedTime,
        tableId: id,
        seats: table.seats,
      });
      setSelectedId(null);
      setHover(null);
      setConfirming(false);
      setBookingOpen(false);
      setSuccessOpen(true);
    }, 950);
  };

  const openBooking = () => {
    setBookingOpen(true);
    setHover(null);
  };

  const tooltipStyle = hover
    ? {
        left: Math.min(hover.x + 18, window.innerWidth - 250),
        top: Math.min(hover.y + 18, window.innerHeight - 150),
      }
    : undefined;

  return (
    <main className="rsv-page">
      {/* ---------------------------------------------------------- */}
      {/* Top bar                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="rsv-appbar">
        <Link to="/" className="rsv-brand" aria-label="CINDRE home">
          <span className="rsv-brand-name">CINDRE</span>
          <span className="rsv-brand-sub">Dining Room · Reservations</span>
        </Link>

        <div className="rsv-appbar-meta">
          <span className="rsv-meta">
            <small>Date</small>
            <strong>{formatDateShort(date)}</strong>
          </span>
          <span className="rsv-meta">
            <small>Time</small>
            <strong>{time}</strong>
          </span>
          <button type="button" className="rsv-booking-btn" onClick={openBooking}>
            <span>My Booking</span>
            {result && <i className="rsv-booking-badge" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Date / time                                                */}
      {/* ---------------------------------------------------------- */}
      <div className="rsv-controls">
        <div className="rsv-control">
          <span className="rsv-control-label">Select Date</span>
          <div className="rsv-chips" role="group" aria-label="Select date">
            {dateOptions.map((d) => (
              <button
                key={toDateKey(d)}
                type="button"
                className={`rsv-chip rsv-date-chip ${sameDay(d, date) ? 'is-active' : ''}`}
                onClick={() => changeDate(d)}
                disabled={confirming}
                aria-pressed={sameDay(d, date)}
              >
                <span>{dateChipLabel(d, today)}</span>
                <strong>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</strong>
              </button>
            ))}
          </div>
        </div>

        <span className="rsv-control-divider" aria-hidden="true" />

        <div className="rsv-control">
          <span className="rsv-control-label">Select Time</span>
          <div className="rsv-chips" role="group" aria-label="Select time">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`rsv-chip rsv-time-chip ${time === slot ? 'is-active' : ''}`}
                onClick={() => changeTime(slot)}
                disabled={confirming}
                aria-pressed={time === slot}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Legend — always visible                                    */}
      {/* ---------------------------------------------------------- */}
      <div className="rsv-legendbar">
        <div className="rsv-legend" aria-label="Table status legend">
          <span><i className="is-available" /> Available</span>
          <span><i className="is-booked" /> Booked</span>
          <span><i className="is-selected" /> Selected</span>
        </div>
        <span className="rsv-legend-count">
          {availableCount} of {TABLES.length} tables available
        </span>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 3D floor                                                   */}
      {/* ---------------------------------------------------------- */}
      <div className="rsv-stage">
        <div className="rsv-canvas" aria-hidden="true">
          <RestaurantScene
            availability={availability}
            selectedId={selectedId}
            resetKey={resetKey}
            onSelectTable={handleSelectTable}
            onHoverTable={handleHoverTable}
            onHoverEnd={handleHoverEnd}
            onBookedTable={handleBookedTable}
            onMiss={() => {
              if (!confirming) setSelectedId(null);
            }}
          />
        </div>

        <button
          type="button"
          className="rsv-reset"
          onClick={() => {
            setResetKey((k) => k + 1);
            setHover(null);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 0 0-14-3L4 8M4 15a8 8 0 0 0 14 3l2-2" />
          </svg>
          Reset view
        </button>

        <p className="rsv-stage-hint">
          Drag to rotate · Scroll or pinch to zoom · Right-drag to pan
        </p>

        {selectedTable && (
          <aside className="rsv-selection-card" aria-live="polite">
            <span className="rsv-selection-state"><i className="rsv-dot is-selected" />Selected</span>
            <strong>Table {selectedTable.id}</strong>
            <p>{selectedTable.seats} Seats · {tableLocation(selectedTable)}</p>
          </aside>
        )}

        {hover && hoverTable && (
          <div className="rsv-tooltip rsv-glass" style={tooltipStyle} role="status">
            <div className="rsv-tooltip-head">
              <strong>Table {hoverTable.id}</strong>
              <i className={`rsv-dot is-${hoverStatus}`} />
            </div>
            <p className="rsv-tooltip-meta">
              {hoverTable.seats} Seats · {tableLocation(hoverTable)}
            </p>
            <p className={`rsv-tooltip-status is-${hoverStatus}`}>
              Status: <strong>{hoverStatus === 'booked' ? 'Booked' : hoverStatus === 'selected' ? 'Selected' : 'Available'}</strong>
              {hoverStatus === 'available' && <span className="rsv-tooltip-hint">Click to select</span>}
              {hoverStatus === 'booked' && <span className="rsv-tooltip-hint">Unavailable</span>}
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Footer bar                                                 */}
      {/* ---------------------------------------------------------- */}
      <footer className="rsv-footer">
        <div className="rsv-footer-pick">
          <span className="rsv-footer-label">Selected</span>
          {selectedTable ? (
            <div className="rsv-footer-selected">
              <strong>Table {selectedTable.id}</strong>
              <span>{selectedTable.seats} Seats</span>
              <span>{tableLocation(selectedTable)}</span>
              <span className="rsv-footer-time">{time}</span>
              <button
                type="button"
                className="rsv-footer-clear"
                onClick={() => setSelectedId(null)}
                disabled={confirming}
                aria-label="Clear selected table"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className="rsv-footer-empty">No table selected — tap a green table on the floor</p>
          )}
        </div>

        <div className="rsv-footer-action">
          <p className="rsv-footer-when">
            <strong>{formatDateShort(date)}</strong>
            <span>{time}</span>
          </p>
          <button
            type="button"
            className="rsv-confirm"
            onClick={handleConfirm}
            disabled={!selectedTable || confirming}
          >
            <span>{confirming ? 'Holding table…' : 'Confirm Booking'}</span>
            {!confirming && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </footer>

      {/* ---------------------------------------------------------- */}
      {/* My Booking modal                                           */}
      {/* ---------------------------------------------------------- */}
      {bookingOpen && createPortal(
        <div
          className="rsv-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBookingOpen(false);
          }}
        >
          <div className="rsv-modal rsv-glass" role="dialog" aria-modal="true" aria-label="My booking">
            <div className="rsv-modal-head">
              <div>
                <p className="rsv-eyebrow"><span className="rsv-eyebrow-line" />My booking</p>
                <h2>{result ? 'Your reservation' : 'Your selection'}</h2>
              </div>
              <button
                type="button"
                className="rsv-modal-close"
                onClick={() => setBookingOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {result ? (
              <>
                <div className="rsv-confirmed-note">
                  <span className="rsv-dot is-booked" />
                  <p>Table {result.tableId} is confirmed for {formatDateShort(result.date)} at {result.time}.</p>
                </div>
                <SummaryRows date={result.date} time={result.time} tableId={result.tableId} />
                <div className="rsv-code">
                  <span className="rsv-label">Reservation ID</span>
                  <strong>{result.code}</strong>
                </div>
                <p className="rsv-fine">{RESTAURANT.address}</p>
                <button type="button" className="rsv-cta" onClick={() => setBookingOpen(false)}>
                  <span>Done</span>
                </button>
              </>
            ) : selectedTable ? (
              <>
                <SummaryRows date={date} time={time} tableId={selectedTable.id} />
                <button
                  type="button"
                  className="rsv-cta"
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  <span>{confirming ? 'Holding table…' : 'Confirm Booking'}</span>
                  {!confirming && <span className="rsv-cta-arrow">→</span>}
                </button>
                <button type="button" className="rsv-btn-text" onClick={() => setBookingOpen(false)}>
                  Keep browsing
                </button>
              </>
            ) : (
              <>
                <p className="rsv-empty-copy">
                  You have not selected a table yet. Green tables are available for{' '}
                  {formatDateShort(date)} at {time}.
                </p>
                <div className="rsv-summary is-tight">
                  <div className="rsv-summary-row">
                    <span>Date</span>
                    <strong>{formatDateLong(date)}</strong>
                  </div>
                  <div className="rsv-summary-row">
                    <span>Time</span>
                    <strong>{time}</strong>
                  </div>
                  <div className="rsv-summary-row">
                    <span>Available</span>
                    <strong className="is-accent">{availableCount} tables</strong>
                  </div>
                </div>
                <button type="button" className="rsv-cta" onClick={() => setBookingOpen(false)}>
                  <span>Choose a table</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* ---------------------------------------------------------- */}
      {/* Success                                                    */}
      {/* ---------------------------------------------------------- */}
      {successOpen && result && createPortal(
        <div className="rsv-modal-backdrop is-success">
          <div
            className="rsv-success rsv-glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rsv-success-title"
          >
            <div className="rsv-success-check" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 12.5L9.5 18L20 6" />
              </svg>
            </div>
            <p className="rsv-eyebrow is-centered"><span className="rsv-eyebrow-line" />Table held</p>
            <h2 id="rsv-success-title">Reservation Confirmed</h2>
            <p className="rsv-success-copy">
              Your table <strong>{result.tableId}</strong> has been reserved successfully.
            </p>

            <div className="rsv-success-facts">
              <div><span>Date</span><strong>{formatDateLong(result.date)}</strong></div>
              <div><span>Time</span><strong>{result.time}</strong></div>
              <div><span>Seats</span><strong>{result.seats}</strong></div>
            </div>

            <div className="rsv-code">
              <span className="rsv-label">Reservation ID</span>
              <strong>{result.code}</strong>
            </div>

            <div className="rsv-success-actions">
              <button
                type="button"
                className="rsv-cta"
                onClick={() => {
                  setSuccessOpen(false);
                  setBookingOpen(true);
                }}
              >
                <span>View Reservation</span>
              </button>
              <button type="button" className="rsv-btn-text" onClick={() => setSuccessOpen(false)}>
                Back to the floor
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}
