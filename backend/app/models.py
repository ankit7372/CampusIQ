

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    ForeignKey,
    UniqueConstraint,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    duration_years = Column(Integer, nullable=False, default=4)
    description = Column(Text, nullable=True)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    course = Column(String(100), nullable=False)
    semester = Column(Integer, nullable=False)

    attendance_records = relationship(
        "Attendance",
        back_populates="student",
        cascade="all, delete-orphan",
    )


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False)

    student = relationship(
        "Student",
        back_populates="attendance_records",
    )

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "date",
            name="unique_student_attendance_per_day",
        ),
    )
