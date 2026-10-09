from datetime import date, timedelta
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import or_, func, cast, String
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db
from seed import seed

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Airbnb Clone API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup():
    seed()  # fills the DB on first run (important for hosts that reset the disk)


# ---------- request bodies ----------
class ListingIn(BaseModel):
    host_id: int = Field(gt=0)
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
    guest_id: int = Field(gt=0)
    check_in: date
    check_out: date
    guests: int = Field(default=1, ge=1)


# ---------- helpers ----------
def listing_out(l: models.Listing, db: Session):
    avg = db.query(func.avg(models.Review.rating)).filter_by(listing_id=l.id).scalar()
    count = db.query(models.Review).filter_by(listing_id=l.id).count()
    return {
        "id": l.id, "title": l.title, "description": l.description, "location": l.location,
        "property_type": l.property_type, "price_per_night": l.price_per_night,
        "max_guests": l.max_guests, "bedrooms": l.bedrooms, "amenities": l.amenities,
        "images": l.images, "rating": round(avg, 2) if avg else None, "review_count": count,
        "host": {"id": l.host.id, "name": l.host.name, "avatar": l.host.avatar},
    }


def booking_out(b: models.Booking):
    return {
        "id": b.id, "listing_id": b.listing_id, "listing_title": b.listing.title,
        "listing_image": b.listing.images[0] if b.listing.images else None,
        "location": b.listing.location, "guest_id": b.guest_id, "guest_name": b.guest.name,
        "check_in": b.check_in, "check_out": b.check_out, "guests": b.guests,
        "total_price": b.total_price, "status": b.status,
    }


def has_overlap(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    # two ranges overlap when each starts before the other ends
    return db.query(models.Booking).filter(
        models.Booking.listing_id == listing_id,
        models.Booking.status == "confirmed",
        models.Booking.check_in < check_out,
        models.Booking.check_out > check_in,
    ).first() is not None


# ---------- users ----------
@app.get("/users")
def users(db: Session = Depends(get_db)):
    return [{"id": u.id, "name": u.name, "role": u.role, "avatar": u.avatar} for u in db.query(models.User).all()]


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
def create_listing(body: ListingIn, db: Session = Depends(get_db)):
    host = db.get(models.User, body.host_id)
    if not host or host.role != "host":
        raise HTTPException(403, "Only hosts can create listings")
    if not body.title.strip() or not body.location.strip():
        raise HTTPException(422, "Title and location cannot be blank")
    l = models.Listing(**body.model_dump())
    db.add(l)
    db.commit()
    db.refresh(l)
    return listing_out(l, db)


@app.put("/listings/{listing_id}")
def update_listing(listing_id: int, body: ListingIn, db: Session = Depends(get_db)):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    if l.host_id != body.host_id:
        raise HTTPException(403, "Not your listing")
    if not body.title.strip() or not body.location.strip():
        raise HTTPException(422, "Title and location cannot be blank")
    for k, v in body.model_dump().items():
        setattr(l, k, v)
    db.commit()
    return listing_out(l, db)


@app.delete("/listings/{listing_id}")
def delete_listing(listing_id: int, host_id: int, db: Session = Depends(get_db)):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    if l.host_id != host_id:
        raise HTTPException(403, "Not your listing")
    for model in (models.Booking, models.Review, models.Wishlist):
        db.query(model).filter_by(listing_id=listing_id).delete()
    db.delete(l)
    db.commit()
    return {"deleted": True}


# ---------- bookings ----------
@app.post("/bookings", status_code=201)
def create_booking(body: BookingIn, db: Session = Depends(get_db)):
    l = db.get(models.Listing, body.listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    guest = db.get(models.User, body.guest_id)
    if not guest or guest.role != "guest":
        raise HTTPException(403, "Only guest accounts can book a stay")
    if body.guest_id == l.host_id:
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
    b = models.Booking(listing_id=l.id, guest_id=body.guest_id, check_in=body.check_in,
                       check_out=body.check_out, guests=body.guests, total_price=total)
    db.add(b)
    db.commit()
    db.refresh(b)
    return booking_out(b)


@app.get("/bookings")
def my_trips(guest_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Booking).filter_by(guest_id=guest_id).order_by(models.Booking.check_in).all()
    return [booking_out(b) for b in rows]


@app.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: int, guest_id: int, db: Session = Depends(get_db)):
    b = db.get(models.Booking, booking_id)
    if not b:
        raise HTTPException(404, "Booking not found")
    if b.guest_id != guest_id:
        raise HTTPException(403, "You can only cancel your own reservation")
    b.status = "cancelled"  # cancelled bookings no longer block dates
    db.commit()
    return {"cancelled": True}


# ---------- host dashboard ----------
@app.get("/host/{host_id}/listings")
def host_listings(host_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Listing).filter_by(host_id=host_id).all()
    return [listing_out(l, db) for l in rows]


@app.get("/host/{host_id}/bookings")
def host_bookings(host_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Booking).join(models.Listing).filter(models.Listing.host_id == host_id).all()
    return [booking_out(b) for b in rows]


# ---------- wishlist ----------
@app.get("/wishlist")
def get_wishlist(user_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Wishlist).filter_by(user_id=user_id).all()
    return [listing_out(db.get(models.Listing, w.listing_id), db) for w in rows]


@app.post("/wishlist/toggle")
def toggle_wishlist(user_id: int, listing_id: int, db: Session = Depends(get_db)):
    row = db.query(models.Wishlist).filter_by(user_id=user_id, listing_id=listing_id).first()
    if row:
        db.delete(row)
        db.commit()
        return {"saved": False}
    db.add(models.Wishlist(user_id=user_id, listing_id=listing_id))
    db.commit()
    return {"saved": True}