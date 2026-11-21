# Campus IQ 🎓

### AI-Powered Campus Management & Attendance Intelligence Platform

Campus IQ is a full-stack campus management platform designed to simplify attendance tracking, student management, reporting, and campus operations through role-based access and intelligent features.

The platform connects administrators, teachers, students, parents, and principals through a centralized system with a modern web interface and RESTful backend.

---

## 🚀 Features

- **Role-Based Authentication** — Secure login and access control for Admin, Teacher, Student, Parent, and Principal.
- **Student Management** — Manage student records and academic information.
- **Attendance Management** — Record, monitor, and manage student attendance.
- **Class Management** — Organize students by classes and sections.
- **Dashboard Analytics** — Role-specific dashboards and attendance insights.
- **Reports** — Generate and access attendance reports.
- **AI Assistant** — AI-powered assistance for campus-related queries.
- **REST API** — Backend APIs connecting frontend and database.
- **Cloud Deployment** — Deployed frontend and backend services.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| UI | CSS, Lucide React |
| Backend | Python, FastAPI |
| Database | MySQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| AI Integration | Google Gemini |
| API Communication | Axios |
| Frontend Deployment | Vercel |
| Backend Deployment | Railway |

---

## 🏗️ System Architecture

```text
                ┌─────────────────────────┐
                │     React Frontend      │
                │       (Vercel)          │
                └────────────┬────────────┘
                             │
                      REST API + JWT
                             │
                ┌────────────▼────────────┐
                │     FastAPI Backend     │
                │       (Railway)         │
                └────────────┬────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │ Authentication│   │ Application │   │ AI Assistant│
   │   & Security │   │   Routers   │   │ Integration │
   └──────────────┘   └─────────────┘   └─────────────┘
                             │
                ┌────────────▼────────────┐
                │       MySQL Database    │
                └─────────────────────────┘
```

---

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Admin | Manage campus users, students, classes, and system operations |
| Teacher | Manage classroom activities and student attendance |
| Student | Access personal academic and attendance information |
| Parent | Monitor student attendance and related information |
| Principal | View campus-level information and reports |

---

## 📂 Project Structure

```text
Campus-IQ/
│
├── backend/
│   ├── database/
│   │   ├── database.py
│   │   └── models.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── student.py
│   │   ├── teacher.py
│   │   ├── parent.py
│   │   ├── principal.py
│   │   ├── attendance.py
│   │   ├── reports.py
│   │   └── chat.py
│   │
│   ├── auth.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vercel.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/ADHEERA12/campus_IQ.git
cd campus_IQ
```

### 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables in a `.env` file:

```env
DATABASE_URL=your_mysql_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:5173
```

Start the backend server:

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

API Documentation:

```text
http://localhost:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure frontend environment variables in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 🌐 Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend API | Railway |
| Database | Railway MySQL |

Environment variables and credentials should be configured through deployment platform settings and must not be committed to the repository.

---


## 🔒 Security

- JWT-based authentication
- Password hashing
- Role-based access control
- Protected API endpoints
- Environment-based configuration
- CORS configuration for authorized frontend origins

---

## 🎯 Project Objective

The objective of Campus IQ is to centralize campus operations into a connected platform, reduce manual attendance-management workflows, improve accessibility of academic information, and provide intelligent insights through AI-assisted functionality.

---

## 👩‍💻 Developers

Developed as a full-stack software project focused on campus management, attendance automation, web application development, and AI integration.

---

## 📄 License

This project is developed for educational and project demonstration purposes.
