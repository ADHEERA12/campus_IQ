# ==================================================
# GEMINI TOOL DEFINITIONS
# ==================================================

get_my_attendance_tool = {
    "name": "get_my_attendance",
    "description": (
        "Get the attendance percentage of the currently "
        "logged-in student. Use this when a student asks "
        "about their own attendance."
    ),
    "parameters": {
        "type": "object",
        "properties": {},
        "required": []
    }
}


get_child_attendance_tool = {
    "name": "get_child_attendance",
    "description": (
        "Get the attendance percentage of the child belonging "
        "to the currently logged-in parent. Use this when a "
        "parent asks about their child's attendance."
    ),
    "parameters": {
        "type": "object",
        "properties": {},
        "required": []
    }
}
# mark_attendance_tool = {
#     "name": "mark_attendance",
#     "description": (
#         "Mark a student's attendance as present or absent. "
#         "Use this when a teacher wants to mark attendance "
#         "for a student."
#     ),
#     "parameters": {
#         "type": "object",
#         "properties": {
#             "student_name": {
#                 "type": "string",
#                 "description": "The name of the student."
#             },
#             "status": {
#                 "type": "string",
#                 "description": "Attendance status.",
#                 "enum": ["present", "absent"]
#             }
#         },
#         "required": ["student_name", "status"]
#     }
# }
mark_attendance_tool = {
    "name": "mark_attendance",
    "description": "Mark attendance for a student assigned to the logged-in teacher.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "student_name": {
                "type": "STRING",
                "description": "Name of the student"
            },
            "status": {
                "type": "STRING",
                "enum": ["present", "absent"],
                "description": "Attendance status"
            }
        },
        "required": [
            "student_name",
            "status"
        ]
    }
}


calculate_attendance_goal_tool = {
    "name": "calculate_attendance_goal",
    "description": (
        "Calculate how many consecutive classes a student needs "
        "to attend to reach a target attendance percentage."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "target_percentage": {
                "type": "number",
                "description": (
                    "The target attendance percentage the student wants to reach, "
                    "for example 80 or 85."
                )
            }
        },
        "required": ["target_percentage"]
    }
}