from getpass import getpass

from database.database import SessionLocal
from database.models import User
from auth import get_password_hash

db = SessionLocal()

try:
    name = input("Admin name: ")
    username = input("Admin username: ")
    email = input("Admin email: ")
    password = getpass("Admin password: ")

    if db.query(User).filter(User.username == username).first():
        print("Username already exists!")
    else:
        admin = User(
            name=name,
            username=username,
            email=email,
            password=get_password_hash(password),
            role="admin",
            status="active",
        )

        db.add(admin)
        db.commit()

        print("\nAdmin created successfully!")
        print("Username:", username)
        print("Role: admin")

except Exception as e:
    db.rollback()
    print("Error:", e)

finally:
    db.close()