from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    role = Column(String, default="guest")  # "guest" or "host"
    avatar = Column(String)


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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)
    listing = relationship("Listing")
    guest = relationship("User")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")


class Wishlist(Base):
    __tablename__ = "wishlist"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "listing_id"),)