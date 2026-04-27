from decimal import Decimal, ROUND_HALF_UP


def calculate_pf(basic: Decimal, pf_percentage: Decimal = Decimal("12")) -> Decimal:
    """Employee PF contribution: pf_percentage% of basic, capped at PF wage ceiling."""
    pf_wage_ceiling = Decimal("15000")
    pf_basic = min(basic, pf_wage_ceiling)
    return (pf_basic * pf_percentage / 100).quantize(Decimal("0.01"), ROUND_HALF_UP)


def calculate_esic(gross: Decimal) -> Decimal:
    """ESIC: 0.75% of gross, only if gross <= 21000/month."""
    esic_ceiling = Decimal("21000")
    if gross > esic_ceiling:
        return Decimal("0")
    return (gross * Decimal("0.75") / 100).quantize(Decimal("0.01"), ROUND_HALF_UP)


def calculate_tds_monthly(annual_gross: Decimal) -> Decimal:
    """Simplified TDS for FY 2024-25 (new tax regime slabs)."""
    std_deduction = Decimal("75000")
    taxable = max(annual_gross - std_deduction, Decimal("0"))

    tax = Decimal("0")
    slabs = [
        (Decimal("300000"), Decimal("0")),
        (Decimal("700000"), Decimal("5")),
        (Decimal("1000000"), Decimal("10")),
        (Decimal("1200000"), Decimal("15")),
        (Decimal("1500000"), Decimal("20")),
    ]

    prev = Decimal("0")
    for ceiling, rate in slabs:
        if taxable <= prev:
            break
        slab_income = min(taxable, ceiling) - prev
        tax += slab_income * rate / 100
        prev = ceiling

    if taxable > Decimal("1500000"):
        tax += (taxable - Decimal("1500000")) * Decimal("30") / 100

    # Add 4% health + education cess
    tax = tax * Decimal("1.04")

    return (tax / 12).quantize(Decimal("0.01"), ROUND_HALF_UP)


def calculate_payroll(basic: Decimal, da: Decimal, hra: Decimal,
                       other: Decimal, working_days: int,
                       days_in_month: int = 30,
                       pf_percentage: Decimal = Decimal("12")) -> dict:
    ratio = Decimal(working_days) / Decimal(days_in_month)

    pro_basic = (basic * ratio).quantize(Decimal("0.01"), ROUND_HALF_UP)
    pro_da = (da * ratio).quantize(Decimal("0.01"), ROUND_HALF_UP)
    pro_hra = (hra * ratio).quantize(Decimal("0.01"), ROUND_HALF_UP)
    pro_other = (other * ratio).quantize(Decimal("0.01"), ROUND_HALF_UP)

    gross = pro_basic + pro_da + pro_hra + pro_other
    annual_gross = gross * 12

    pf = calculate_pf(pro_basic, pf_percentage)
    esic = calculate_esic(gross)
    tds = calculate_tds_monthly(annual_gross)

    total_deductions = pf + esic + tds
    net = (gross - total_deductions).quantize(Decimal("0.01"), ROUND_HALF_UP)

    return {
        "basic_salary": pro_basic,
        "allowances": pro_da + pro_hra + pro_other,
        "gross_salary": gross,
        "pf_deduction": pf,
        "esic_deduction": esic,
        "tds_deduction": tds,
        "net_salary": net,
    }
