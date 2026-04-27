# HRMS Modern - Testing Guide

## Pre-Testing Setup

Before testing, ensure:
1. Docker containers are running: `docker-compose up -d`
2. Database is initialized: `make migrate`
3. Frontend is compiled: `npm run build` (in frontend folder)
4. Backend health check passes: `curl http://localhost:8000/health`

---

## 🧪 Manual Testing Checklist

### Authentication & Access
- [ ] Can access login page at http://localhost:3000/login
- [ ] Can login with admin credentials (admin@hrms.local / admin123)
- [ ] User is redirected to dashboard after login
- [ ] User is redirected to login when accessing protected routes without auth
- [ ] User can logout and is redirected to login

### Dashboard
- [ ] Dashboard loads without errors
- [ ] KPI cards show correct data (employee count, attendance %, etc)
- [ ] Charts render correctly (area chart, pie chart)
- [ ] Page transitions are smooth with animations
- [ ] Dark mode toggle works
- [ ] Responsive design works on mobile (375px), tablet (768px), desktop (1280px+)

### Employee Management
#### Create Employee
- [ ] Click "Add Employee" button opens form dialog
- [ ] Form validation works (required fields, email format, phone format)
- [ ] Can fill all fields in the form
- [ ] Submit button shows loading state
- [ ] Success toast appears after creation
- [ ] New employee appears in table immediately

#### List Employees
- [ ] Employee table loads with data
- [ ] Pagination controls work (next, prev, page size)
- [ ] Sorting works (click column headers)
- [ ] Search/filter works with debounce
- [ ] Row selection checkboxes work
- [ ] Bulk delete works with confirmation

#### Update Employee
- [ ] Can click edit button on employee row
- [ ] Edit form shows employee data
- [ ] Can modify fields
- [ ] Submit updates the record
- [ ] Changes appear in table immediately

#### Delete Employee
- [ ] Confirmation dialog appears when clicking delete
- [ ] Canceling does nothing
- [ ] Confirming deletes the employee
- [ ] Employee is removed from table with fade animation

#### Bulk Import
- [ ] Can drag and drop Excel file
- [ ] Or click to select file
- [ ] Upload progress shows
- [ ] Success/error summary displays
- [ ] New employees appear in table

### Attendance Management
#### View Attendance Calendar
- [ ] Calendar shows current month
- [ ] Day cells are colored based on status (green=present, red=absent, etc)
- [ ] Month navigation arrows work
- [ ] Legend shows status colors
- [ ] Can select date range

#### Mark Attendance
- [ ] Click date opens attendance marking sheet
- [ ] Can select status (Present/Absent/Leave/Half Day)
- [ ] Can add remarks
- [ ] Submit marks attendance
- [ ] Calendar updates with new status
- [ ] Changes persist after refresh

#### View Summary
- [ ] Attendance summary shows present/absent/leave counts
- [ ] Pie chart updates
- [ ] Statistics are accurate

#### Export
- [ ] Can export attendance report to Excel
- [ ] Downloaded file opens correctly in Excel
- [ ] Data matches what's shown in UI

### Payroll Management
#### Salary Structure Setup
- [ ] Can set salary components (basic, HRA, DA, etc)
- [ ] Can calculate estimated net salary
- [ ] Deductions (PF, ESI, TDS) calculate automatically
- [ ] Save successfully

#### Process Payroll
- [ ] Can trigger payroll processing
- [ ] Status shows as "Processing"
- [ ] Status auto-updates to "Processed" when done
- [ ] Processing time is reasonable (<10 sec)

#### View Payslips
- [ ] Can click on employee to view payslip
- [ ] Payslip shows all salary details (earnings, deductions, net)
- [ ] Numbers are correct and properly formatted
- [ ] Can print payslip (Ctrl+P)
- [ ] Can download as PDF
- [ ] Downloaded PDF opens correctly

#### Salary Chart
- [ ] Bar chart shows earnings vs deductions
- [ ] Data is accurate
- [ ] Chart is responsive

### Leave Management
#### Leave Balances
- [ ] See leave balance rings for each type
- [ ] Ring fills based on usage percentage
- [ ] Color changes based on utilization (green > 50%, yellow 25-50%, red < 25%)
- [ ] Numbers show correctly

#### Apply Leave
- [ ] Click "Apply Leave" opens form
- [ ] Can select leave type
- [ ] Can select date range (from/to dates)
- [ ] Working days auto-calculate
- [ ] Can add reason
- [ ] Submit sends application
- [ ] Confirmation toast appears
- [ ] Application status shows as "Pending"

#### View Applications
- [ ] See list of all leave applications
- [ ] Can filter by status (All/Pending/Approved/Rejected)
- [ ] Each row shows employee, dates, days, status

#### Manager Approval (if logged in as manager)
- [ ] See approval queue with pending applications
- [ ] Can approve application
- [ ] Can reject application
- [ ] Rejection requires reason
- [ ] Approved/Rejected status updates
- [ ] Badge count on sidebar updates

### Reports
#### Employee Report
- [ ] Can download employee directory as Excel
- [ ] File contains all employee data
- [ ] Properly formatted with headers

#### Attendance Report
- [ ] Can select month
- [ ] Can download attendance summary as Excel
- [ ] Data is accurate

#### Leave Balance Report
- [ ] Can download leave balances as Excel
- [ ] Shows all employees and their balances

#### Payroll Report
- [ ] Can select month/year
- [ ] Can download payroll summary as Excel
- [ ] Contains accurate salary data

### UI/UX
- [ ] Dark mode toggle works across all pages
- [ ] Colors are consistent with design system
- [ ] Hover states work on buttons and links
- [ ] Loading spinners appear during async operations
- [ ] Error messages are clear and helpful
- [ ] Success messages appear after actions
- [ ] Animations are smooth (no jank)
- [ ] Mobile menu works (if present)
- [ ] Tab navigation works
- [ ] Keyboard navigation works (Tab, Enter, Escape)

### Performance
- [ ] Page loads in < 2 seconds
- [ ] No console errors
- [ ] No memory leaks (check DevTools)
- [ ] Sorting/filtering is instant
- [ ] Charts render smoothly
- [ ] Large lists (100+ rows) handle well

---

## 🔧 Automated Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
pytest tests/ -v --cov=app  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### API Integration Tests
```bash
# Test all endpoints
curl -X GET http://localhost:8000/health
curl -X GET http://localhost:8000/docs  # Swagger UI
```

---

## 🐛 Common Testing Issues & Fixes

### Issue: API returns 401 Unauthorized
**Fix:** Token might be expired. Clear localStorage and login again.
```javascript
localStorage.removeItem('hrms_token');
window.location.href = '/login';
```

### Issue: Database connection fails
**Fix:** Ensure PostgreSQL container is running
```bash
docker-compose logs postgres
docker-compose restart postgres
```

### Issue: File upload fails
**Fix:** Check file size limit in nginx.conf (default 10MB)
```
client_max_body_size 10M;
```

### Issue: Performance is slow
**Fix:** Check if backend is processing
```bash
docker-compose logs backend
# Look for query time or processing bottlenecks
```

### Issue: Dark mode not working
**Fix:** Check if next-themes provider is in root layout
```tsx
// In app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 📊 Test Scenarios

### Scenario 1: New Employee Onboarding
1. Add new employee via form
2. Set salary structure
3. Mark first day attendance
4. Create leave balance
5. View employee in reports

### Scenario 2: Monthly Payroll Processing
1. Verify all salary structures are set
2. Process payroll for the month
3. View payslips
4. Download payroll report
5. Export NEFT file (if implemented)

### Scenario 3: Leave Request & Approval (Multi-user)
1. Employee applies for leave
2. Manager sees in approval queue
3. Manager approves/rejects
4. Employee sees updated status
5. Leave balance reflects usage

### Scenario 4: Attendance Tracking
1. Multiple employees mark attendance daily
2. Weekend/holiday marked automatically
3. Manager bulk approves pending
4. Export monthly report
5. Verify summary statistics

---

## ✅ Test Checklist Before Go-Live

- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] All validations work (email, phone, PAN, IFSC, etc)
- [ ] All API endpoints return correct data
- [ ] All reports export correctly
- [ ] All calculations are accurate (payroll, leave, etc)
- [ ] All animations are smooth
- [ ] Mobile responsiveness works on iPhone/Android
- [ ] Dark mode works across all pages
- [ ] Keyboard navigation works
- [ ] Screen readers can read all content
- [ ] No console errors
- [ ] No broken links
- [ ] Error handling works
- [ ] File uploads work
- [ ] Pagination works
- [ ] Sorting/filtering works
- [ ] Search works
- [ ] Auth flows work
- [ ] Token refresh works
- [ ] Logout works
- [ ] Session timeout works
- [ ] Concurrent user access works
- [ ] Database backups work
- [ ] Restore from backup works

---

## 📈 Performance Targets

- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Time to Interactive:** < 3.5s
- **Lighthouse Score:** > 85 (Performance + Best Practices)
- **Page Size:** < 500KB (gzipped)
- **API Response Time:** < 500ms (p95)
- **Database Query Time:** < 100ms (p95)

---

## 🚀 Test Coverage Goals

- **Backend:** 70% code coverage minimum
- **Frontend:** 50% code coverage minimum (focus on critical paths)
- **API Endpoints:** 100% happy path coverage
- **Business Logic:** 100% coverage for payroll calculations

---

**Note:** These tests should be performed by QA team after development is 90% complete.
