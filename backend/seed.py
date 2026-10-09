import random
from datetime import date, timedelta
from database import SessionLocal
import models

AMENITIES = ["Wifi", "Kitchen", "Free parking", "Pool", "Air conditioning", "Washer", "TV", "Hot tub"]

# city, property types used there, base nightly price
CITIES = [
    ("New Delhi", ["Apartment", "House", "Apartment"], 2500),
    ("Goa", ["Villa", "House", "Boat"], 6000),
    ("Jaipur", ["House", "Apartment", "Villa"], 3500),
    ("Manali", ["Cabin", "Treehouse", "House"], 3800),
    ("Pune", ["Apartment", "House", "Apartment"], 2200),
    ("Mumbai", ["Apartment", "Apartment", "House"], 5200),
]
ADJECTIVES = ["Cozy", "Modern", "Sunlit", "Stylish", "Peaceful", "Charming",
              "Spacious", "Elegant", "Quiet", "Bright"]
PHOTO_TAGS = {
    "Apartment": "bedroom,interior", "House": "livingroom,interior", "Villa": "villa,pool",
    "Cabin": "cabin,mountain", "Boat": "houseboat,water", "Treehouse": "treehouse,forest",
}
COMMENTS = [
    "Lovely place, very clean and the host was helpful!",
    "Exactly as described. Would stay again.",
    "Great location and a very comfortable bed.",
    "Peaceful stay, perfect for a short break.",
    "Good value for money and easy check-in.",
]
PER_CITY = 10


def seed_sample_bookings(db, guest_id):
    today = date.today()
    for listing_id, start, nights in [(1, 10, 4), (2, 20, 3)]:
        existing = db.query(models.Booking).filter_by(
            listing_id=listing_id, status="confirmed",
        ).first()
        if existing:
            continue
        listing = db.get(models.Listing, listing_id)
        if listing is None:
            continue
        db.add(models.Booking(
            listing_id=listing_id, guest_id=guest_id, check_in=today + timedelta(days=start),
            check_out=today + timedelta(days=start + nights), guests=2,
            total_price=round(nights * listing.price_per_night * 1.14),
        ))
    db.commit()


def seed():
    db = SessionLocal()
    existing_users = db.query(models.User).all()
    if existing_users:
        guest = next((user for user in existing_users if user.role == "guest"), None)
        if guest:
            seed_sample_bookings(db, guest.id)
        db.close()
        return

    rng = random.Random(7)  # fixed seed so the data is the same every time
    users = [
        models.User(name="Aarav (Host)", role="host", avatar="https://i.pravatar.cc/100?img=12"),
        models.User(name="Meera (Host)", role="host", avatar="https://i.pravatar.cc/100?img=47"),
        models.User(name="Bhavana (Guest)", role="guest", avatar="https://i.pravatar.cc/100?img=32"),
    ]
    db.add_all(users)
    db.commit()

    count = 0
    for city, types, base in CITIES:
        for n in range(PER_CITY):
            count += 1
            ptype = types[n % 3]
            title = f"{ADJECTIVES[n]} {ptype.lower()} in {city}"
            db.add(models.Listing(
                host_id=users[count % 2].id,
                title=title,
                description=f"{title}. A comfortable, well-equipped stay in {city}. Great for families, couples and remote workers.",
                location=f"{city}, India",
                property_type=ptype,
                price_per_night=round(base * rng.uniform(0.5, 1.7) / 100) * 100,
                max_guests=2 + (n % 4),
                bedrooms=1 + (n % 3),
                amenities=rng.sample(AMENITIES, rng.randint(3, 7)),
                images=[f"https://picsum.photos/seed/stay{count}-{k}/900/700" for k in range(5)]
                ))
    db.commit()

    # 4-7 reviews per listing with mixed ratings, so averages look like 4.57, 4.83...
    for lid in range(1, count + 1):
        for _ in range(rng.randint(4, 7)):
            db.add(models.Review(
                listing_id=lid, user_id=rng.choice(users).id,
                rating=rng.choice([5, 5, 5, 5, 4, 4, 3]), comment=rng.choice(COMMENTS),
            ))
    db.commit()

    # Two sample reservations make unavailable dates visible on first launch.
    seed_sample_bookings(db, users[2].id)
    db.close()