import time
import os
from pathlib import Path
from datetime import date

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app import models
from app.models import Student, Attendance, Course


# ---------------- ENVIRONMENT ----------------

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_FILE, override=True)


# ---------------- APPLICATION ----------------

app = FastAPI(
    title="CampusIQ AI",
    description="Smart Campus Management System",
    version="1.0.0",
)

# Create missing tables without deleting existing records.
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- GENERAL APIs ----------------

@app.get("/")
def home():
    return {
        "message": "Welcome to CampusIQ AI",
        "status": "Backend is running.",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()

        return {
            "status": "connected",
            "database": database_name,
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed.",
        )


# ---------------- STUDENT APIs ----------------

def student_data(student):
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "course": student.course,
        "semester": student.semester,
    }


@app.post("/students")
def create_student(
    name: str,
    email: str,
    course: str,
    semester: int,
    db: Session = Depends(get_db),
):
    name = name.strip()
    email = email.strip()
    course = course.strip()

    if not name or not email or not course:
        raise HTTPException(
            422, "Name, email and course are required."
        )

    if semester < 1 or semester > 12:
        raise HTTPException(
            422, "Semester must be between 1 and 12."
        )

    existing = db.query(Student).filter(
        Student.email == email
    ).first()

    if existing:
        raise HTTPException(
            409, "A student with this email already exists."
        )

    student = Student(
        name=name,
        email=email,
        course=course,
        semester=semester,
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "message": "Student created successfully",
        "student": student_data(student),
    }


@app.get("/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id).all()
    return [student_data(student) for student in students]


@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    name: str,
    email: str,
    course: str,
    semester: int,
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(404, "Student not found.")

    name = name.strip()
    email = email.strip()
    course = course.strip()

    if not name or not email or not course:
        raise HTTPException(
            422, "Name, email and course are required."
        )

    if semester < 1 or semester > 12:
        raise HTTPException(
            422, "Semester must be between 1 and 12."
        )

    duplicate = db.query(Student).filter(
        Student.email == email,
        Student.id != student_id,
    ).first()

    if duplicate:
        raise HTTPException(
            409, "Email already belongs to another student."
        )

    student.name = name
    student.email = email
    student.course = course
    student.semester = semester

    db.commit()
    db.refresh(student)

    return {
        "message": "Student updated successfully",
        "student": student_data(student),
    }


@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(404, "Student not found.")

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully"}


# ---------------- ATTENDANCE APIs ----------------

def attendance_data(record):
    return {
        "id": record.id,
        "student_id": record.student_id,
        "student_name": record.student.name,
        "date": record.date.isoformat(),
        "status": record.status,
    }


@app.post("/attendance")
def mark_attendance(
    student_id: int,
    status: str,
    attendance_date: date | None = None,
    db: Session = Depends(get_db),
):
    status = status.strip().capitalize()
    attendance_date = attendance_date or date.today()

    if status not in {"Present", "Absent"}:
        raise HTTPException(
            422, "Status must be Present or Absent."
        )

    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(404, "Student not found.")

    existing = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.date == attendance_date,
    ).first()

    if existing:
        raise HTTPException(
            409,
            "Attendance is already marked for this student on this date.",
        )

    record = Attendance(
        student_id=student_id,
        date=attendance_date,
        status=status,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Attendance marked successfully",
        "attendance": attendance_data(record),
    }


@app.get("/attendance")
def get_attendance(
    attendance_date: date | None = None,
    student_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Attendance)

    if attendance_date is not None:
        query = query.filter(
            Attendance.date == attendance_date
        )

    if student_id is not None:
        query = query.filter(
            Attendance.student_id == student_id
        )

    records = query.order_by(
        Attendance.date.desc(),
        Attendance.id.desc(),
    ).all()

    return [attendance_data(record) for record in records]


@app.put("/attendance/{attendance_id}")
def update_attendance(
    attendance_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    status = status.strip().capitalize()

    if status not in {"Present", "Absent"}:
        raise HTTPException(
            422, "Status must be Present or Absent."
        )

    record = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if record is None:
        raise HTTPException(
            404, "Attendance record not found."
        )

    record.status = status
    db.commit()
    db.refresh(record)

    return {
        "message": "Attendance updated successfully",
        "attendance": attendance_data(record),
    }


@app.get("/attendance/summary/{student_id}")
def attendance_summary(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(404, "Student not found.")

    records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).all()

    total = len(records)
    present = sum(
        1 for record in records
        if record.status == "Present"
    )
    absent = total - present
    percentage = (
        round((present / total) * 100, 2)
        if total else 0.0
    )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "total_classes_recorded": total,
        "present": present,
        "absent": absent,
        "attendance_percentage": percentage,
    }


# ---------------- COURSE APIs ----------------

def course_data(course, db):
    enrolled_count = db.query(Student).filter(
        Student.course == course.name
    ).count()

    return {
        "id": course.id,
        "name": course.name,
        "code": course.code,
        "duration_years": course.duration_years,
        "description": course.description,
        "enrolled_students": enrolled_count,
    }


@app.post("/courses")
def create_course(
    name: str,
    code: str,
    duration_years: int = 4,
    description: str | None = None,
    db: Session = Depends(get_db),
):
    name = name.strip()
    code = code.strip().upper()

    if not name or not code:
        raise HTTPException(
            422, "Course name and code are required."
        )

    if duration_years < 1 or duration_years > 10:
        raise HTTPException(
            422, "Duration must be between 1 and 10 years."
        )

    if db.query(Course).filter(
        Course.code == code
    ).first():
        raise HTTPException(
            409, "A course with this code already exists."
        )

    course = Course(
        name=name,
        code=code,
        duration_years=duration_years,
        description=description.strip() if description else None,
    )

    db.add(course)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "A course with this code already exists."
        )

    db.refresh(course)

    return {
        "message": "Course created successfully.",
        "course": course_data(course, db),
    }


@app.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).order_by(Course.name).all()
    return [course_data(course, db) for course in courses]


@app.put("/courses/{course_id}")
def update_course(
    course_id: int,
    name: str,
    code: str,
    duration_years: int = 4,
    description: str | None = None,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if course is None:
        raise HTTPException(404, "Course not found.")

    name = name.strip()
    code = code.strip().upper()

    if not name or not code:
        raise HTTPException(
            422, "Course name and code are required."
        )

    if duration_years < 1 or duration_years > 10:
        raise HTTPException(
            422, "Duration must be between 1 and 10 years."
        )

    duplicate = db.query(Course).filter(
        Course.code == code,
        Course.id != course_id,
    ).first()

    if duplicate:
        raise HTTPException(
            409, "Another course already uses this code."
        )

    old_name = course.name
    course.name = name
    course.code = code
    course.duration_years = duration_years
    course.description = (
        description.strip() if description else None
    )

    if old_name != name:
        db.query(Student).filter(
            Student.course == old_name
        ).update(
            {Student.course: name},
            synchronize_session=False,
        )

    db.commit()
    db.refresh(course)

    return {
        "message": "Course updated successfully.",
        "course": course_data(course, db),
    }


@app.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if course is None:
        raise HTTPException(404, "Course not found.")

    enrolled_count = db.query(Student).filter(
        Student.course == course.name
    ).count()

    if enrolled_count:
        raise HTTPException(
            409,
            detail=(
                f"Cannot delete this course because {enrolled_count} "
                "student(s) are using it."
            ),
        )

    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully."}


# ---------------- AI ASSISTANT API ----------------

class ChatRequest(BaseModel):
    message: str


@app.post("/ai/chat")
def ai_chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=422,
            detail="Message must be under 2000 characters.",
        )

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is not configured.",
        )

    try:
        client = genai.Client(api_key=api_key)
        start_time = time.perf_counter()
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=message,
            config={
                "system_instruction": (
                    "You are CampusIQ AI Assistant, a helpful assistant "
                    "for a college campus management system. Answer "
                    "questions about students, attendance, courses, "
                    "programming, and campus life. Be friendly, "
                    "concise, and beginner-friendly. Never claim to have "
                    "accessed student records or database information "
                    "unless it was explicitly provided."
                ),
                "max_output_tokens": 300,
            },
        )

        answer = response.text

        if not answer:
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty response. Please try again.",
            )

        return {
            "answer": answer,
            "status": "success",
        }

    except HTTPException:
        raise
    except Exception as exc:
        # Diagnostic details go to the backend terminal, not the API key.
        print(
            "Gemini API error:",
            type(exc).__name__,
            str(exc)[:1000],
        )

        raise HTTPException(
            status_code=502,
            detail=f"Gemini request failed: {type(exc).__name__}. "
                   "Check the backend terminal for details.",
        )
