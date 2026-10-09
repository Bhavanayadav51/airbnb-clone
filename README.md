# Airbnb-style stays marketplace

A full-stack, Airbnb-inspired stays marketplace built with Next.js, TypeScript, FastAPI, SQLAlchemy, and SQLite. It includes listing search, persistent accounts, verified-email demo flows, reservations, host tools, notifications, and host/guest messaging.

## Features

- Browse and filter photo-forward listings by destination, dates, guests, price, property type, and amenities.
- Switch between light and dark mode; your theme choice is saved in the browser.
- Create an account as a guest or host, sign in with an email and password, and keep an individual profile and wishlist.
- Passwords are stored as PBKDF2-SHA256 hashes; API access uses expiring, revocable bearer sessions.
- Verify an email address with a six-digit demo code. No email is sent: the local demo displays the code after registration and when a code is resent.
- Book stays with date and guest validation, overlap prevention, a detailed price summary, and mock checkout. No card details are collected and no payment is processed.
- View and cancel reservations in Trips; confirmed reservations block the listing calendar.
- Create, edit, and delete owned host listings. The host dashboard shows property reservations, dates, guest names, and guest email-verification status.
- Get saved booking and message notifications, review them, and mark them read.
- Message the host or guest for a reservation from Trips or the host dashboard.
- Save listings to a personal wishlist.

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

The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`. Startup creates `backend/airbnb.db`, upgrades the existing users table with nullable account fields, and seeds listings and example reservations when needed. Seed galleries use a varied shared pool of Unsplash property photos, with distinct cover photos for the demo listings. On startup, old generated galleries for seeded listings are refreshed; host-selected images are preserved. To use a separate SQLite file, set `AIRBNB_DB_PATH` before starting the backend.

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

## Account and verification flow

Use **Sign in** in the account menu to sign in or create a guest/host account. New users choose their account type at registration. The demo verification code is displayed on screen and expires after 10 minutes; use **Resend demo code** if it expires. After verification, the account remains signed in for up to 30 days unless the user signs out.

The email verification code is intentionally mocked for this project: it is not delivered to an inbox, and the demo API returns it to the UI. Replace that path with a real email provider before production. Existing seeded sample accounts are listing/review content, not login accounts; create a new account to use protected features.

## Architecture

The Next.js App Router provides explore, listing detail, trips, wishlist, host, authentication, notifications, and messages routes. `frontend/lib/api.ts` adds the current bearer token to browser API calls; `frontend/lib/AppContext.tsx` restores the signed-in user and stores the per-account wishlist. Reusable client components implement search/filter controls, checkout, listing management, notifications, and conversations.

FastAPI routes are defined in `backend/main.py`. SQLAlchemy models and the SQLite engine are in `backend/models.py` and `backend/database.py`. Startup creates new tables and adds account columns to the pre-existing users table without requiring deletion of the local database.

## Database schema

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `users` | User profile, email, password hash, and email-verification state | Hosts own listings; guests make bookings |
| `auth_sessions` | Hashed revocable bearer sessions and expiration | Each session belongs to one user |
| `listings` | Property details, nightly price, amenities, and image URLs | Each listing belongs to a host |
| `bookings` | Guest reservations, dates, guest count, total, and status | Each booking belongs to a listing and guest |
| `notifications` | Booking and message updates, read state, and destination | Each notification belongs to a recipient |
| `messages` | Host/guest messages associated with a booking | Each message belongs to a booking and sender |
| `reviews` | Listing rating and written feedback | Each review belongs to a listing and user |
| `wishlist` | A user's saved listings | Unique `(user_id, listing_id)` pair |

Bookings use `check_in` inclusive and `check_out` exclusive date semantics. Confirmed bookings prevent overlapping reservations; cancelled bookings no longer block dates. The mock checkout calculates the nightly subtotal plus a 14% service fee.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a guest or host account and return its demo verification code |
| `POST` | `/auth/verify-email` | Verify the code and create a signed-in session |
| `POST` | `/auth/resend-verification` | Issue a new demo verification code |
| `POST` | `/auth/login` | Verify credentials and create a session |
| `GET` | `/auth/me` | Return the authenticated user's profile |
| `POST` | `/auth/logout` | Revoke the current session |
| `GET` | `/listings` | Search/filter listings and paginate results |
| `GET` | `/listings/{listing_id}` | Listing details and reviews |
| `GET` | `/listings/{listing_id}/booked-dates` | Dates blocked by confirmed bookings |
| `POST`, `PUT`, `DELETE` | `/listings`, `/listings/{listing_id}` | Create or manage a host's own listing |
| `POST` | `/bookings` | Validate availability and create a reservation |
| `GET` | `/bookings` | List the signed-in guest's trips |
| `DELETE` | `/bookings/{booking_id}` | Cancel the signed-in guest's reservation |
| `GET` | `/host/listings` | List the signed-in host's properties |
| `GET` | `/host/bookings` | List reservations for the signed-in host's properties |
| `GET` | `/notifications` | List the signed-in user's notifications |
| `POST` | `/notifications/{notification_id}/read` | Mark one notification as read |
| `GET` | `/conversations` | List reservations with host/guest conversations |
| `GET`, `POST` | `/conversations/{booking_id}/messages` | Read or send messages for a reservation |
| `GET` | `/wishlist` | List the signed-in user's saved listings |
| `POST` | `/wishlist/toggle?listing_id=...` | Save or remove a listing |

Protected routes derive the user identity from the bearer session; they do not trust user or host IDs supplied by the browser.

## Production notes

- Email verification and payment are demos, not real delivery or payment services. The displayed verification code is for local testing only.
- The browser stores a bearer token in local storage. For production, use HTTPS, a carefully configured session strategy, explicit CORS origins, rate limits, secure secret management, account recovery, and a real email verification provider.
- SQLite is suitable for local evaluation. A hosted deployment should use a persistent volume or managed database so account and booking data survive restarts.
- Seed content and external image URLs require network access in the browser. Deployment configuration is not included.
