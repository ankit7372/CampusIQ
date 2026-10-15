
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import engine, get_db
from app.models import Student

app = FastAPI(
    title="CampusIQ AI",
    description="Smart Campus Management System",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.post("/students")
def create_student(
    name: str,
    email: str,
    course: str,
    semester: int,
    db: Session = Depends(get_db),
):
    existing_student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=409,
            detail="A student with this email already exists.",
        )

    if semester < 1 or semester > 12:
        raise HTTPException(
            status_code=422,
            detail="Semester must be between 1 and 12.",
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
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "course": student.course,
            "semester": student.semester,
        },
    }


@app.get("/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id).all()

    return [
        {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "course": student.course,
            "semester": student.semester,
        }
        for student in students
    ]








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
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    duplicate = db.query(Student).filter(
        Student.email == email,
        Student.id != student_id,
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Email already belongs to another student",
        )

    if semester < 1 or semester > 12:
        raise HTTPException(
            status_code=422,
            detail="Semester must be between 1 and 12",
        )

    student.name = name
    student.email = email
    student.course = course
    student.semester = semester

    db.commit()
    db.refresh(student)

    return {
        "message": "Student updated successfully",
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "course": student.course,
            "semester": student.semester,
        },
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
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully"}
