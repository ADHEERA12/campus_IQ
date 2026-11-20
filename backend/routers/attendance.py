
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import models
from auth import get_db, require_role

from services.attendance_service import (
    recalculate_student_attendance,
)


router = APIRouter(tags=["Attendance"])


class AttendanceRequest(BaseModel):
    student_id: int
    status: str


class BulkAttendanceItem(BaseModel):
    student_id: int
    status: str


class BulkAttendanceRequest(BaseModel):
    records: List[BulkAttendanceItem]


# ==========================================
# TEACHER - MARK SINGLE ATTENDANCE
# ==========================================

@router.post("/attendance/mark")
def mark_attendance(
    data: AttendanceRequest,
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db),
):

    student = db.query(models.Student).filter(
        models.Student.id == data.student_id
    ).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    if student.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized for this student",
        )

    status = data.status.lower().strip()

    if status not in ["present", "absent"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be present or absent",
        )

    attendance = models.Attendance(
        student_id=student.id,
        date=date.today(),
        status=status,
    )

    db.add(attendance)

    try:
        db.flush()

        percentage = recalculate_student_attendance(student, db)

        db.commit()
        db.refresh(attendance)
        db.refresh(student)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Attendance marked successfully",
        "attendance_id": attendance.id,
        "student_id": student.id,
        "student_name": student.name,
        "date": attendance.date.isoformat(),
        "status": attendance.status,
        "attendance_percentage": percentage,
    }


# ==========================================
# TEACHER - BULK ATTENDANCE
# ==========================================

@router.post("/attendance/mark-bulk")
def mark_attendance_bulk(
    data: BulkAttendanceRequest,
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db),
):

    if not data.records:
        raise HTTPException(
            status_code=400,
            detail="No records provided",
        )

    processed = []
    present_count = 0
    absent_count = 0

    try:

        for item in data.records:

            status = item.status.lower().strip()

            if status not in ["present", "absent"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status for student {item.student_id}",
                )

            student = db.query(models.Student).filter(
                models.Student.id == item.student_id
            ).first()

            if student is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Student {item.student_id} not found",
                )

            if student.teacher_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail=f"Not authorized for student {item.student_id}",
                )

            attendance = models.Attendance(
                student_id=student.id,
                date=date.today(),
                status=status,
            )

            db.add(attendance)
            db.flush()

            percentage = recalculate_student_attendance(student, db)

            if status == "present":
                present_count += 1
            else:
                absent_count += 1

            processed.append({
                "student_id": student.id,
                "student_name": student.name,
                "status": status,
                "attendance_percentage": percentage,
            })

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Bulk attendance marked successfully",
        "processed_count": len(processed),
        "present_count": present_count,
        "absent_count": absent_count,
        "students": processed,
    }
