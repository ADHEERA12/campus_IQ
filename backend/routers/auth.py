
from typing import cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import models
from auth import (
    verify_password,
    create_access_token,
    get_current_user,
    get_db,
)


router = APIRouter(tags=["Authentication"])


# ==========================================
# LOGIN
# ==========================================

@router.post("/login")
def login(
    username: str,
    password: str,
    db: Session = Depends(get_db),
):

    user = db.query(models.User).filter(
        models.User.username == username
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    # Explicitly tell Pyrefly that this is a User instance
    user = cast(models.User, user)

    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=403,
            detail="Account is inactive",
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
        },
    }


# ==========================================
# CURRENT USER
# ==========================================

@router.get("/me")
def get_me(
    current_user: models.User = Depends(get_current_user),
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "role": current_user.role,
    }
