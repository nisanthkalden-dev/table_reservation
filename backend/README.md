# Django Table Reservation Backend

A Django REST Framework backend designed for the table reservation system (CINDRE).
Built without modifying the frontend, ensuring drop-in compatibility with frontend data structures and error expectations.

---

## 📌 Architecture & Design

### Models
1. **`TableType`**:
   - Represents dining experiences:
     - `indoor-noir`: Indoor Noir (Tables 1-14, 2-6 guests)
     - `chefs-counter`: Chef's Counter (Seats 1-8, 1-2 guests)
     - `garden-terrace`: Garden Terrace (Tables 15-24, 2-8 guests)
     - `rooftop-private`: Rooftop Private (Rooms 25-28, 4-12 guests)
2. **`Reservation`**:
   - Fields: `booking_code`, `name`, `phone`, `table_type`, `table_number`, `date`, `time_slot`, `guests`, `occasion`, `status`, `notes`, `created_at`, `updated_at`.
   - **Constraint**: `unique_table_reservation_slot` across `(table_number, date, time_slot)` to prevent double booking.
   - Generates unique reservation codes format `CINDRE-XXXXXX`.

---

## 🚀 Quickstart

### 1. Requirements & Setup
Ensure Python 3.10+ is installed.

```bash
cd backend
pip install -r requirements.txt
```

### 2. Apply Migrations & Seed Initial Table Data
```bash
python manage.py migrate
python manage.py seed_tables
```

### 3. Create Admin Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 4. Run Development Server
```bash
python manage.py runserver 8000
```
Server runs at `http://127.0.0.1:8000/`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tables/` | List all available seating ambiances & specs |
| `GET` | `/api/reservations/` | List reservations (filterable by `date`, `phone`, `time_slot`, etc.) |
| `POST` | `/api/reservations/` | Create a new reservation (supports single object or Supabase list payload) |
| `GET` | `/api/reservations/availability/?date=YYYY-MM-DD` | Get slots and current booked reservations for date |
| `GET/POST` | `/rest/v1/reservations` | Supabase / PostgREST compatible endpoint route |
| `GET` | `/admin/` | Django Admin Dashboard |

---

## 🧪 Running Tests
```bash
python manage.py test
```
All 4 test suites verify single booking, list booking, double-booking prevention with error code `23505`, and availability checks.
