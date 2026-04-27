# HRMS Modern - API Documentation

> **Base URL:** `http://localhost:8000/api/v1`  
> **Interactive Docs:** http://localhost:8000/docs (Swagger)  
> **Authentication:** Bearer token in Authorization header

---

## Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=admin@hrms.local&password=admin123
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@hrms.local",
    "role": "admin",
    "full_name": "Administrator"
  }
}
```

### Seed Admin (Development Only)
```http
POST /auth/seed-admin
```

---

## Employee Endpoints

### List Employees
```http
GET /employees?page=1&limit=25&search=john&status=Active
Authorization: Bearer <token>
```

**Parameters:**
- `page` (int, default: 1) - Page number
- `limit` (int, default: 25) - Items per page
- `search` (string) - Search by name or ID
- `status` (string) - Filter by status (Active/Inactive/Separated)

**Response (200):**
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "employee_id": "EMP001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@company.com",
      "designation": "Senior Developer",
      "status": "Active",
      "joining_date": "2023-01-15",
      "department": {
        "id": "...",
        "name": "IT"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 25,
  "pages": 2
}
```

### Get Employee
```http
GET /employees/{employee_id}
Authorization: Bearer <token>
```

### Create Employee
```http
POST /employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee_id": "EMP042",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com",
  "phone": "9876543210",
  "designation": "Manager",
  "gender": "Female",
  "status": "Active",
  "joining_date": "2024-01-01",
  "pan_number": "ABCDE1234F",
  "bank_ifsc_code": "SBIN0001234"
}
```

### Update Employee
```http
PUT /employees/{employee_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "designation": "Senior Manager",
  "status": "Active"
}
```

### Delete Employee
```http
DELETE /employees/{employee_id}
Authorization: Bearer <token>
```

### Bulk Import Employees
```http
POST /employees/bulk-import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <Excel file>
```

---

## Attendance Endpoints

### List Attendance Records
```http
GET /attendance?page=1&limit=50&employee_id=EMP001&from_date=2024-01-01&to_date=2024-01-31
Authorization: Bearer <token>
```

### Mark Attendance
```http
POST /attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee_id": "123e4567-e89b-12d3-a456-426614174000",
  "attendance_date": "2024-01-15",
  "status": "Present",
  "remarks": "On time"
}
```

**Status Values:** Present, Absent, Leave, Half Day, Holiday, Weekoff

### Get Summary
```http
GET /attendance/summary?employee_id={id}&month=1&year=2024
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "present": 20,
  "absent": 2,
  "leave": 3,
  "half_day": 1,
  "holiday": 2,
  "weekoff": 2,
  "total_working_days": 21
}
```

### Approve/Reject Attendance
```http
POST /attendance/{record_id}/approve?action=approve
Authorization: Bearer <token>
```

**Action Values:** approve, reject

### Export Attendance Report
```http
GET /attendance/report/export?month=1&year=2024
Authorization: Bearer <token>
```

**Response:** Excel file (.xlsx)

---

## Leave Endpoints

### List Leave Types
```http
GET /leaves/types
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "...",
    "name": "Casual Leave",
    "max_days_per_year": 12,
    "description": "..."
  }
]
```

### Get Leave Balance
```http
GET /leaves/balance?employee_id={id}
Authorization: Bearer <token>
```

### Apply for Leave
```http
POST /leaves/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "leave_type_id": "type-123",
  "from_date": "2024-01-15",
  "to_date": "2024-01-17",
  "reason": "Vacation"
}
```

### List Leave Applications
```http
GET /leaves/applications?page=1&limit=25&status=Pending
Authorization: Bearer <token>
```

**Status Values:** Applied, Approved, Rejected

### Approve/Reject Leave
```http
POST /leaves/applications/{application_id}/action
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve",
  "rejection_reason": ""
}
```

**Action Values:** approve, reject

### Cancel Leave Application
```http
POST /leaves/applications/{application_id}/cancel
Authorization: Bearer <token>
```

### Seed Leave Types (Development)
```http
POST /leaves/seed-types
Authorization: Bearer <token>
```

---

## Payroll Endpoints

### Set Salary Structure
```http
POST /payroll/salary-structure
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee_id": "123e4567-e89b-12d3-a456-426614174000",
  "basic_salary": 50000,
  "da": 0.15,
  "hra": 0.10,
  "other_allowances": 5000,
  "pf_percentage": 12
}
```

### Get Salary Structure
```http
GET /payroll/salary-structure/{employee_id}
Authorization: Bearer <token>
```

### List Payroll Runs
```http
GET /payroll/runs?page=1&limit=12
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "...",
      "month_year": "2024-01",
      "status": "Processed",
      "total_employees": 42,
      "total_amount": 2100000
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 12,
  "pages": 1
}
```

### Get Payroll Run
```http
GET /payroll/runs/{run_id}
Authorization: Bearer <token>
```

### Get Payroll Details
```http
GET /payroll/runs/{run_id}/details?page=1&limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "...",
      "employee_id": "...",
      "employee_name": "John Doe",
      "working_days": 26,
      "basic_salary": 50000,
      "allowances": 7500,
      "gross_salary": 57500,
      "pf_deduction": 6000,
      "esic_deduction": 250,
      "tds_deduction": 5000,
      "net_salary": 46250
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50,
  "pages": 1
}
```

### Process Payroll
```http
POST /payroll/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "month_year": "2024-01"
}
```

### Download Payslip (PDF)
```http
GET /payroll/payslip/{detail_id}/pdf
Authorization: Bearer <token>
```

**Response:** PDF file

---

## Reports Endpoints

### Employee Directory Report
```http
GET /reports/employees
Authorization: Bearer <token>
```

**Response:** Excel file (.xlsx)

### Leave Balance Report
```http
GET /reports/leave-balance
Authorization: Bearer <token>
```

**Response:** Excel file (.xlsx)

### Attendance Report
```http
GET /reports/attendance?month=1&year=2024
Authorization: Bearer <token>
```

**Response:** Excel file (.xlsx)

### Payroll Report
```http
GET /reports/payroll/{month_year}
Authorization: Bearer <token>
```

**Response:** Excel file (.xlsx)

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "You don't have permission for this action"
}
```

### 404 Not Found
```json
{
  "detail": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Successful but no content |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## Authentication Examples

### Using cURL
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@hrms.local&password=admin123"

# Use token
curl -X GET http://localhost:8000/api/v1/employees \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Using Python/Requests
```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    data={"username": "admin@hrms.local", "password": "admin123"}
)
token = response.json()["access_token"]

# Use token
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/api/v1/employees",
    headers=headers
)
```

### Using JavaScript/Fetch
```javascript
// Login
const loginResponse = await fetch(
  'http://localhost:8000/api/v1/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin@hrms.local&password=admin123'
  }
);
const { access_token } = await loginResponse.json();

// Use token
const response = await fetch(
  'http://localhost:8000/api/v1/employees',
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
```

---

## Rate Limiting

- No rate limiting implemented (development mode)
- To be added in production with Redis

---

## Pagination

All list endpoints support pagination:
- `page` (default: 1)
- `limit` (default: 25, max: 100)
- Response includes: `total`, `page`, `limit`, `pages`

Example:
```
GET /employees?page=2&limit=50
```

---

## Filtering

Supported filters vary by endpoint but generally include:
- `search` - Text search (name, ID, email)
- `status` - Status filter (Active, Inactive, etc)
- `from_date` / `to_date` - Date range filter
- `employee_id` - Employee-specific data
- `month` / `year` - Month/year filter

---

## Sorting

Sorting is done via database queries. Frontend handles sorting via column headers.

---

## File Upload Limits

- Maximum file size: 10MB (configurable in nginx.conf)
- Supported formats for bulk import: Excel (.xlsx, .xls, .csv)

---

For interactive API testing, visit: **http://localhost:8000/docs**
