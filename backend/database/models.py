from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

# pyrefly: ignore[missing-import]
from database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(120), nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    status = Column(String(20), default="active") # "active", "invited", "disabled"
    activation_token = Column(String(100), nullable=True)
    employee_id = Column(String(50), nullable=True)

    student = relationship(
        "Student",
        foreign_keys="Student.user_id",
        back_populates="user",
        uselist=False
    )


class ClassSection(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    section = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    student_code = Column(String(50), nullable=True)

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    parent_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    teacher_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    attendance_percentage = Column(
        Float,
        default=0.0
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="student"
    )

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)


class EscalationRequest(Base):
    __tablename__ = "escalation_requests"

    id = Column(Integer, primary_key=True, index=True)

    requester_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=True
    )

    teacher_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    request_type = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)

    status = Column(String(30), default="pending")
    ticket_id = Column(String(100), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    session_id = Column(String(100), nullable=False)

    role = Column(String(20), nullable=False)

    message = Column(Text, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )