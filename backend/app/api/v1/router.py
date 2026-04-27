from fastapi import APIRouter
from app.api.v1.endpoints import auth, employees, attendance, payroll, leaves, reports

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(payroll.router)
api_router.include_router(leaves.router)
api_router.include_router(reports.router)
