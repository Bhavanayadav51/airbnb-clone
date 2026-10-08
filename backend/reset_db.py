from database import Base, engine
import models  # needed so the tables are known
from seed import seed

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
seed()
print("Database reset and reseeded")