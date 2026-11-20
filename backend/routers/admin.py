
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import models
from auth import get_db, get_current_user, get_password_hash


router = APIRouter(tags=["Admin"])


# ==========================================
# REQUEST MODELS
# ==========================================

class AdminCreateUserRequest(BaseModel):
    name: str
    username: str
    password: str

    role: Literal[
        "student",
        "parent",
        "teacher",
        "principal",
        "admin",
    ]

    class_id: Optional[int] = None
    teacher_id: Optional[int] = None
    child_id: Optional[int] = None


class AssignTeacherRequest(BaseModel):
    student_id: int
    teacher_id: int


# ==========================================
# ADMIN VALIDATION
# ==========================================

def check_admin(current_user):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )


# ==========================================
# ADMIN - GET CLASSES
# ==========================================

@router.get("/admin/classes")
def get_classes(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    check_admin(current_user)

    classes = db.query(models.ClassSection).order_by(
        models.ClassSection.name,
        models.ClassSection.section,
    ).all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "section": c.section,
        }
        for c in classes
    ]


# ==========================================
# ADMIN - GET TEACHERS
# ==========================================

@router.get("/admin/teachers")
def get_teachers(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    check_admin(current_user)

    teachers = db.query(models.User).filter(
        models.User.role == "teacher"
    ).order_by(models.User.name).all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "username": t.username,
        }
        for t in teachers
    ]


# ==========================================
# ADMIN - GET STUDENTS AVAILABLE FOR PARENTS
# ==========================================

@router.get("/admin/students")
def get_students(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    check_admin(current_user)

    students = db.query(models.Student).filter(
        models.Student.parent_id == None
    ).order_by(models.Student.name).all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "class_id": s.class_id,
        }
        for s in students
    ]


# ==========================================
# ADMIN - CREATE USER
# ==========================================

@router.post("/admin/create-user")
def create_user(
    data: AdminCreateUserRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    check_admin(current_user)

    existing_user = db.query(models.User).filter(
        models.User.username == data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    selected_class = None
    selected_teacher = None
    selected_student = None

    # STUDENT VALIDATION
    if data.role == "student":

        if data.class_id is None:
            raise HTTPException(
                status_code=400,
                detail="class_id is required for student registration",
            )

        if data.teacher_id is None:
            raise HTTPException(
                status_code=400,
                detail="teacher_id is required for student registration",
            )

        selected_class = db.query(models.ClassSection).filter(
            models.ClassSection.id == data.class_id
        ).first()

        if selected_class is None:
            raise HTTPException(
                status_code=404,
                detail="Class not found",
            )

        selected_teacher = db.query(models.User).filter(
            models.User.id == data.teacher_id,
            models.User.role == "teacher",
        ).first()

        if selected_teacher is None:
            raise HTTPException(
                status_code=404,
                detail="Teacher not found",
            )

    # PARENT VALIDATION
    elif data.role == "parent":

        if data.child_id is None:
            raise HTTPException(
                status_code=400,
                detail="child_id is required for parent registration",
            )

        selected_student = db.query(models.Student).filter(
            models.Student.id == data.child_id
        ).first()

        if selected_student is None:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        if selected_student.parent_id is not None:
            raise HTTPException(
                status_code=400,
                detail="Student already has a parent assigned",
            )

    # CREATE USER
    new_user = models.User(
        name=data.name,
        username=data.username,
        password=get_password_hash(data.password),
        role=data.role,
    )

    try:

        db.add(new_user)
        db.flush()

        # Create student profile
        if data.role == "student":

            new_student = models.Student(
                name=data.name,
                user_id=new_user.id,
                class_id=data.class_id,
                teacher_id=data.teacher_id,
                attendance_percentage=0.0,
            )

            db.add(new_student)

        # Link parent
        elif data.role == "parent":

            selected_student.parent_id = new_user.id

        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise

    return {
        "message": f"{data.role.capitalize()} registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "username": new_user.username,
            "role": new_user.role,
        },
    }


# ==========================================
# ADMIN - ASSIGN / REASSIGN TEACHER
# ==========================================

@router.post("/teacher/assign")
def assign_teacher(
    data: AssignTeacherRequest,
    current_user=Depends(get_current_user),
    db: Session=Depends(get_db),
):

    check_admin(current_user)

    student = db.query(models.Student).filter(
        models.Student.id == data.student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    teacher = db.query(models.User).filter(
        models.User.id == data.teacher_id,
        models.User.role == "teacher",
    ).first()

    if teacher is None:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found",
        )

    try:

        student.teacher_id = teacher.id

        db.commit()
        db.refresh(student)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Teacher assigned successfully",
        "student": {
            "id": student.id,
            "name": student.name,
        },
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
        },
    }
