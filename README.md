# StayScape — Full-Stack Stays Marketplace

<p align="center">
  <strong>A modern Airbnb-inspired platform for discovering stays, managing properties, and booking trips.</strong>
</p>

<p align="center">
  <a href="https://airbnb-clone-alpha-five.vercel.app/">🌐 Live Demo</a> ·
  <a href="https://github.com/Bhavanayadav51/airbnb-clone">📂 Source Code</a> ·
  <a href="https://airbnb-clone-z3iv.onrender.com/docs">📘 API Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Frontend-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/SQLAlchemy-ORM-red" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite" alt="SQLite" />
</p>

## Overview

StayScape is a full-stack vacation rental marketplace developed as an SDE full-stack assignment. It recreates the core browsing, search, property management, and booking experience of a modern accommodation platform.

The application combines a responsive Next.js frontend with a Python FastAPI backend and a relational SQLite database. It supports separate guest and host workflows, authenticated actions, reservation validation, and persistent application data within the configured database.

**Live application:** https://airbnb-clone-alpha-five.vercel.app/

## Key Features

### Explore and Search
- Browse photo-rich property listings.
- Search and filter by destination, dates, guests, price, property type, and amenities.
- View detailed property information, amenities, host details, and reviews.
- Navigate property details and availability.

### Authentication and Sessions
- Register as a guest or host.
- Sign in with email and password.
- Store passwords as PBKDF2-SHA256 hashes.
- Use expiring, revocable bearer-token sessions.
- Verify accounts through a six-digit demonstration code.

### Booking Workflow
- Validate check-in, check-out, and guest counts.
- Prevent overlapping confirmed reservations.
- Calculate nightly totals and a 14% service fee.
- View trips and cancel reservations.
- Reflect confirmed reservations in listing availability.

### Host Dashboard
- Create, view, edit, and delete owned listings.
- Manage property information, pricing, amenities, and images.
- View reservations for hosted properties.
- Review guest and booking information.

### Additional Features
- Per-account wishlist.
- Host and guest messaging associated with reservations.
- Booking and message notifications.
- Mark notifications as read.
- Light and dark themes.
- Responsive marketplace interface.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| ORM | SQLAlchemy |
| Database | SQLite |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## Architecture

```text
                   User / Browser
                         |
                         v
              Next.js + TypeScript
                  (Vercel)
                         |
                    HTTP / JSON
                         |
                         v
                FastAPI REST API
                  (Render)
                         |
                         v
                    SQLAlchemy
                         |
                         v
                      SQLite
```

The frontend communicates with the backend through API requests. Protected operations use bearer sessions, while the backend determines the authenticated user and checks resource ownership before allowing sensitive actions.

## Database Design

The application uses a relational schema with the following main tables:

| Table | Responsibility |
|---|---|
| `users` | User profiles, password hashes, and verification status |
| `auth_sessions` | Session expiration and revocation |
| `listings` | Property information, pricing, amenities, and images |
| `bookings` | Reservations, dates, guests, totals, and status |
| `notifications` | Booking and message notifications |
| `messages` | Reservation-linked conversations |
| `reviews` | Property reviews and ratings |
| `wishlist` | Saved listings for each user |

**Booking integrity:** Check-in dates are inclusive and check-out dates are exclusive. Confirmed reservations cannot overlap for the same property, and cancelled bookings no longer block dates.

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Bhavanayadav51/airbnb-clone.git
cd airbnb-clone
```

### 2. Set up the backend

On Windows PowerShell:

```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Set up the frontend

Open a second terminal from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### 4. Configure the API URL

For local development, the frontend defaults to `http://127.0.0.1:8000`.

For a separately hosted deployment, configure the frontend environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

Use your actual backend URL. Configure the corresponding production variable in Vercel and redeploy after changes.

### 5. Run production checks

From the `frontend` directory:

```bash
npm run lint
npm run build
```

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register an account |
| POST | `/auth/verify-email` | Verify the demo code |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Revoke a session |
| GET | `/listings` | Search and filter listings |
| GET | `/listings/{listing_id}` | Retrieve listing details |
| GET | `/listings/{listing_id}/booked-dates` | Retrieve booked dates |
| POST / PUT / DELETE | `/listings` and `/listings/{listing_id}` | Manage listings |
| POST | `/bookings` | Create a reservation |
| GET | `/bookings` | Retrieve guest trips |
| DELETE | `/bookings/{booking_id}` | Cancel a reservation |
| GET | `/host/listings` | Retrieve host properties |
| GET | `/host/bookings` | Retrieve host reservations |
| GET | `/notifications` | Retrieve notifications |
| GET / POST | `/conversations/{booking_id}/messages` | Read or send messages |
| GET | `/wishlist` | Retrieve saved listings |

See the live API documentation for the available request schemas and responses.

## Important Demo Limitations

- **Email verification:** The six-digit code is displayed by the application; it is not delivered through a real email provider.
- **Payments:** Checkout is simulated. No payment is collected or processed.
- **Database persistence:** The deployed backend uses SQLite. Its data may be lost when a temporary hosting filesystem is reset or the service is redeployed. Persistent storage is needed for reliable production data retention.
- **Security hardening:** The project is an assignment/demo implementation. Production use would require additional measures such as rate limiting, account recovery, hardened session handling, and real email verification.

## Assignment Context

This project was built to demonstrate full-stack development skills across frontend engineering, REST API design, relational database modeling, authentication, reservation validation, and deployment.

The implementation focuses on functional browse/search/booking workflows and host property management while using mock services where real payment and email integrations are outside the assignment scope.

## Future Improvements

- Integrate a real email verification provider.
- Add automated backend API and frontend integration tests.
- Move production data to a managed database or persistent storage.
- Add a real payment provider in a suitable production environment.
- Improve accessibility and expand responsive UI testing.
- Add automated CI checks for pull requests.

---

**Built with Next.js, TypeScript, FastAPI, and SQLite.**
