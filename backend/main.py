from datetime import date
import uuid
import io
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from database.database import engine, Base
from database import models
import json

from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_db,
    require_role,
)

from gemini_service import client

from gemini_tools import (
    get_my_attendance_tool,
    get_child_attendance_tool,
    mark_attendance_tool,
    calculate_attendance_goal_tool,
)

from google.genai import types


# ==================================================
# APP
# ==================================================

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# ==================================================
# REQUEST MODELS
# ==================================================

class StudentRegisterRequest(BaseModel):
    name: str
    username: str
    password: str


class ParentRegisterRequest(BaseModel):
    name: str
    username: str
    password: str
    child_id: int


class AttendanceRequest(BaseModel):
    student_id: int
    status: str


class BulkAttendanceItem(BaseModel):
    student_id: int
    status: str


class BulkAttendanceRequest(BaseModel):
    records: List[BulkAttendanceItem]


class EscalationRequestModel(BaseModel):
    reason: str


class AssignTeacherRequest(BaseModel):
    student_id: int
    teacher_id: int


class ChatRequest(BaseModel):
    message: str


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():
    return {
        "message": "XYZ AI Backend is running!"
    }


# ==================================================
# STUDENT REGISTRATION
# ==================================================

@app.post("/register/student")
def register_student(
    student_data: StudentRegisterRequest,
    db: Session = Depends(get_db)
):

    # Check username
    existing_user = db.query(models.User).filter(
        models.User.username == student_data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # Hash password
    hashed_password = get_password_hash(
        student_data.password
    )

    # Create user
    new_user = models.User(
        name=student_data.name,
        username=student_data.username,
        password=hashed_password,
        role="student"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create student profile
    new_student = models.Student(
        name=student_data.name,
        user_id=new_user.id,
        attendance_percentage=0.0
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "message": "Student registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "username": new_user.username,
            "role": new_user.role
        },
        "student": {
            "id": new_student.id,
            "attendance_percentage": new_student.attendance_percentage
        }
    }


# ==================================================
# PARENT REGISTRATION
# ==================================================

@app.post("/register/parent")
def register_parent(
    parent_data: ParentRegisterRequest,
    db: Session = Depends(get_db)
):

    # Check username
    existing_user = db.query(models.User).filter(
        models.User.username == parent_data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # Find child
    student = db.query(models.Student).filter(
        models.Student.id == parent_data.child_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Child/student not found"
        )

    # Check existing parent
    if student.parent_id is not None:
        raise HTTPException(
            status_code=400,
            detail="This student already has a parent"
        )

    # Hash password
    hashed_password = get_password_hash(
        parent_data.password
    )

    # Create parent
    new_parent = models.User(
        name=parent_data.name,
        username=parent_data.username,
        password=hashed_password,
        role="parent"
    )

    db.add(new_parent)
    db.commit()
    db.refresh(new_parent)

    # Link parent to child
    student.parent_id = new_parent.id

    db.commit()
    db.refresh(student)

    return {
        "message": "Parent registered successfully",
        "parent": {
            "id": new_parent.id,
            "name": new_parent.name,
            "username": new_parent.username,
            "role": new_parent.role
        },
        "child": {
            "id": student.id,
            "name": student.name
        }
    }


# ==================================================
# LOGIN
# ==================================================

@app.post("/login")
def login(
    username: str,
    password: str,
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(
        models.User.username == username
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role
        }
    }


# ==================================================
# CURRENT USER
# ==================================================

@app.get("/me")
def get_me(
    current_user: models.User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "role": current_user.role
    }


# ==================================================
# STUDENT - MY ATTENDANCE
# ==================================================

@app.get("/attendance/my")
def get_my_attendance(
    current_user=Depends(require_role("student")),
    db: Session = Depends(get_db)
):

    student = db.query(models.Student).filter(
        models.Student.user_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student record not found"
        )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "attendance_percentage": student.attendance_percentage
    }


# ==================================================
# PARENT - CHILD ATTENDANCE
# ==================================================

@app.get("/attendance/child")
def get_child_attendance(
    current_user=Depends(require_role("parent")),
    db: Session = Depends(get_db)
):

    student = db.query(models.Student).filter(
        models.Student.parent_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Child record not found"
        )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "attendance_percentage": student.attendance_percentage
    }


# ==================================================
# TEACHER - MARK ATTENDANCE
# ==================================================

@app.post("/attendance/mark")
def mark_attendance(
    attendance_data: AttendanceRequest,
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):

    # Find student
    student = db.query(models.Student).filter(
        models.Student.id == attendance_data.student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Check teacher assignment
    if student.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to mark "
                "attendance for this student"
            )
        )

    # Validate status
    status = attendance_data.status.lower().strip()

    if status not in ["present", "absent"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'present' or 'absent'"
        )

    # Create attendance record
    attendance = models.Attendance(
        student_id=student.id,
        date=date.today(),
        status=status
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    # Recalculate attendance
    attendance_records = db.query(
        models.Attendance
    ).filter(
        models.Attendance.student_id == student.id
    ).all()

    total_days = len(attendance_records)

    present_days = sum(
        1
        for record in attendance_records
        if record.status == "present"
    )

    attendance_percentage = (
        (present_days / total_days) * 100
        if total_days > 0
        else 0.0
    )

    student.attendance_percentage = round(
        attendance_percentage,
        2
    )

    db.commit()
    db.refresh(student)

    return {
        "message": "Attendance marked successfully",
        "attendance_id": attendance.id,
        "student_id": student.id,
        "student_name": student.name,
        "date": attendance.date.isoformat(),
        "status": attendance.status,
        "attendance_percentage": student.attendance_percentage
    }


# ==================================================
# TEACHER - BULK ATTENDANCE MARKING
# ==================================================

@app.post("/attendance/mark-bulk")
def mark_attendance_bulk(
    bulk_data: BulkAttendanceRequest,
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    if not bulk_data.records:
        raise HTTPException(
            status_code=400,
            detail="No attendance records provided"
        )

    processed_records = []
    present_count = 0
    absent_count = 0
    today = date.today()

    for item in bulk_data.records:
        student = db.query(models.Student).filter(
            models.Student.id == item.student_id
        ).first()

        if not student or student.teacher_id != current_user.id:
            continue

        status = item.status.lower().strip()
        if status not in ["present", "absent"]:
            status = "present"

        attendance = models.Attendance(
            student_id=student.id,
            date=today,
            status=status
        )
        db.add(attendance)
        db.commit()

        if status == "present":
            present_count += 1
        else:
            absent_count += 1

        records = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id
        ).all()
        total_days = len(records)
        present_days = sum(1 for r in records if r.status == "present")
        student.attendance_percentage = round((present_days / total_days) * 100, 2) if total_days > 0 else 0.0
        db.commit()

        processed_records.append({
            "student_id": student.id,
            "student_name": student.name,
            "status": status,
            "attendance_percentage": student.attendance_percentage
        })

    return {
        "message": f"Bulk attendance marked successfully for {len(processed_records)} students.",
        "processed_count": len(processed_records),
        "present_count": present_count,
        "absent_count": absent_count,
        "students": processed_records
    }


# ==================================================
# REPORTS - EXPORT EXCEL & PDF
# ==================================================

@app.get("/reports/export/excel")
def export_attendance_excel(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["teacher", "principal"]:
        raise HTTPException(status_code=403, detail="Unauthorized role for report export")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance Report"

    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="172033", end_color="172033", fill_type="solid")
    title_font = Font(name="Arial", size=15, bold=True, color="FF7A00")
    subtitle_font = Font(name="Arial", size=10, italic=True, color="667085")

    ws.merge_cells("A1:E1")
    ws["A1"] = "XYZ AI Assistant — Official Attendance Report"
    ws["A1"].font = title_font

    ws.merge_cells("A2:E2")
    ws["A2"] = f"Generated by: {current_user.name} ({current_user.role.capitalize()}) | Date: {date.today().isoformat()}"
    ws["A2"].font = subtitle_font

    headers = ["Student ID", "Student Name", "Attendance %", "Standing", "Assigned Teacher"]
    ws.append([])
    ws.append(headers)

    for col in range(1, 6):
        cell = ws.cell(row=4, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")

    if current_user.role == "teacher":
        students = db.query(models.Student).filter(models.Student.teacher_id == current_user.id).all()
    else:
        students = db.query(models.Student).all()

    for idx, s in enumerate(students, start=5):
        perc = s.attendance_percentage or 0.0
        standing = "Good Standing" if perc >= 85 else ("Needs Attention" if perc >= 75 else "Low Attendance")
        teacher = db.query(models.User).filter(models.User.id == s.teacher_id).first()
        teacher_name = teacher.name if teacher else "N/A"

        row = [s.id, s.name, f"{perc}%", standing, teacher_name]
        ws.append(row)

    ws.column_dimensions["A"].width = 15
    ws.column_dimensions["B"].width = 25
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 20
    ws.column_dimensions["E"].width = 25

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"attendance_report_{date.today().isoformat()}.xlsx"
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/reports/export/pdf")
def export_attendance_pdf(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["teacher", "principal"]:
        raise HTTPException(status_code=403, detail="Unauthorized role for report export")

    if current_user.role == "teacher":
        students = db.query(models.Student).filter(models.Student.teacher_id == current_user.id).all()
    else:
        students = db.query(models.Student).all()

    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#FF7A00'),
        spaceAfter=6
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#667085'),
        spaceAfter=20
    )

    story.append(Paragraph("XYZ AI Assistant — Official Attendance Report", title_style))
    story.append(Paragraph(f"Generated By: {current_user.name} ({current_user.role.capitalize()}) | Date: {date.today().isoformat()}", meta_style))

    data = [["Student ID", "Student Name", "Attendance Rate", "Academic Standing"]]

    for s in students:
        perc = s.attendance_percentage or 0.0
        standing = "Good Standing" if perc >= 85 else ("Needs Attention" if perc >= 75 else "Low Attendance")
        data.append([f"#{s.id}", s.name, f"{perc:.1f}%", standing])

    t = Table(data, colWidths=[80, 200, 120, 140])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#172033')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 11),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 10),
    ]))

    story.append(t)
    doc.build(story)

    stream.seek(0)
    filename = f"attendance_report_{date.today().isoformat()}.pdf"
    return Response(
        content=stream.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==================================================
# ASSIGN TEACHER TO STUDENT
# ==================================================

@app.post("/teacher/assign")
def assign_teacher(
    assignment: AssignTeacherRequest,
    db: Session = Depends(get_db)
):

    # Find student
    student = db.query(models.Student).filter(
        models.Student.id == assignment.student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Find teacher
    teacher = db.query(models.User).filter(
        models.User.id == assignment.teacher_id,
        models.User.role == "teacher"
    ).first()

    if teacher is None:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found"
        )

    # Assign teacher
    student.teacher_id = teacher.id

    db.commit()
    db.refresh(student)

    return {
        "message": "Teacher assigned successfully",
        "student": {
            "id": student.id,
            "name": student.name
        },
        "teacher": {
            "id": teacher.id,
            "name": teacher.name
        }
    }

# ==================================================
# TEACHER - GET ASSIGNED STUDENTS
# ==================================================

@app.get("/teacher/students")
def get_teacher_students(
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    students = db.query(models.Student).filter(
        models.Student.teacher_id == current_user.id
    ).all()

    return {
        "teacher_id": current_user.id,
        "teacher_name": current_user.name,
        "students": [
            {
                "id": student.id,
                "name": student.name,
                "attendance_percentage":
                    student.attendance_percentage or 0.0
            }
            for student in students
        ]
    }



# ==================================================
# PARENT - REQUEST TEACHER ESCALATION
# ==================================================

@app.post("/escalation/request")
def request_escalation(
    escalation_data: EscalationRequestModel,
    current_user=Depends(require_role("parent")),
    db: Session = Depends(get_db)
):

    student = db.query(models.Student).filter(
        models.Student.parent_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Child record not found"
        )

    if student.teacher_id is None:
        raise HTTPException(
            status_code=404,
            detail="No teacher assigned to this student"
        )

    ticket_id = (
        "TKT-" +
        uuid.uuid4().hex[:8].upper()
    )

    escalation = models.EscalationRequest(
        requester_id=current_user.id,
        student_id=student.id,
        teacher_id=student.teacher_id,
        request_type="teacher_call",
        reason=escalation_data.reason,
        status="confirmed",
        ticket_id=ticket_id
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
        "status": escalation.status
    }


# ==================================================
# PRINCIPAL - OVERALL ATTENDANCE
# ==================================================

@app.get("/attendance/overall")
def get_overall_attendance(
    current_user=Depends(require_role("principal")),
    db: Session = Depends(get_db)
):

    students = db.query(models.Student).all()

    if not students:
        raise HTTPException(
            status_code=404,
            detail="No students found"
        )

    total_attendance = sum(
        student.attendance_percentage or 0.0
        for student in students
    )

    overall_percentage = (
        total_attendance / len(students)
    )

    return {
        "total_students": len(students),
        "overall_attendance_percentage": round(
            overall_percentage,
            2
        )
    }


# ==================================================
# TEST MY ATTENDANCE
# ==================================================

@app.get("/tools/my-attendance")
def test_my_attendance(
    current_user=Depends(require_role("student")),
    db: Session = Depends(get_db)
):

    return get_my_attendance(
        current_user,
        db
    )

def calculate_attendance_goal(
    current_user,
    db: Session,
    target_percentage: float
):
    # Only students can use this
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can calculate their attendance goal"
        )

    # Validate target
    if target_percentage <= 0 or target_percentage > 100:
        raise HTTPException(
            status_code=400,
            detail="Target percentage must be between 1 and 100"
        )

    # Find student
    student = db.query(models.Student).filter(
        models.Student.user_id == current_user.id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student record not found"
        )

    current_percentage = student.attendance_percentage

    # Already reached target
    if current_percentage >= target_percentage:
        return {
            "current_percentage": current_percentage,
            "target_percentage": target_percentage,
            "classes_needed": 0,
            "message": (
                f"You have already reached your target "
                f"attendance of {target_percentage}%."
            )
        }

    # ------------------------------------------------
    # Get actual attendance records
    # ------------------------------------------------

    attendance_records = db.query(
        models.Attendance
    ).filter(
        models.Attendance.student_id == student.id
    ).all()

    total_classes = len(attendance_records)

    present_classes = sum(
        1
        for record in attendance_records
        if record.status.lower() == "present"
    )

    # If no attendance records exist
    if total_classes == 0:
        raise HTTPException(
            status_code=400,
            detail="No attendance records available"
        )

    # ------------------------------------------------
    # Calculate required future classes
    # ------------------------------------------------

    classes_needed = 0

    while (
        (present_classes + classes_needed)
        / (total_classes + classes_needed)
        * 100
    ) < target_percentage:

        classes_needed += 1

    final_percentage = (
        (present_classes + classes_needed)
        / (total_classes + classes_needed)
        * 100
    )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "current_percentage": round(
            current_percentage,
            2
        ),
        "target_percentage": target_percentage,
        "classes_needed": classes_needed,
        "final_percentage": round(
            final_percentage,
            2
        )
    }

# ==================================================
# AI CHAT - GEMINI TOOL CALLING
# ==================================================

# ==================================================
# AI CHAT - GEMINI TOOL CALLING
# ==================================================

@app.post("/chat")
def chat(
    chat_data: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ------------------------------------------------
    # 1. Send user message to Gemini
    # ------------------------------------------------

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=chat_data.message,
        config={
            "system_instruction": (
                "You are XYZ AI Assistant, a helpful school assistant. "

                f"The logged-in user's role is {current_user.role}. "

                "For a student asking about their own attendance, "
                "use get_my_attendance. "

                "For a student asking how many classes they need "
                "to attend to reach a target percentage, "
                "use calculate_attendance_goal. "

                "For a parent asking about their child's attendance, "
                "use get_child_attendance. "

                "For a teacher asking to mark attendance, "
                "use mark_attendance. "

                "Never invent attendance information. "
                "Ask for missing information when necessary."
            ),

            "tools": [
                {
                    "function_declarations": [
                        get_my_attendance_tool,
                        get_child_attendance_tool,
                        mark_attendance_tool,
                        calculate_attendance_goal_tool
                    ]
                }
            ]
        }
    )

    # ------------------------------------------------
    # 2. Check Gemini tool calls
    # ------------------------------------------------

    for candidate in response.candidates:

        for part in candidate.content.parts:

            if not part.function_call:
                continue

            function_name = part.function_call.name

            # ========================================
            # STUDENT - MY ATTENDANCE
            # ========================================

            if function_name == "get_my_attendance":

                # Security check
                if current_user.role != "student":
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            "Only students can access "
                            "their own attendance"
                        )
                    )

                # Execute backend function
                tool_result = get_my_attendance(
                    current_user,
                    db
                )

                # Make JSON safe
                tool_result = json.loads(
                    json.dumps(
                        tool_result,
                        default=str
                    )
                )

                # Send result back to Gemini
                follow_up = client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=[
                        chat_data.message,
                        response.candidates[0].content,

                        types.Part.from_function_response(
                            name="get_my_attendance",
                            response=tool_result
                        )
                    ],

                    config={
                        "system_instruction": (
                            "You are XYZ AI Assistant. "

                            "Use the tool result to answer naturally. "

                            "Mention the attendance percentage clearly. "

                            "Give a short helpful suggestion. "

                            "Never invent or change information."
                        )
                    }
                )

                return {
                    "message": follow_up.text,
                    "tool_used": "get_my_attendance",
                    "data": tool_result
                }

            # ========================================
            # STUDENT - ATTENDANCE GOAL
            # ========================================

            elif function_name == "calculate_attendance_goal":

                # ------------------------------------
                # Security check
                # ------------------------------------

                if current_user.role != "student":
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            "Only students can calculate "
                            "their own attendance goal"
                        )
                    )

                # ------------------------------------
                # Get Gemini arguments
                # ------------------------------------

                target_percentage = (
                    part.function_call.args.get(
                        "target_percentage"
                    )
                )

                if target_percentage is None:
                    raise HTTPException(
                        status_code=400,
                        detail="Target percentage is required"
                    )

                # ------------------------------------
                # Execute backend calculation
                # ------------------------------------

                tool_result = calculate_attendance_goal(
                    current_user=current_user,
                    db=db,
                    target_percentage=float(
                        target_percentage
                    )
                )

                # ------------------------------------
                # Make result JSON safe
                # ------------------------------------

                tool_result = json.loads(
                    json.dumps(
                        tool_result,
                        default=str
                    )
                )

                # ------------------------------------
                # Send result back to Gemini
                # ------------------------------------

                follow_up = client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=[
                        chat_data.message,
                        response.candidates[0].content,

                        types.Part.from_function_response(
                            name="calculate_attendance_goal",
                            response=tool_result
                        )
                    ],

                    config={
                        "system_instruction": (
                            "You are XYZ AI Assistant, "
                            "a friendly school assistant. "

                            "Use the backend tool result "
                            "to answer the student. "

                            "Never invent or change "
                            "attendance numbers. "

                            "Clearly mention: "
                            "current attendance, "
                            "target attendance, and "
                            "number of classes required. "

                            "Give a short helpful suggestion."
                        )
                    }
                )

                return {
                    "message": follow_up.text,
                    "tool_used": "calculate_attendance_goal",
                    "data": tool_result
                }

            # ========================================
            # PARENT - CHILD ATTENDANCE
            # ========================================

            elif function_name == "get_child_attendance":

                # Security check
                if current_user.role != "parent":
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            "Only parents can access "
                            "their child's attendance"
                        )
                    )

                # Execute backend function
                tool_result = get_child_attendance(
                    current_user,
                    db
                )

                # Make JSON safe
                tool_result = json.loads(
                    json.dumps(
                        tool_result,
                        default=str
                    )
                )

                # Send result back to Gemini
                follow_up = client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=[
                        chat_data.message,
                        response.candidates[0].content,

                        types.Part.from_function_response(
                            name="get_child_attendance",
                            response=tool_result
                        )
                    ],

                    config={
                        "system_instruction": (
                            "You are XYZ AI Assistant. "

                            "Use the tool result "
                            "to answer naturally. "

                            "Mention the child's name "
                            "and attendance percentage clearly. "

                            "Never invent information."
                        )
                    }
                )

                return {
                    "message": follow_up.text,
                    "tool_used": "get_child_attendance",
                    "data": tool_result
                }

            # ========================================
            # TEACHER - MARK ATTENDANCE
            # ========================================

            elif function_name == "mark_attendance":

                # ------------------------------------
                # Security check
                # ------------------------------------

                if current_user.role != "teacher":
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            "Only teachers can "
                            "mark attendance"
                        )
                    )

                # ------------------------------------
                # Get Gemini arguments
                # ------------------------------------

                student_name = (
                    part.function_call.args.get(
                        "student_name"
                    )
                )

                status = (
                    part.function_call.args.get(
                        "status"
                    )
                )

                if not student_name:
                    raise HTTPException(
                        status_code=400,
                        detail="Student name is required"
                    )

                if not status:
                    raise HTTPException(
                        status_code=400,
                        detail="Attendance status is required"
                    )

                status = status.lower().strip()

                if status not in [
                    "present",
                    "absent"
                ]:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Status must be "
                            "'present' or 'absent'"
                        )
                    )

                # ------------------------------------
                # Find student
                # ------------------------------------

                student = db.query(
                    models.Student
                ).filter(
                    models.Student.name.ilike(
                        student_name.strip()
                    )
                ).first()

                if student is None:
                    raise HTTPException(
                        status_code=404,
                        detail=(
                            f"Student '{student_name}' "
                            "not found"
                        )
                    )

                # ------------------------------------
                # Check teacher assignment
                # ------------------------------------

                if student.teacher_id != current_user.id:
                    raise HTTPException(
                        status_code=403,
                        detail=(
                            "You are not authorized to "
                            "mark attendance for this student"
                        )
                    )

                # ------------------------------------
                # Create AttendanceRequest
                # ------------------------------------

                attendance_data = AttendanceRequest(
                    student_id=student.id,
                    status=status
                )

                # ------------------------------------
                # Execute backend function
                # ------------------------------------

                tool_result = mark_attendance(
                    attendance_data,
                    current_user,
                    db
                )

                # ------------------------------------
                # Make result JSON safe
                # ------------------------------------

                tool_result = json.loads(
                    json.dumps(
                        tool_result,
                        default=str
                    )
                )

                # ------------------------------------
                # Send result back to Gemini
                # ------------------------------------

                follow_up = client.models.generate_content(
                    model="gemini-3.6-flash",

                    contents=[
                        chat_data.message,
                        response.candidates[0].content,

                        types.Part.from_function_response(
                            name="mark_attendance",
                            response=tool_result
                        )
                    ],

                    config={
                        "system_instruction": (
                            "You are XYZ AI Assistant, "
                            "a professional teaching assistant. "

                            "Tell the teacher clearly "
                            "that attendance was marked successfully. "

                            "Mention the student's name, "
                            "status, and updated attendance "
                            "percentage. "

                            "Never invent information."
                        )
                    }
                )

                return {
                    "message": follow_up.text,
                    "tool_used": "mark_attendance",
                    "data": tool_result
                }

    # ------------------------------------------------
    # 3. No tool required
    # ------------------------------------------------

    return {
        "message": response.text,
        "tool_used": None
    }