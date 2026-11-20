
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import models
from auth import get_db, require_role


router = APIRouter(tags=["Parent"])


class EscalationRequestModel(BaseModel):
    reason: str


# ==========================================
# PARENT - CHILD ATTENDANCE
# ==========================================

@router.get("/attendance/child")
def get_child_attendance(
    current_user=Depends(require_role("parent")),
    db: Session = Depends(get_db),
):

    student = db.query(models.Student).filter(
        models.Student.parent_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Child record not found",
        )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "attendance_percentage": student.attendance_percentage or 0.0,
    }


# ==========================================
# PARENT - ESCALATION REQUEST
# ==========================================

@router.post("/escalation/request")
def request_escalation(
    data: EscalationRequestModel,
    current_user=Depends(require_role("parent")),
    db: Session = Depends(get_db),
):

    student = db.query(models.Student).filter(
        models.Student.parent_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Child not found")

    if student.teacher_id is None:
        raise HTTPException(
            status_code=400,
            detail="No teacher assigned to this student",
        )

    ticket_id = "TKT-" + uuid.uuid4().hex[:8].upper()

    escalation = models.EscalationRequest(
        requester_id=current_user.id,
        student_id=student.id,
        teacher_id=student.teacher_id,
        request_type="teacher_call",
        reason=data.reason,
        status="confirmed",
        ticket_id=ticket_id,
    )

    db.add(escalation)
    db.commit()
    db.refresh(escalation)

    return {
        "confirmed": True,
        "message": "Teacher call request confirmed",
        "ticket_id": ticket_id,
        "student_id": student.id,
        "student_name": student.name,
        "teacher_id": student.teacher_id,
        "reason": escalation.reason,
        "status": escalation.status,
    }
