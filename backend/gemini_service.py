import os

from dotenv import load_dotenv
from google import genai

from gemini_tools import (
    get_my_attendance_tool,
    get_child_attendance_tool,
    mark_attendance_tool
)
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not configured")

client = genai.Client(
    api_key=GEMINI_API_KEY
)


import os

from dotenv import load_dotenv
from google import genai

from gemini_tools import (
    get_my_attendance_tool,
    get_child_attendance_tool,
    mark_attendance_tool
)

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not configured")

client = genai.Client(
    api_key=GEMINI_API_KEY
)


def ask_gemini(message: str):

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=message,
        config={
            "system_instruction": (
                "You are XYZ AI Assistant, a helpful school assistant. "
                "You can help students, parents, and teachers. "
                "Use the appropriate tool when the user asks for "
                "attendance information or attendance marking. "
                "Never invent attendance information."
            ),
            "tools": [
                {
                    "function_declarations": [
                        get_my_attendance_tool,
                        get_child_attendance_tool,
                        mark_attendance_tool
                    ]
                }
            ]
        }
    )

    return response