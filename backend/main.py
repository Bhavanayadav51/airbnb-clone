from datetime import date, datetime, timedelta, timezone
import hashlib
import hmac
import re
import secrets
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import or_, func, cast, String, text
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import models
from database import Base, engine, get_db
from seed import seed

Base.metadata.create_all(bind=engine)
with engine.begin() as connection:
    user_columns = {row[1] for row in connection.execute(text("PRAGMA table_info(users)"))}
    for column, definition in (
        ("email", "VARCHAR"),
        ("password_hash", "VARCHAR"),
        ("email_verified", "BOOLEAN NOT NULL DEFAULT 0"),
        ("verification_code_hash", "VARCHAR"),
        ("verification_expires_at", "DATETIME"),
    ):
        if column not in user_columns:
            connection.execute(text(f"ALTER TABLE users ADD COLUMN {column} {definition}"))
    connection.execute(text(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email_unique ON users(email) WHERE email IS NOT NULL"
    ))
app = FastAPI(title="Airbnb Clone API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
bearer = HTTPBearer(auto_error=False)


@app.on_event("startup")
def startup():
    seed()  # fills the DB on first run (important for hosts that reset the disk)


# ---------- request bodies ----------
class ListingIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=5000)
    location: str = Field(min_length=1, max_length=160)
    property_type: str = "House"
    price_per_night: float = Field(gt=0)
    max_guests: int = Field(default=2, ge=1, le=50)
    bedrooms: int = Field(default=1, ge=1, le=50)
    amenities: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list, min_length=1)


class BookingIn(BaseModel):
    listing_id: int = Field(gt=0)
    check_in: date
    check_out: date
    guests: int = Field(default=1, ge=1)


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: str = "guest"


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class EmailIn(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class VerifyEmailIn(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    code: str = Field(min_length=6, max_length=6)


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


# ---------- helpers ----------
def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def user_out(user: models.User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar,
        "email_verified": user.email_verified,
    }


def password_hash(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"


def password_matches(password: str, encoded: Optional[str]) -> bool:
    if not encoded:
        return False
    try:
        algorithm, salt_hex, digest_hex = encoded.split("$", 2)
        salt = bytes.fromhex(salt_hex)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    candidate = password_hash(password, salt).split("$", 2)[2]
    return hmac.compare_digest(candidate, digest_hex)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user: models.User, db: Session):
    token = secrets.token_urlsafe(48)
    db.add(models.AuthSession(
        user_id=user.id,
        token_hash=token_hash(token),
        expires_at=utcnow() + timedelta(days=30),
    ))
    return token


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(401, "Sign in to continue")
    session = db.query(models.AuthSession).filter_by(token_hash=token_hash(credentials.credentials)).first()
    if not session or session.expires_at <= utcnow():
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    user = db.get(models.User, session.user_id)
    if not user:
        raise HTTPException(401, "Account not found")
    return user


def require_verified(user: models.User) -> None:
    if not user.email_verified:
        raise HTTPException(403, "Verify your email address before continuing")


def add_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    booking_id: Optional[int] = None,
    actor_id: Optional[int] = None,
    link: str = "/notifications",
) -> None:
    db.add(models.Notification(
        user_id=user_id,
        actor_id=actor_id,
        booking_id=booking_id,
        title=title,
        message=message,
        link=link,
    ))


def listing_out(l: models.Listing, db: Session):
    avg = db.query(func.avg(models.Review.rating)).filter_by(listing_id=l.id).scalar()
    count = db.query(models.Review).filter_by(listing_id=l.id).count()
    return {
        "id": l.id, "title": l.title, "description": l.description, "location": l.location,
        "property_type": l.property_type, "price_per_night": l.price_per_night,
        "max_guests": l.max_guests, "bedrooms": l.bedrooms, "amenities": l.amenities,
        "images": l.images, "rating": round(avg, 2) if avg else None, "review_count": count,
        "host": {
            "id": l.host.id, "name": l.host.name, "avatar": l.host.avatar,
            "verified": bool(l.host.email_verified),
        },
    }


def booking_out(b: models.Booking):
    return {
        "id": b.id, "listing_id": b.listing_id, "listing_title": b.listing.title,
        "listing_image": b.listing.images[0] if b.listing.images else None,
        "location": b.listing.location, "guest_id": b.guest_id, "guest_name": b.guest.name,
        "guest_avatar": b.guest.avatar, "guest_verified": bool(b.guest.email_verified),
        "host_id": b.listing.host_id,
        "host_name": b.listing.host.name, "host_avatar": b.listing.host.avatar,
        "host_verified": bool(b.listing.host.email_verified),
        "check_in": b.check_in, "check_out": b.check_out, "guests": b.guests,
        "total_price": b.total_price, "status": b.status,
    }


def notification_out(notification: models.Notification):
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "link": notification.link,
        "booking_id": notification.booking_id,
        "read": notification.read_at is not None,
        "created_at": notification.created_at,
    }


def message_out(message: models.Message):
    return {
        "id": message.id,
        "booking_id": message.booking_id,
        "sender_id": message.sender_id,
        "sender_name": message.sender.name,
        "sender_avatar": message.sender.avatar,
        "body": message.body,
        "created_at": message.created_at,
    }


def get_participant_booking(booking_id: int, user: models.User, db: Session) -> models.Booking:
    booking = db.get(models.Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Reservation not found")
    if user.id not in (booking.guest_id, booking.listing.host_id):
        raise HTTPException(403, "You are not part of this conversation")
    return booking


def has_overlap(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    # two ranges overlap when each starts before the other ends
    return db.query(models.Booking).filter(
        models.Booking.listing_id == listing_id,
        models.Booking.status == "confirmed",
        models.Booking.check_in < check_out,
        models.Booking.check_out > check_in,
    ).first() is not None


# ---------- users ----------
@app.post("/auth/register", status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    name = body.name.strip()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(422, "Enter a valid email address")
    if not name:
        raise HTTPException(422, "Name cannot be blank")
    if body.role not in ("guest", "host"):
        raise HTTPException(422, "Choose guest or host as your account type")
    if db.query(models.User).filter(func.lower(models.User.email) == email).first():
        raise HTTPException(409, "An account with this email already exists")

    code = f"{secrets.randbelow(1_000_000):06d}"
    user = models.User(
        name=name,
        email=email,
        role=body.role,
        avatar=f"https://i.pravatar.cc/100?u={email}",
        password_hash=password_hash(body.password),
        verification_code_hash=hashlib.sha256(code.encode("utf-8")).hexdigest(),
        verification_expires_at=utcnow() + timedelta(minutes=10),
    )
    db.add(user)
    db.commit()
    return {
        "user": user_out(user),
        "message": "Enter the demo verification code to verify your email.",
        "verification_code": code,
    }


@app.post("/auth/verify-email")
def verify_email(body: VerifyEmailIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user or not user.verification_code_hash:
        raise HTTPException(400, "No pending email verification was found")
    if not user.verification_expires_at or user.verification_expires_at <= utcnow():
        raise HTTPException(400, "The verification code has expired. Register again for a new code.")
    supplied = hashlib.sha256(body.code.encode("utf-8")).hexdigest()
    if not hmac.compare_digest(supplied, user.verification_code_hash):
        raise HTTPException(400, "The verification code is incorrect")

    user.email_verified = True
    user.verification_code_hash = None
    user.verification_expires_at = None
    token = create_session(user, db)
    db.commit()
    return {"token": token, "user": user_out(user)}


@app.post("/auth/resend-verification")
def resend_verification(body: EmailIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user or user.email_verified:
        raise HTTPException(400, "No unverified account was found for that email")
    code = f"{secrets.randbelow(1_000_000):06d}"
    user.verification_code_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()
    user.verification_expires_at = utcnow() + timedelta(minutes=10)
    db.commit()
    return {"message": "A new demo verification code was created.", "verification_code": code}


@app.post("/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user or not password_matches(body.password, user.password_hash):
        raise HTTPException(401, "Email or password is incorrect")
    if not user.email_verified:
        raise HTTPException(403, "Verify your email before signing in")
    token = create_session(user, db)
    db.commit()
    return {"token": token, "user": user_out(user)}


@app.get("/auth/me")
def get_me(user: models.User = Depends(get_current_user)):
    return user_out(user)


@app.post("/auth/logout")
def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(models.AuthSession).filter_by(
        user_id=user.id,
        token_hash=token_hash(credentials.credentials if credentials else ""),
    ).first()
    if session:
        db.delete(session)
        db.commit()
    return {"logged_out": True}


# ---------- listings ----------
@app.get("/listings")
def search_listings(
    q: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None,
    property_type: Optional[str] = None, guests: Optional[int] = None,
    amenities: Optional[str] = None,
    check_in: Optional[date] = None, check_out: Optional[date] = None,
    page: int = 1, page_size: int = 12, db: Session = Depends(get_db),
):
    if page < 1 or not 1 <= page_size <= 100:
        raise HTTPException(400, "Page must be positive and page_size must be between 1 and 100")
    if min_price is not None and min_price < 0:
        raise HTTPException(400, "Minimum price cannot be negative")
    if max_price is not None and max_price < 0:
        raise HTTPException(400, "Maximum price cannot be negative")
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(400, "Minimum price cannot exceed maximum price")
    if (check_in is None) != (check_out is None):
        raise HTTPException(400, "Both check-in and check-out dates are required")
    if check_in and check_out:
        if check_in < date.today():
            raise HTTPException(400, "Check-in cannot be in the past")
        if check_out <= check_in:
            raise HTTPException(400, "Check-out must be after check-in")

    query = db.query(models.Listing)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Listing.location.ilike(like), models.Listing.title.ilike(like)))
    if min_price is not None:
        query = query.filter(models.Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(models.Listing.price_per_night <= max_price)
    if property_type:
        query = query.filter(models.Listing.property_type == property_type)
    if guests:
        query = query.filter(models.Listing.max_guests >= guests)
    if amenities:
        for a in amenities.split(","):
            query = query.filter(cast(models.Listing.amenities, String).like(f'%"{a.strip()}"%'))
    if check_in and check_out:
        booked = db.query(models.Booking.listing_id).filter(
            models.Booking.status == "confirmed",
            models.Booking.check_in < check_out,
            models.Booking.check_out > check_in,
        )
        query = query.filter(~models.Listing.id.in_(booked))

    total = query.count()
    items = query.order_by(models.Listing.id).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [listing_out(l, db) for l in items], "total": total, "page": page, "page_size": page_size}


@app.get("/listings/{listing_id}")
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    out = listing_out(l, db)
    reviews = db.query(models.Review).filter_by(listing_id=listing_id).order_by(models.Review.created_at.desc()).all()
    out["reviews"] = [{"id": r.id, "user": r.user.name, "avatar": r.user.avatar, "rating": r.rating,
                       "comment": r.comment, "created_at": r.created_at} for r in reviews]
    return out


@app.get("/listings/{listing_id}/booked-dates")
def booked_dates(listing_id: int, db: Session = Depends(get_db)):
    days = []
    for b in db.query(models.Booking).filter_by(listing_id=listing_id, status="confirmed").all():
        d = b.check_in
        while d < b.check_out:  # the checkout day itself stays free
            days.append(d.isoformat())
            d += timedelta(days=1)
    return days


@app.post("/listings", status_code=201)
def create_listing(
    body: ListingIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_verified(user)
    if user.role != "host":
        raise HTTPException(403, "Only hosts can create listings")
    if not body.title.strip() or not body.location.strip():
        raise HTTPException(422, "Title and location cannot be blank")
    l = models.Listing(**body.model_dump(), host_id=user.id)
    db.add(l)
    db.commit()
    db.refresh(l)
    return listing_out(l, db)


@app.put("/listings/{listing_id}")
def update_listing(
    listing_id: int,
    body: ListingIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    if l.host_id != user.id or user.role != "host":
        raise HTTPException(403, "Not your listing")
    require_verified(user)
    if not body.title.strip() or not body.location.strip():
        raise HTTPException(422, "Title and location cannot be blank")
    for k, v in body.model_dump().items():
        setattr(l, k, v)
    db.commit()
    return listing_out(l, db)


@app.delete("/listings/{listing_id}")
def delete_listing(
    listing_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    if l.host_id != user.id or user.role != "host":
        raise HTTPException(403, "Not your listing")
    require_verified(user)
    booking_ids = db.query(models.Booking.id).filter_by(listing_id=listing_id)
    db.query(models.Message).filter(models.Message.booking_id.in_(booking_ids)).delete(synchronize_session=False)
    db.query(models.Notification).filter(models.Notification.booking_id.in_(booking_ids)).delete(synchronize_session=False)
    for model in (models.Booking, models.Review, models.Wishlist):
        db.query(model).filter_by(listing_id=listing_id).delete()
    db.delete(l)
    db.commit()
    return {"deleted": True}


# ---------- bookings ----------
@app.post("/bookings", status_code=201)
def create_booking(
    body: BookingIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    l = db.get(models.Listing, body.listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    require_verified(user)
    if user.role != "guest":
        raise HTTPException(403, "Only guest accounts can book a stay")
    if user.id == l.host_id:
        raise HTTPException(400, "You can't book your own listing")
    if body.check_in < date.today():
        raise HTTPException(400, "Check-in cannot be in the past")
    if body.check_out <= body.check_in:
        raise HTTPException(400, "Check-out must be after check-in")
    if body.guests < 1 or body.guests > l.max_guests:
        raise HTTPException(400, f"This place allows 1-{l.max_guests} guests")
    if has_overlap(db, l.id, body.check_in, body.check_out):
        raise HTTPException(409, "These dates are no longer available")

    nights = (body.check_out - body.check_in).days
    subtotal = nights * l.price_per_night
    total = round(subtotal + subtotal * 0.14)  # 14% service fee
    b = models.Booking(listing_id=l.id, guest_id=user.id, check_in=body.check_in,
                       check_out=body.check_out, guests=body.guests, total_price=total)
    db.add(b)
    db.flush()
    add_notification(
        db,
        user_id=l.host_id,
        actor_id=user.id,
        booking_id=b.id,
        title="New reservation",
        message=f"{user.name} booked {l.title}.",
        link="/host",
    )
    add_notification(
        db,
        user_id=user.id,
        actor_id=l.host_id,
        booking_id=b.id,
        title="Your stay is confirmed",
        message=f"Your reservation at {l.title} is confirmed.",
        link="/trips",
    )
    db.commit()
    db.refresh(b)
    return booking_out(b)


@app.get("/bookings")
def my_trips(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Booking).filter_by(guest_id=user.id).order_by(models.Booking.check_in).all()
    return [booking_out(b) for b in rows]


@app.delete("/bookings/{booking_id}")
def cancel_booking(
    booking_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = db.get(models.Booking, booking_id)
    if not b:
        raise HTTPException(404, "Booking not found")
    if b.guest_id != user.id:
        raise HTTPException(403, "You can only cancel your own reservation")
    if b.status != "confirmed":
        raise HTTPException(409, "This reservation is already cancelled")
    b.status = "cancelled"  # cancelled bookings no longer block dates
    add_notification(
        db,
        user_id=b.listing.host_id,
        actor_id=user.id,
        booking_id=b.id,
        title="Reservation cancelled",
        message=f"{user.name} cancelled their stay at {b.listing.title}.",
        link="/host",
    )
    db.commit()
    return {"cancelled": True}


# ---------- host dashboard ----------
@app.get("/host/listings")
def host_listings(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "host":
        raise HTTPException(403, "Host account required")
    rows = db.query(models.Listing).filter_by(host_id=user.id).all()
    return [listing_out(l, db) for l in rows]


@app.get("/host/bookings")
def host_bookings(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "host":
        raise HTTPException(403, "Host account required")
    rows = db.query(models.Booking).join(models.Listing).filter(models.Listing.host_id == user.id).all()
    return [booking_out(b) for b in rows]


# ---------- notifications ----------
@app.get("/notifications")
def get_notifications(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Notification).filter_by(user_id=user.id).order_by(
        models.Notification.created_at.desc()
    ).limit(100).all()
    return [notification_out(row) for row in rows]


@app.post("/notifications/read-all")
def mark_all_notifications_read(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == user.id,
        models.Notification.read_at.is_(None),
    ).update({models.Notification.read_at: utcnow()}, synchronize_session=False)
    db.commit()
    return {"marked_read": True}


@app.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.get(models.Notification, notification_id)
    if not notification:
        raise HTTPException(404, "Notification not found")
    if notification.user_id != user.id:
        raise HTTPException(403, "This notification does not belong to you")
    notification.read_at = utcnow()
    db.commit()
    return {"marked_read": True}


# ---------- host and guest messages ----------
@app.get("/conversations")
def get_conversations(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Booking).join(models.Listing).filter(
        or_(models.Booking.guest_id == user.id, models.Listing.host_id == user.id)
    ).order_by(models.Booking.created_at.desc()).all()
    conversations = []
    for booking in rows:
        other_user = booking.listing.host if booking.guest_id == user.id else booking.guest
        last_message = db.query(models.Message).filter_by(booking_id=booking.id).order_by(
            models.Message.created_at.desc(), models.Message.id.desc()
        ).first()
        conversations.append({
            "booking": booking_out(booking),
            "other_user": {
                "id": other_user.id,
                "name": other_user.name,
                "role": other_user.role,
                "avatar": other_user.avatar,
                "email_verified": bool(other_user.email_verified),
            },
            "last_message": last_message.body if last_message else None,
        })
    return conversations


@app.get("/conversations/{booking_id}/messages")
def get_messages(
    booking_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_participant_booking(booking_id, user, db)
    rows = db.query(models.Message).filter_by(booking_id=booking_id).order_by(
        models.Message.created_at, models.Message.id
    ).all()
    return [message_out(row) for row in rows]


@app.post("/conversations/{booking_id}/messages", status_code=201)
def send_message(
    booking_id: int,
    body: MessageIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_verified(user)
    booking = get_participant_booking(booking_id, user, db)
    message_body = body.body.strip()
    if not message_body:
        raise HTTPException(422, "Message cannot be blank")
    message = models.Message(booking_id=booking.id, sender_id=user.id, body=message_body)
    db.add(message)
    recipient_id = booking.guest_id if user.id == booking.listing.host_id else booking.listing.host_id
    add_notification(
        db,
        user_id=recipient_id,
        actor_id=user.id,
        booking_id=booking.id,
        title="New message",
        message=f"{user.name} sent you a message about {booking.listing.title}.",
        link=f"/messages?booking={booking.id}",
    )
    db.commit()
    db.refresh(message)
    return message_out(message)


# ---------- wishlist ----------
@app.get("/wishlist")
def get_wishlist(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Wishlist).filter_by(user_id=user.id).all()
    return [listing_out(db.get(models.Listing, w.listing_id), db) for w in rows]


@app.post("/wishlist/toggle")
def toggle_wishlist(
    listing_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.Wishlist).filter_by(user_id=user.id, listing_id=listing_id).first()
    if row:
        db.delete(row)
        db.commit()
        return {"saved": False}
    db.add(models.Wishlist(user_id=user.id, listing_id=listing_id))
    db.commit()
    return {"saved": True}