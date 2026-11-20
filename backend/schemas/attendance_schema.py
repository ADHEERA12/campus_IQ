from pydantic import BaseModel
from typing import List


class AttendanceRequest(BaseModel):
    student_id: int
    status: str


class BulkAttendanceItem(BaseModel):
    student_id: int
    status: str


class BulkAttendanceRequest(BaseModel):
    records: List[BulkAttendanceItem]


class AssignTeacherRequest(BaseModel):
    student_id: int
    teacher_id: int 
class EscalationRequestModel(BaseModel):
    reason: str