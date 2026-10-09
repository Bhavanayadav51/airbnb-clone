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

PROPERTY_PHOTOS = {
    "Apartment": [
        "photo-1671196048754-03a77d051dcb",
        "photo-1515263487990-61b07816b324",
        "photo-1545324418-cc1a3fa10c00",
        "photo-1624204386084-dd8c05e32226",
        "photo-1678963247798-0944cf6ba34d",
        "photo-1579632652768-6cb9dcf85912",
        "photo-1516501312919-d0cb0b7b60b8",
        "photo-1619994121345-b61cd610c5a6",
        "photo-1680281936362-aff258ecd143",
        "photo-1638973140785-3b918e290682",
        "photo-1592276040264-e10344a6a10e",
        "photo-1610286986642-057ece0c3656",
        "photo-1725408023984-f535e86aa58f",
        "photo-1643906652169-a750f3f70848",
        "photo-1432297984334-707d34c4163a",
        "photo-1542309175-9b88d743f89f",
        "photo-1678386645963-3f5b0bdb8dcd",
        "photo-1605267143746-999bf61d0d08",
        "photo-1626273947634-823f04de159e",
        "photo-1590058582642-b130d1620a49",
        "photo-1630699375019-c334927264df",
        "photo-1560448075-57d0285fc59b",
        "photo-1612320743558-020669ff20e8",
        "photo-1630699293259-0b6c08606c62",
        "photo-1652882860938-f90aa298e644",
        "photo-1652882860902-7c6b0f88ef23",
        "photo-1612320582827-a95ab2596dbc",
        "photo-1612320583049-eabe3c21bd94",
        "photo-1649068559107-e5d936141e44",
        "photo-1630699144418-6ca9059f9a44",
        "photo-1662454419736-de132ff75638",
        "photo-1702014861736-d62834317c5e",
        "photo-1749878065837-6968c1805247",
        "photo-1771287491132-4954b32210d6",
        "photo-1702014857653-dcea938d51f0",
    ],
    "House": [
        "photo-1600596542815-ffad4c1539a9",
        "photo-1787094497609-5efe6029b950",
        "photo-1598228723793-52759bba239c",
        "photo-1580587771525-78b9dba3b914",
        "photo-1568605114967-8130f3a36994",
        "photo-1786550860372-116b871a1697",
        "photo-1583608205776-bfd35f0d9f83",
        "photo-1758158452965-ef267a639880",
        "photo-1523217582562-09d0def993a6",
        "photo-1512917774080-9991f1c4c750",
        "photo-1628624747186-a941c476b7ef",
        "photo-1605276374104-dee2a0ed3cd6",
        "photo-1771366260867-7e07094579d7",
        "photo-1721815693498-cc28507c0ba2",
        "photo-1689609950112-d66095626efb",
        "photo-1776186243408-3c0489503faa",
        "photo-1628012209120-d9db7abf7eab",
        "photo-1661883964999-c1bcb57a7357",
        "photo-1748063578185-3d68121b11ff",
        "photo-1757524492552-d47a66a2b63e",
        "photo-1706808849780-7a04fbac83ef",
        "photo-1783125127341-81112b795c23",
        "photo-1627141234469-24711efb373c",
        "photo-1706808849777-96e0d7be3bb7",
        "photo-1513584684374-8bab748fbf90",
    ],
    "Villa": [
        "photo-1694475117121-0c14f8ddf7bb",
        "photo-1582610116397-edb318620f90",
        "photo-1678889284769-b7dcbec1f082",
        "photo-1747326386378-5635788ea82c",
        "photo-1759372945658-1e9f56e751bd",
        "photo-1790276319227-993348bb36c7",
        "photo-1787868377879-98168d69cfe2",
        "photo-1748729852573-b44107a3a1d5",
        "photo-1784730339452-fa650e0aaab4",
        "photo-1789593847377-a0452ab3f3c9",
        "photo-1778205063665-23257f2dc408",
        "photo-1687960116506-f31f84371838",
        "photo-1790276319222-9425a325ccc6",
        "photo-1782939355736-fc6ed5c24b88",
        "photo-1783936535299-6ff0f8bbd1d0",
        "photo-1661962769148-fbe587e60fb8",
        "photo-1790276319953-a24042120d6b",
        "photo-1784288196030-ad230afe95ca",
        "photo-1670589953882-b94c9cb380f5",
    ],
    "Cabin": [
        "photo-1631630259742-c0f0b17c6c10",
        "photo-1631941392209-70cad44ecfb7",
        "photo-1697807713040-b5fb60d6f012",
        "photo-1664369058082-ee8e36028106",
        "photo-1498409505433-aff66f7ba9e6",
        "photo-1637911690230-1e64fc220c8f",
        "photo-1727706572437-4fcda0cbd66f",
        "photo-1762245273803-60affd991e19",
        "photo-1591825729269-caeb344f6df2",
        "photo-1487695652027-48e475bfa86f",
        "photo-1592990379716-aec6e89a6a69",
        "photo-1680962884378-b69a04b9969c",
        "photo-1631756964162-25c8c07579b5",
        "photo-1721714808874-35bcb03a8277",
        "photo-1768578927774-76bfec4f9c5d",
    ],
    "Boat": [
        "photo-1726098568865-650140447b36",
        "photo-1767447920748-ad3447a5aa9f",
        "photo-1661964355544-28b1f3920cb4",
        "photo-1766352813601-63d3c8b77572",
        "photo-1790181034141-ce32507c2543",
        "photo-1760383068657-afb9a877c7cb",
    ],
    "Treehouse": [
        "photo-1664047696194-ced8c905eafb",
        "photo-1694964363999-964f056854ae",
        "photo-1693678028299-4e2fda2dc990",
        "photo-1782753308177-0b5c00dd7f89",
        "photo-1656019065945-00b0c64c125d",
        "photo-1719610048500-8eb66781cb09",
        "photo-1785679768553-83310f57aa3f",
        "photo-1685305380695-90e58a33d4e9",
        "photo-1550986357-ad6592f09625",
        "photo-1734305531732-e1d4c189a857",
        "photo-1719610047946-5772529e9db2",
        "photo-1601961782698-76c8503d35e8",
        "photo-1685305380444-e0765e8adc5e",
        "photo-1781991173914-1e8369b5c373",
        "photo-1683129807206-8a648874655e",
    ],
}
PHOTOS_PER_LISTING = 5
UNAVAILABLE_PROPERTY_PHOTOS = {
    "photo-1671196048754-03a77d051dcb",
    "photo-1689609950112-d66095626efb",
    "photo-1680281936362-aff258ecd143",
    "photo-1678386645963-3f5b0bdb8dcd",
    "photo-1678963247798-0944cf6ba34d",
    "photo-1725408023984-f535e86aa58f",
    "photo-1694475117121-0c14f8ddf7bb",
    "photo-1748729852573-b44107a3a1d5",
    "photo-1726098568865-650140447b36",
    "photo-1661964355544-28b1f3920cb4",
    "photo-1661962769148-fbe587e60fb8",
    "photo-1747326386378-5635788ea82c",
    "photo-1687960116506-f31f84371838",
    "photo-1661883964999-c1bcb57a7357",
    "photo-1664047696194-ced8c905eafb",
    "photo-1685305380695-90e58a33d4e9",
    "photo-1683129807206-8a648874655e",
    "photo-1719610048500-8eb66781cb09",
    "photo-1719610047946-5772529e9db2",
    "photo-1685305380444-e0765e8adc5e",
}
GENERATED_PROPERTY_PHOTOS = {
    photo for photos in PROPERTY_PHOTOS.values() for photo in photos
}
DEMO_PROPERTY_PHOTOS = [
    photo for photo in dict.fromkeys(
        photo for photos in PROPERTY_PHOTOS.values() for photo in photos
    )
    if photo not in UNAVAILABLE_PROPERTY_PHOTOS
]
random.Random(23).shuffle(DEMO_PROPERTY_PHOTOS)
LEGACY_PROPERTY_PHOTOS = {
    "photo-1600585154340-be6161a56a0c",
    "photo-1600607687939-ce8a6c25118c",
    "photo-1600566753086-00f18fb6b3ea",
    "photo-1600210492486-724fe5c67fb0",
    "photo-1600607687920-4e2a09cf159d",
    "photo-1600566753190-17f0baa2a6c3",
    "photo-1631630259742-c0f0b17c6c10",
    "photo-1631941392209-70cad44ecfb7",
    "photo-1697807713040-b5fb60d6f012",
    "photo-1664369058082-ee8e36028106",
    "photo-1498409505433-aff66f7ba9e6",
    "photo-1637911690230-1e64fc220c8f",
    "photo-1727706572437-4fcda0cbd66f",
    "photo-1762245273803-60affd991e19",
    "photo-1591825729269-caeb344f6df2",
    "photo-1487695652027-48e475bfa86f",
    "photo-1592990379716-aec6e89a6a69",
    "photo-1680962884378-b69a04b9969c",
    "photo-1631756964162-25c8c07579b5",
    "photo-1721714808874-35bcb03a8277",
    "photo-1768578927774-76bfec4f9c5d",
    "photo-1618221195710-dd6b41faaea6",
    "photo-1773578978637-c9771e7a9913",
    "photo-1774199496664-a9690967be5a",
    "photo-1616047006789-b7af5afb8c20",
    "photo-1762545078318-8443881c2d83",
    "photo-1770736158887-9a0f3702416e",
    "photo-1615873968403-89e068629265",
    "photo-1600210491892-03d54c0aaf87",
    "photo-1618220179428-22790b461013",
    "photo-1583847268964-b28dc8f51f92",
    "photo-1781794902242-f8578908d640",
    "photo-1616046229478-9901c5536a45",
    "photo-1554995207-c18c203602cb",
    "photo-1586023492125-27b2c045efd7",
    "photo-1649083048770-82e8ffd80431",
    "photo-1570129477492-45c003edd2be",
    "photo-1781797221329-c3d083ab6d99",
    "photo-1600596542815-ffad4c1539a9",
    "photo-1787094497609-5efe6029b950",
    "photo-1598228723793-52759bba239c",
    "photo-1580587771525-78b9dba3b914",
    "photo-1777428762767-e3a797da389a",
    "photo-1568605114967-8130f3a36994",
    "photo-1786550860372-116b871a1697",
    "photo-1583608205776-bfd35f0d9f83",
    "photo-1758158452965-ef267a639880",
    "photo-1523217582562-09d0def993a6",
    "photo-1512917774080-9991f1c4c750",
    "photo-1628624747186-a941c476b7ef",
    "photo-1605276374104-dee2a0ed3cd6",
    "photo-1670589953882-b94c9cb380f5",
    "photo-1721989518229-3e84837fc398",
    "photo-1670589953903-b4e2f17a70a9",
    "photo-1627357059324-0346e7f7fb7e",
    "photo-1650519877196-ce0acbbaf6cf",
    "photo-1650519877303-87aa0b1f311e",
    "photo-1650519876461-c516be8be76c",
    "photo-1711110065954-1c79c1dec505",
    "photo-1711110065992-6d6aff9ae35c",
    "photo-1711110066231-cb235d6e117e",
    "photo-1728049006562-236e5b0dddea",
    "photo-1728048756954-be23bd048b56",
    "photo-1728049006343-9ee0187643d5",
    "photo-1728048756766-55208c6feb87",
    "photo-1728048756910-c1d157bd24cf",
    "photo-1721989518229-3e84837fc398",
    "photo-1670589953903-b4e2f17a70a9",
    "photo-1627357059324-0346e7f7fb7e",
    "photo-1650519877196-ce0acbbaf6cf",
    "photo-1650519877303-87aa0b1f311e",
    "photo-1650519876461-c516be8be76c",
    "photo-1711110065954-1c79c1dec505",
    "photo-1711110065992-6d6aff9ae35c",
    "photo-1711110066231-cb235d6e117e",
    "photo-1728049006562-236e5b0dddea",
    "photo-1728048756954-be23bd048b56",
    "photo-1728049006343-9ee0187643d5",
    "photo-1728048756766-55208c6feb87",
    "photo-1728048756910-c1d157bd24cf",
    "photo-1630699375019-c334927264df",
    "photo-1560448075-57d0285fc59b",
    "photo-1612320743558-020669ff20e8",
    "photo-1630699293259-0b6c08606c62",
    "photo-1652882860938-f90aa298e644",
    "photo-1652882860902-7c6b0f88ef23",
    "photo-1612320582827-a95ab2596dbc",
    "photo-1612320583049-eabe3c21bd94",
    "photo-1649068559107-e5d936141e44",
    "photo-1630699144418-6ca9059f9a44",
    "photo-1662454419736-de132ff75638",
    "photo-1702014861736-d62834317c5e",
    "photo-1749878065837-6968c1805247",
    "photo-1771287491132-4954b32210d6",
    "photo-1702014857653-dcea938d51f0",
}
DEMO_LISTING_TITLES = {
    f"{adjective} {property_type.lower()} in {city}"
    for city, property_types, _ in CITIES
    for property_type in property_types
    for adjective in ADJECTIVES
}


def property_photos(property_type, ordinal):
    photos = DEMO_PROPERTY_PHOTOS
    start = ordinal % len(photos)
    return [
        f"https://images.unsplash.com/{photos[(start + i * 7) % len(photos)]}?auto=format&fit=crop&w=1200&q=85"
        for i in range(PHOTOS_PER_LISTING)
    ]


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
        # Replace only the generated demo galleries; retain host-selected images.
        photo_ordinal = 0
        reserved_covers = {
            listing.images[0]
            for listing in db.query(models.Listing).all()
            if listing.id > PER_CITY * len(CITIES) and listing.images
        }
        for listing in db.query(models.Listing).all():
            is_seed_listing = (
                listing.id <= PER_CITY * len(CITIES)
                and listing.title in DEMO_LISTING_TITLES
            )
            is_generated_gallery = listing.images and all(
                "picsum.photos" in image
                or image.startswith("https://images.unsplash.com/photo-")
                for image in listing.images
            )
            if is_seed_listing and is_generated_gallery:
                gallery = property_photos(listing.property_type, photo_ordinal)
                attempts = 0
                while gallery[0] in reserved_covers:
                    attempts += 1
                    if attempts >= len(DEMO_PROPERTY_PHOTOS):
                        raise RuntimeError(
                            "No unused demo cover photo is available"
                        )
                    photo_ordinal += 1
                    gallery = property_photos(listing.property_type, photo_ordinal)
                listing.images = gallery
                reserved_covers.add(gallery[0])
                photo_ordinal += 1
        db.commit()
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
    photo_ordinal = 0
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
                images=property_photos(ptype, photo_ordinal)
                ))
            photo_ordinal += 1
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