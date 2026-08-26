import type { FinancialRecord, RecordCategory, RecordType, Currency, CSVUploadResult } from "@/types";

const CATEGORY_RULES: Array<{ patterns: RegExp[]; category: RecordCategory; type: RecordType }> = [
  { patterns: [/retainer/i, /subscription/i, /monthly fee/i, /recurring/i], category: "revenue_recurring", type: "income" },
  { patterns: [/invoice/i, /service/i, /consulting/i, /project/i], category: "revenue_service", type: "income" },
  { patterns: [/salary/i, /wages/i, /payroll/i, /staff/i], category: "payroll", type: "expense" },
  { patterns: [/contractor/i, /freelance/i, /subcontract/i], category: "cogs_contractors", type: "expense" },
  { patterns: [/rent/i, /office/i, /premises/i, /lease/i], category: "rent_facilities", type: "expense" },
  { patterns: [/software/i, /saas/i, /aws/i, /google cloud/i, /azure/i], category: "software_subscriptions", type: "expense" },
  { patterns: [/ads/i, /advertising/i, /marketing/i, /facebook/i, /linkedin/i], category: "marketing_advertising", type: "expense" },
  { patterns: [/accountant/i, /lawyer/i, /legal/i, /audit/i], category: "professional_services", type: "expense" },
  { patterns: [/electricity/i, /water/i, /internet/i, /utilities/i], category: "utilities", type: "expense" },
  { patterns: [/travel/i, /flight/i, /hotel/i, /taxi/i], category: "travel_entertainment", type: "expense" },
  { patterns: [/materials/i, /supplies/i, /raw/i], category: "cogs_materials", type: "expense" },
];

function inferCategory(description: string, amount: number, explicitType?: string): { category: RecordCategory; type: RecordType } {
  const desc = description.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(desc))) {
      return { category: rule.category, type: rule.type };
    }
  }

  if (explicitType === "income" || (amount > 0 && !explicitType)) {
    return { category: "revenue_service", type: "income" };
  }

  return { category: "other_expense", type: "expense" };
}

function safeDate(str: string): Date | null {
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;

  const [y, m, day] = str.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  if (day < 1 || day > 31) return null;

  const check = new Date(y, m - 1, day);
  if (check.getMonth() !== m - 1) return null;

  return check;
}

function parseDate(raw: string): Date | null {
  const cleaned = raw.trim();
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return safeDate(cleaned);

  const dmy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return safeDate(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`);

  const mdy = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdy) return safeDate(`${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`);

  const nat = new Date(cleaned);
  return Number.isNaN(nat.getTime()) ? null : nat;
}

function parseAmount(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[^0-9.\-]/g, "");
  return Number.parseFloat(cleaned) || 0;
}

export function parseCSV(csvText: string, companyId: string, currency: Currency = "USD"): CSVUploadResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      success: false,
      rowsProcessed: 0,
      rowsImported: 0,
      errors: [{ row: 0, message: "File is empty or has no data rows" }],
      preview: [],
    };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, "_"));
  const dateIdx = header.findIndex((h) => ["date", "transaction_date", "date_of_transaction"].includes(h));
  const descIdx = header.findIndex((h) => ["description", "details", "narrative", "memo", "note"].includes(h));
  const amtIdx = header.findIndex((h) => ["amount", "value", "debit_credit", "sum", "total"].includes(h));
  const catIdx = header.findIndex((h) => ["category", "type", "account", "classification"].includes(h));
  const typeIdx = header.findIndex((h) => ["income_expense", "transaction_type", "credit_debit", "kind"].includes(h));

  if (dateIdx === -1) {
    return { success: false, rowsProcessed: 0, rowsImported: 0, errors: [{ row: 0, message: "Could not find a date column" }], preview: [] };
  }

  if (amtIdx === -1) {
    return { success: false, rowsProcessed: 0, rowsImported: 0, errors: [{ row: 0, message: "Could not find an amount column" }], preview: [] };
  }

  const records: FinancialRecord[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const raw = lines[i];
    if (!raw.trim()) continue;

    const cells = raw.match(/(".*?"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, "").trim()) ?? raw.split(",").map((c) => c.trim());

    const rawDate = cells[dateIdx] ?? "";
    const rawAmt = cells[amtIdx] ?? "0";
    const rawDesc = descIdx !== -1 ? (cells[descIdx] ?? "") : "Imported transaction";
    const rawCat = catIdx !== -1 ? (cells[catIdx] ?? "") : "";
    const rawType = typeIdx !== -1 ? (cells[typeIdx] ?? "") : "";

    const date = parseDate(rawDate);
    if (!date) {
      errors.push({ row: rowNum, message: `Invalid date: "${rawDate}"` });
      continue;
    }

    const amount = parseAmount(rawAmt);
    const absAmount = Math.abs(amount);
    const signType = amount < 0 ? "expense" : rawType.toLowerCase().includes("debit") ? "expense" : undefined;
    const { category, type } = inferCategory(rawDesc || rawCat, amount, signType ?? rawType);

    records.push({
      id: `csv_${companyId}_${date.getTime()}_${i}`,
      company_id: companyId,
      date: date.toISOString().slice(0, 10),
      period_month: date.getMonth() + 1,
      period_year: date.getFullYear(),
      type,
      category,
      description: rawDesc || rawCat || "Imported transaction",
      amount: absAmount,
      currency,
      source: "csv_upload",
      created_at: new Date().toISOString(),
    });
  }

  return { success: true, rowsProcessed: lines.length - 1, rowsImported: records.length, errors, preview: records };
}

export const EXAMPLE_CSV = `date,description,amount,category
2025-05-01,Client retainer - Osei Brands,8000,revenue
2025-05-01,Client retainer - Tech Startup Ltd,5500,revenue
2025-05-05,Staff payroll - April,-18000,payroll
2025-05-08,Office rent - May,-2200,rent
2025-05-10,AWS hosting,-450,software
2025-05-12,Google Ads campaigns,-1200,marketing
2025-05-15,Project invoice - Nova Corp,12000,revenue
2025-05-20,Contractor payment - Designer,-2500,contractor
2025-05-22,LinkedIn Premium,-80,software
2025-05-28,Internet and utilities,-320,utilities`;
