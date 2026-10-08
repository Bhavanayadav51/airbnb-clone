from datetime import date, timedelta
from database import SessionLocal
import models

AMENITIES = ["Wifi", "Kitchen", "Free parking", "Pool", "Air conditioning", "Washer", "TV", "Hot tub"]

DATA = [
    ("Beachfront villa with private pool", "Goa, India", "Villa", 8500),
    ("Cozy cabin in the pine forest", "Manali, India", "Cabin", 3200),
    ("Modern apartment near the old town", "Jaipur, India", "Apartment", 2800),
    ("Lakeview house with garden", "Udaipur, India", "House", 5400),
    ("Houseboat on the backwaters", "Kerala, India", "Boat", 6100),
    ("Mountain retreat with valley views", "Shimla, India", "Cabin", 3900),
    ("Stylish loft in the city centre", "Mumbai, India", "Apartment", 7200),
    ("Heritage haveli with courtyard", "Jodhpur, India", "House", 4800),
    ("Tropical treehouse getaway", "Wayanad, India", "Treehouse", 4300),
    ("Seaside cottage steps from the sand", "Pondicherry, India", "House", 3600),
    ("Luxury penthouse with skyline views", "Delhi, India", "Apartment", 9800),
    ("Tea estate bungalow", "Munnar, India", "House", 5100),
]


def seed():
    db = SessionLocal()
    if db.query(models.User).count() > 0:
        db.close()
        return

    users = [
        models.User(name="Aarav (Host)", role="host", avatar="https://i.pravatar.cc/100?img=12"),
        models.User(name="Meera (Host)", role="host", avatar="https://i.pravatar.cc/100?img=47"),
        models.User(name="Bhavana (Guest)", role="guest", avatar="https://i.pravatar.cc/100?img=32"),
    ]
    db.add_all(users)
    db.commit()

    for i, (title, loc, ptype, price) in enumerate(DATA):
        db.add(models.Listing(
            host_id=users[i % 2].id,
            title=title,
            description=f"{title}. A comfortable and well-equipped stay in {loc}. Perfect for families, couples and remote workers.",
            location=loc,
            property_type=ptype,
            price_per_night=price,
            max_guests=2 + (i % 5),
            bedrooms=1 + (i % 4),
            amenities=AMENITIES[: 4 + (i % 4)],
            images=[f"https://picsum.photos/seed/stay{i}-{n}/900/700" for n in range(5)],
        ))
    db.commit()

    # a few existing bookings and reviews
    today = date.today()
    db.add(models.Booking(listing_id=1, guest_id=users[2].id, check_in=today + timedelta(days=10),
                          check_out=today + timedelta(days=14), guests=2, total_price=38000))
    db.add(models.Booking(listing_id=2, guest_id=users[2].id, check_in=today + timedelta(days=20),
                          check_out=today + timedelta(days=23), guests=2, total_price=10944))
    for lid in range(1, 13):
        db.add(models.Review(listing_id=lid, user_id=users[2].id, rating=4 + (lid % 2),
                             comment="Lovely place, very clean and the host was helpful!"))
    db.commit()
    db.close()