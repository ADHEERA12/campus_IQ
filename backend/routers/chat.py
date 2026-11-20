import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import models
from auth import get_db, get_current_user

from gemini_service import client

from gemini_tools import (
    get_my_attendance_tool,
    get_child_attendance_tool,
    mark_attendance_tool,
    calculate_attendance_goal_tool,
)

from google.genai import types

from routers.student import get_my_attendance
from routers.parent import get_child_attendance
from routers.attendance import (
    mark_attendance,
    AttendanceRequest,
)

from services.attendance_service import (
    calculate_attendance_goal,
)


router = APIRouter(tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str


# ==========================================
# CHAT
# ==========================================

@router.post("/chat")
def chat(
    data: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # Initial Gemini request
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=data.message,
        config={
            "system_instruction": (
                "You are XYZ AI Assistant, a school assistant. "
                f"The logged-in user's role is {current_user.role}. "
                "Use tools to retrieve real attendance information. "
                "Never invent attendance data. "
                "Ask for missing information when necessary."
            ),
            "tools": [
                {
                    "function_declarations": [
                        get_my_attendance_tool,
                        get_child_attendance_tool,
                        mark_attendance_tool,
                        calculate_attendance_goal_tool,
                    ]
                }
            ],
        },
    )

    # No candidates returned
    if not response.candidates:
        return {
            "message": response.text or "No response received.",
            "tool_used": None,
        }

    candidate = response.candidates[0]

    # Check content safely
    candidate_content = candidate.content

    if candidate_content is None:
        return {
            "message": response.text or "No response received.",
            "tool_used": None,
        }

    parts = candidate_content.parts or []

    # Process function calls
    for part in parts:

        function_call = part.function_call

        if function_call is None:
            continue

        function_name = function_call.name

        if not function_name:
            raise HTTPException(
                status_code=400,
                detail="Function name missing",
            )

        arguments = dict(function_call.args or {})

        # ======================================
        # STUDENT - OWN ATTENDANCE
        # ======================================

        if function_name == "get_my_attendance":

            if current_user.role != "student":
                raise HTTPException(
                    status_code=403,
                    detail="Only students can access their attendance",
                )

            result = get_my_attendance(current_user, db)

        # ======================================
        # PARENT - CHILD ATTENDANCE
        # ======================================

        elif function_name == "get_child_attendance":

            if current_user.role != "parent":
                raise HTTPException(
                    status_code=403,
                    detail="Only parents can access child attendance",
                )

            result = get_child_attendance(current_user, db)

        # ======================================
        # STUDENT - ATTENDANCE GOAL
        # ======================================

        elif function_name == "calculate_attendance_goal":

            if current_user.role != "student":
                raise HTTPException(
                    status_code=403,
                    detail="Only students can calculate attendance goals",
                )

            target = arguments.get("target_percentage")

            if target is None:
                raise HTTPException(
                    status_code=400,
                    detail="Target percentage is required",
                )

            student = db.query(models.Student).filter(
                models.Student.user_id == current_user.id
            ).first()

            if student is None:
                raise HTTPException(
                    status_code=404,
                    detail="Student record not found",
                )

            try:
                result = calculate_attendance_goal(
                    student,
                    db,
                    float(target),
                )

            except ValueError as error:
                raise HTTPException(
                    status_code=400,
                    detail=str(error),
                )

        # ======================================
        # TEACHER - MARK ATTENDANCE
        # ======================================

        elif function_name == "mark_attendance":

            if current_user.role != "teacher":
                raise HTTPException(
                    status_code=403,
                    detail="Only teachers can mark attendance",
                )

            student_name = arguments.get("student_name")
            status = arguments.get("status")

            if not student_name or not status:
                raise HTTPException(
                    status_code=400,
                    detail="Student name and status are required",
                )

            student = db.query(models.Student).filter(
                models.Student.name.ilike(student_name.strip())
            ).first()

            if student is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Student '{student_name}' not found",
                )

            # Extract actual ID from SQLAlchemy model instance
            student_id = int(student.__dict__["id"])

            if student.teacher_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You are not assigned to this student",
                )

            result = mark_attendance(
                AttendanceRequest(
                    student_id=student_id,
                    status=status,
                ),
                current_user,
                db,
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown AI tool: {function_name}",
            )

        # Convert result into JSON-safe data
        result = json.loads(
            json.dumps(result, default=str)
        )

        # ======================================
        # SEND TOOL RESULT BACK TO GEMINI
        # ======================================

        function_response_part = (
            types.Part.from_function_response(
                name=function_name,
                response=result,
            )
        )

        follow_up = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                data.message,
                candidate_content,
                function_response_part,
            ],
            config={
                "system_instruction": (
                    "You are XYZ AI Assistant. "
                    "Answer using only the provided tool result. "
                    "Never invent or alter numbers. "
                    "Be clear, friendly and concise."
                ),
            },
        )

        return {
            "message": follow_up.text or "Operation completed successfully.",
            "tool_used": function_name,
            "data": result,
        }

    # ==========================================
    # NO FUNCTION CALL
    # ==========================================

    return {
        "message": response.text or "No response received.",
        "tool_used": None,
    }