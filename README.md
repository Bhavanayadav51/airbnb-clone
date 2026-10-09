# Airbnb Clone

A full-stack Airbnb-style web app. Guests can browse and search stays, view listing details, book a date range, and see their trips. Hosts can create, edit and delete their own listings and see reservations.

- **Live demo:** https://YOUR-APP.vercel.app
- **API docs:** https://YOUR-API.onrender.com/docs
- **GitHub:** https://github.com/YOUR-USERNAME/airbnb-clone

> The backend is on a free host that sleeps when idle, so the first request can take 30-60 seconds.

## Features

- **Home and search:** city rows, search bar (location, dates, guests), category row, price and amenity filters, "Show more" pagination
- **Listing page:** photo gallery, description, host info, amenities, availability calendar, price breakdown, reviews, map
- **Booking:** date and guest validation, no overlapping dates, mocked checkout, confirmation, "My Trips" with cancellation
- **Host:** dashboard of own listings and reservations, create / edit / delete listings
- **Airbnb experience:** wishlist, toast notifications, modals, loading states
- **Guest vs host:** account switcher in the top-right menu (mocked login)

## Tech stack

| Part | Technology |
|---|---|
| Frontend | Next.js (TypeScript), Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite |
| Hosting | Vercel (frontend), Render (backend) |

## Setup

Requirements: Python 3.10+, Node.js 20+.

**1. Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at http://127.0.0.1:8000 (API docs at `/docs`). On first start the database is created and seeded automatically (3 users, 60 listings in 6 cities, reviews, and 2 existing bookings). To reset the data: `python reset_db.py`.

**2. Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Open http://localhost:3000.

**Demo accounts** (switch in the top-right menu): Bhavana (guest), Aarav (host), Meera (host).

## Architecture

The frontend (Next.js) shows the UI and calls the backend (FastAPI) over REST/JSON. The backend owns all data and rules (availability, validation, ownership) and stores everything in SQLite.

```
airbnb-clone/
├── backend/
│   ├── main.py         # API endpoints and business rules
│   ├── models.py       # database tables
│   ├── database.py     # DB connection
│   ├── seed.py         # sample data
│   └── reset_db.py     # wipe and reseed
└── frontend/
    ├── app/            # pages (/, /listing/[id], /trips, /wishlist, /host ...)
    ├── components/     # reusable UI (cards, calendar, modals, forms)
    └── lib/            # API helper, shared state, date utils
```

- All API calls go through one helper (`lib/api.ts`).
- Search and filters are stored in the URL, so results can be shared.
- Current user, wishlist and toasts are kept in one React context.

## Database schema

| Table | Columns | Relationships |
|---|---|---|
| `users` | id, name, role (guest/host), avatar | |
| `listings` | id, host_id, title, description, location, property_type, price_per_night, max_guests, bedrooms, amenities (JSON), images (JSON), created_at | `host_id` -> users |
| `bookings` | id, listing_id, guest_id, check_in, check_out, guests, total_price, status (confirmed/cancelled), created_at | `listing_id` -> listings, `guest_id` -> users |
| `reviews` | id, listing_id, user_id, rating (1-5), comment, created_at | -> listings, -> users |
| `wishlist` | id, user_id, listing_id (unique pair) | -> users, -> listings |

One host has many listings. A listing has many bookings and reviews. A listing's rating is the average of its reviews.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/listings` | Search and paginate (`q`, `min_price`, `max_price`, `property_type`, `guests`, `amenities`, `check_in`, `check_out`, `page`) |
| GET | `/listings/{id}` | Listing details with reviews |
| GET | `/listings/{id}/booked-dates` | Occupied nights for the calendar |
| POST / PUT / DELETE | `/listings`, `/listings/{id}` | Host CRUD (owner only) |
| POST | `/bookings` | Create a booking |
| GET | `/bookings?guest_id=` | My Trips |
| DELETE | `/bookings/{id}?guest_id=` | Cancel a booking |
| GET | `/host/{id}/listings` | Host's listings |
| GET | `/host/{id}/bookings` | Reservations for a host |
| GET | `/wishlist?user_id=` | Saved listings |
| POST | `/wishlist/toggle` | Save / unsave a listing |

Full interactive docs are at `/docs`.

## Assumptions and design decisions

- **No overlapping bookings:** a booking conflicts when `existing.check_in < new.check_out AND existing.check_out > new.check_in`. The checkout day stays free for the next guest. The same rule hides unavailable listings in search.
- **Backend validation:** the calendar blocks bad dates, but the backend checks every booking again (dates, guest count, overlap, own listing) and returns clear errors.
- **Cancellation** sets the booking status to `cancelled` instead of deleting it. Only `confirmed` bookings block dates.
- **Price** = nights x nightly rate + 14% service fee, calculated by the backend.
- **Mocked login:** an account switcher replaces authentication. Host-only and owner-only rules are still enforced in the backend.
- **Mocked payment:** checkout is simulated, no real charge.
- **Images** are Unsplash placeholders; hosts add photos by URL.
- **Map** is an OpenStreetMap embed centred on the listing's city.
- **Free hosting:** the SQLite file resets when the backend restarts, so the seed runs again on startup. Bookings on the live demo may disappear after a restart.
- **UI** closely follows Airbnb's layout and interactions but is not pixel-exact.

## Placeholders (not implemented)

Messaging, identity verification, real payments, Experiences and Services tabs ("coming soon"), dark mode, and review submission after a stay.
