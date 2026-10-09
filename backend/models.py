from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, JSON, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    role = Column(String, default="guest")  # "guest" or "host"
    avatar = Column(String)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    email_verified = Column(Boolean, nullable=False, default=False)
    verification_code_hash = Column(String, nullable=True)
    verification_expires_at = Column(DateTime, nullable=True)


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    location = Column(String, nullable=False)
    property_type = Column(String)  # House, Apartment, Villa, Cabin...
    price_per_night = Column(Float, nullable=False)
    max_guests = Column(Integer, default=2)
    bedrooms = Column(Integer, default=1)
    amenities = Column(JSON, default=list)
    images = Column(JSON, default=list)
    created_at = Column(DateTime, default=utcnow)
    host = relationship("User")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="confirmed")
    created_at = Column(DateTime, default=utcnow)
    listing = relationship("Listing")
    guest = relationship("User")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(String)
    created_at = Column(DateTime, default=utcnow)
    user = relationship("User")


class Wishlist(Base):
    __tablename__ = "wishlist"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "listing_id"),)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    link = Column(String, nullable=False, default="/notifications")
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])
    booking = relationship("Booking")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    sender = relationship("User")
    booking = relationship("Booking")