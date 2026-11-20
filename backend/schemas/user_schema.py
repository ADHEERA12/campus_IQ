from pydantic import BaseModel
from typing import Literal, Optional


class AdminCreateUserRequest(BaseModel):
    name: str
    username: str
    password: str

    role: Literal[
        "student",
        "parent",
        "teacher",
        "principal"
    ]

    child_id: Optional[int] = None