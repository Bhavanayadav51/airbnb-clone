# Airbnb-style stays marketplace

A full-stack, Airbnb-inspired stays marketplace built with Next.js, TypeScript, FastAPI, SQLAlchemy, and SQLite. It includes seeded property listings and mock guest/host accounts so the main flows can be explored locally without connecting to external services.

## Features

- Browse photo-forward listing cards and search by destination, dates, and guest count.
- Filter by property type, nightly price, and amenities; browse paginated search results.
- Open listing details with a photo gallery, host details, amenities, reviews, availability calendar, and price breakdown.
- Book a date range with guest/date validation, overlap prevention, mock checkout, and confirmation.
- View and cancel reservations in Trips; confirmed reservations block the listing calendar.
- Save listings to a wishlist.
- Create, edit, and delete host listings; review reservations in the host dashboard.
- Switch between seeded guest and host accounts using the account menu.

Payments, authentication, messaging, and maps are intentionally mocked or presented as placeholders.

## Tech stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy
- **Database:** SQLite

## Run locally (Windows)

Run the backend and frontend in separate terminals from the repository root.

### Backend

```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`. On first startup, the app creates `backend/airbnb.db` and seeds users, listings, reviews, and sample reservations. The database file is ignored by Git.

To discard local database data and recreate the seeded database:

```powershell
cd backend
python reset_db.py
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend uses `NEXT_PUBLIC_API_URL` when set and otherwise calls `http://127.0.0.1:8000`. For a separately hosted frontend and backend, set `NEXT_PUBLIC_API_URL` to the backend's public base URL before building the frontend.

Production frontend checks:

```powershell
npm run lint
npm run build
```

## Architecture

The Next.js App Router provides the explore, listing detail, trips, wishlist, and host routes. Reusable client components handle search/filter controls, cards, galleries, date picking, checkout, and listing forms. `frontend/lib/api.ts` centralizes browser-to-API requests and shared data types; `frontend/lib/AppContext.tsx` stores the selected mock user, wishlist, and toast notifications.

FastAPI exposes JSON endpoints from `backend/main.py`. SQLAlchemy models and the SQLite engine are defined in `backend/models.py` and `backend/database.py`. Startup creates the schema and seeds an empty database from `backend/seed.py`.

## Database schema

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `users` | Mock guest and host accounts | Hosts own listings; guests make bookings and reviews |
| `listings` | Property details, nightly price, amenities, and image URLs | Each listing belongs to a host |
| `bookings` | Guest reservations, dates, guests, total, and status | Each booking belongs to one listing and one guest |
| `reviews` | Listing rating and written feedback | Each review belongs to a listing and user |
| `wishlist` | User's saved listings | Unique `(user_id, listing_id)` pair |

Bookings use `check_in` inclusive and `check_out` exclusive date semantics. Confirmed bookings prevent overlapping reservations; cancelled bookings no longer block dates. The mock checkout calculates the nightly subtotal plus a 14% service fee.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/users` | List mock accounts for account switching |
| `GET` | `/listings` | Search/filter listings and paginate results |
| `GET` | `/listings/{listing_id}` | Listing details and reviews |
| `GET` | `/listings/{listing_id}/booked-dates` | Dates blocked by confirmed bookings |
| `POST` | `/listings` | Create a host listing |
| `PUT` | `/listings/{listing_id}` | Update a host listing |
| `DELETE` | `/listings/{listing_id}?host_id=...` | Delete a host listing |
| `POST` | `/bookings` | Validate availability and create a reservation |
| `GET` | `/bookings?guest_id=...` | List a guest's trips |
| `DELETE` | `/bookings/{booking_id}?guest_id=...` | Cancel a guest's reservation |
| `GET` | `/host/{host_id}/listings` | List a host's properties |
| `GET` | `/host/{host_id}/bookings` | List reservations for a host's properties |
| `GET` | `/wishlist?user_id=...` | List a user's saved listings |
| `POST` | `/wishlist/toggle?user_id=...&listing_id=...` | Save or remove a listing |

## Assumptions and deployment notes

- User selection is a demo substitute for authentication. IDs supplied to the API are not secure identity claims; add real authentication and authorization before production use.
- Listing photos are stored as URLs. Seed content and external image URLs require network access in the browser.
- SQLite is suitable for local evaluation. A hosted deployment should use a persistent volume for SQLite or a managed database so bookings survive restarts; configure the frontend API URL and backend CORS policy for the chosen deployment domains.
- Deployment configuration is not included; publish the repository and deploy the frontend/backend separately to provide the requested submission URLs.
