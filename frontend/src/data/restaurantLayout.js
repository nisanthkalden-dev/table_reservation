/**
 * Static restaurant floor plan + reservation domain data.
 *
 * Table positions live in metres on an X/Z plan (Y is up). This module is the
 * single source of truth shared by the 3D scene and the reservation UI, so the
 * diagram can later be fed by a real backend without touching the renderer.
 */

export const RESTAURANT = {
  name: 'CINDRE',
  tagline: 'Live-fire dining, forty-two seats a night',
  description:
    'An intimate dining room built around an open hearth. Choose your table and we will take care of the rest.',
  address: '119 Ashcroft Lane, Lower Marsh District',
};

export const ROOM = { width: 18, depth: 13, wallHeight: 2.9 };

export const TIME_SLOTS = ['7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];

export const ZONES = {
  window: {
    label: 'Window Side',
    note: 'Along the glass, overlooking the courtyard.',
  },
  center: {
    label: 'Center Hall',
    note: 'Beneath the pendant lights, at the heart of the room.',
  },
  pass: {
    label: "Chef's Pass",
    note: 'A front-row seat to the open kitchen.',
  },
  bar: {
    label: 'Bar Side',
    note: 'Close to the bar — warm, lively and just off the lounge.',
  },
  lounge: {
    label: 'Lounge Side',
    note: 'Beside the lounge, with the glow of the room on one side.',
  },
};

/**
 * shape: 'round' | 'square' | 'rect'
 * rot: rotation around Y in radians (rectangular tables only)
 */
export const TABLES = [
  { id: 'T01', x: -6.9, z: -3.6, seats: 2, shape: 'round', radius: 0.55, zone: 'window' },
  { id: 'T02', x: -6.9, z: -1.0, seats: 2, shape: 'round', radius: 0.55, zone: 'window' },
  { id: 'T03', x: -6.9, z: 1.8, seats: 2, shape: 'round', radius: 0.55, zone: 'window' },
  { id: 'T04', x: -6.8, z: 4.6, seats: 4, shape: 'rect', w: 1.7, d: 0.95, rot: 0, zone: 'window' },

  { id: 'T05', x: -3.5, z: -3.6, seats: 4, shape: 'square', w: 1.15, d: 1.15, zone: 'bar' },
  { id: 'T06', x: -3.4, z: -1.0, seats: 4, shape: 'round', radius: 0.78, zone: 'bar' },
  { id: 'T07', x: -3.5, z: 1.8, seats: 4, shape: 'square', w: 1.15, d: 1.15, zone: 'center' },
  { id: 'T08', x: -3.4, z: 4.6, seats: 4, shape: 'round', radius: 0.62, zone: 'center' },

  { id: 'T09', x: 0.2, z: -3.6, seats: 6, shape: 'rect', w: 2.15, d: 0.95, rot: 0, zone: 'pass' },
  { id: 'T10', x: 0.2, z: -1.0, seats: 4, shape: 'round', radius: 0.78, zone: 'center' },
  { id: 'T11', x: 0.2, z: 1.8, seats: 8, shape: 'rect', w: 2.75, d: 0.95, rot: 0, zone: 'center' },
  { id: 'T12', x: 0.3, z: 4.6, seats: 4, shape: 'square', w: 1.15, d: 1.15, zone: 'center' },

  { id: 'T13', x: 3.9, z: -3.6, seats: 4, shape: 'square', w: 1.15, d: 1.15, zone: 'pass' },
  { id: 'T14', x: 3.9, z: -1.0, seats: 2, shape: 'round', radius: 0.55, zone: 'lounge' },
  { id: 'T15', x: 3.9, z: 1.8, seats: 4, shape: 'square', w: 1.15, d: 1.15, zone: 'lounge' },
  { id: 'T16', x: 4.0, z: 4.6, seats: 8, shape: 'rect', w: 2.45, d: 1.05, rot: 0, zone: 'lounge' },
];

export const TABLE_BY_ID = Object.fromEntries(TABLES.map((t) => [t.id, t]));

/** Footprint radius used for glow pools / rings. */
export function footprint(table) {
  if (table.shape === 'round') return table.radius;
  return Math.max(table.w, table.d) / 2;
}

export function tableLocation(table) {
  return ZONES[table.zone]?.label ?? 'Dining Room';
}

/** Local YYYY-MM-DD (never UTC-shifted, unlike toISOString). */
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLong(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function hashString(input) {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Deterministic stand-in for a live availability API. Same date + time always
 * returns the same floor plan, so the scene never flickers between renders.
 * `bookedIds` lets the UI apply reservations made in this session on top of the
 * baseline, and can be replaced by a fetch against /api/availability later.
 */
export function tableStatus(table, dateKey, time, bookedIds = []) {
  if (bookedIds.includes(table.id)) return 'booked';
  const h = hashString(`${table.id}|${dateKey}|${time}`);
  if (h % 4 === 0 || h % 11 === 0) return 'booked';
  return 'available';
}

export function buildAvailability(dateKey, time, bookedIds = []) {
  const map = {};
  TABLES.forEach((table) => {
    map[table.id] = tableStatus(table, dateKey, time, bookedIds);
  });
  return map;
}

/** Seating positions in the table's local space (already facing the table). */
export function seatPositions(table) {
  const seats = [];
  if (table.shape === 'round') {
    const r = table.radius + 0.4;
    for (let i = 0; i < table.seats; i += 1) {
      const a = (i / table.seats) * Math.PI * 2;
      seats.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, rot: a + Math.PI });
    }
    return seats;
  }

  const { w, d } = table;
  if (table.seats <= 4) {
    seats.push({ x: 0, z: d / 2 + 0.38, rot: Math.PI });
    seats.push({ x: 0, z: -d / 2 - 0.38, rot: 0 });
    seats.push({ x: w / 2 + 0.38, z: 0, rot: -Math.PI / 2 });
    seats.push({ x: -w / 2 - 0.38, z: 0, rot: Math.PI / 2 });
    return seats;
  }

  const perSide = Math.ceil(table.seats / 2);
  const ends = table.seats % 2 === 0 ? 0 : 2;
  for (let i = 0; i < perSide; i += 1) {
    const x = -w / 2 + (w / (perSide + 1)) * (i + 1);
    seats.push({ x, z: d / 2 + 0.38, rot: Math.PI });
    seats.push({ x, z: -d / 2 - 0.38, rot: 0 });
  }
  for (let i = 0; i < ends; i += 1) {
    const sign = i === 0 ? 1 : -1;
    seats.push({ x: sign * (w / 2 + 0.38), z: 0, rot: sign > 0 ? -Math.PI / 2 : Math.PI / 2 });
  }
  return seats;
}
