from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
from io import BytesIO
from decimal import Decimal


def generate_payslip_pdf(employee_data: dict, payroll_data: dict, month_year: str) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    styles = getSampleStyleSheet()
    story = []

    # Header
    header_style = ParagraphStyle("header", fontSize=16, fontName="Helvetica-Bold", alignment=1)
    story.append(Paragraph("HRMS Modern - Payslip", header_style))
    story.append(Spacer(1, 0.1 * inch))

    sub_style = ParagraphStyle("sub", fontSize=11, fontName="Helvetica", alignment=1)
    story.append(Paragraph(f"Month: {month_year}", sub_style))
    story.append(Spacer(1, 0.2 * inch))

    # Employee Info
    emp_data = [
        ["Employee ID", employee_data.get("employee_id", ""), "Name", f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}"],
        ["Designation", employee_data.get("designation", ""), "Department", employee_data.get("department", "")],
        ["PAN", employee_data.get("pan_number", "N/A"), "Working Days", str(payroll_data.get("working_days", 0))],
    ]
    emp_table = Table(emp_data, colWidths=[1.2 * inch, 2 * inch, 1.2 * inch, 2 * inch])
    emp_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.lightgrey),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(emp_table)
    story.append(Spacer(1, 0.2 * inch))

    # Earnings & Deductions side by side
    earn_data = [
        ["EARNINGS", "AMOUNT (₹)"],
        ["Basic Salary", f"{payroll_data.get('basic_salary', 0):,.2f}"],
        ["Allowances", f"{payroll_data.get('allowances', 0):,.2f}"],
        ["Gross Salary", f"{payroll_data.get('gross_salary', 0):,.2f}"],
    ]
    ded_data = [
        ["DEDUCTIONS", "AMOUNT (₹)"],
        ["PF", f"{payroll_data.get('pf_deduction', 0):,.2f}"],
        ["ESIC", f"{payroll_data.get('esic_deduction', 0):,.2f}"],
        ["TDS", f"{payroll_data.get('tds_deduction', 0):,.2f}"],
    ]

    combined = []
    for i in range(max(len(earn_data), len(ded_data))):
        e = earn_data[i] if i < len(earn_data) else ["", ""]
        d = ded_data[i] if i < len(ded_data) else ["", ""]
        combined.append(e + d)

    salary_table = Table(combined, colWidths=[2 * inch, 1.2 * inch, 2 * inch, 1.2 * inch])
    salary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (1, 0), colors.steelblue),
        ("BACKGROUND", (2, 0), (3, 0), colors.indianred),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (1, -1), colors.lightsteelblue),
        ("FONTNAME", (0, -1), (1, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
    ]))
    story.append(salary_table)
    story.append(Spacer(1, 0.2 * inch))

    # Net Salary
    net_style = ParagraphStyle("net", fontSize=13, fontName="Helvetica-Bold")
    net = payroll_data.get("net_salary", 0)
    story.append(Paragraph(f"Net Salary: ₹{float(net):,.2f}", net_style))

    doc.build(story)
    return buffer.getvalue()
