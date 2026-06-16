export type EmploymentType = "full_time" | "part_time";

export type CreateStaffPayload = {
  fullName: string;
  roleTitle: string;
  employmentType: EmploymentType;
  monthlySalaryPaise: number;
  isCoach: boolean;
};

export type UpdateStaffPayload = Partial<CreateStaffPayload>;

export type ApprovePayslipPayload = {
  paymentReference?: string;
};

export type BulkApprovePayslipsPayload = {
  payslipIds: string[];
  paymentReference?: string;
};

export type RunPayrollPayload = {
  period?: string;
};

export function parseSalaryToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "").trim();
  if (!cleaned) return null;
  const rupees = Number(cleaned);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

export function validateCreateStaffPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<CreateStaffPayload>;
  if (!payload.fullName?.trim()) {
    return "Full name is required.";
  }
  if (!payload.roleTitle?.trim()) {
    return "Role title is required.";
  }
  if (payload.employmentType !== "full_time" && payload.employmentType !== "part_time") {
    return "Employment type must be full-time or part-time.";
  }
  if (
    typeof payload.monthlySalaryPaise !== "number" ||
    !Number.isFinite(payload.monthlySalaryPaise) ||
    payload.monthlySalaryPaise < 0
  ) {
    return "A valid monthly salary is required.";
  }
  if (typeof payload.isCoach !== "boolean") {
    return "Coach flag is required.";
  }

  return null;
}

export function validateUpdateStaffPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<CreateStaffPayload>;
  if (payload.fullName !== undefined && !payload.fullName.trim()) {
    return "Full name cannot be empty.";
  }
  if (payload.roleTitle !== undefined && !payload.roleTitle.trim()) {
    return "Role title cannot be empty.";
  }
  if (
    payload.employmentType !== undefined &&
    payload.employmentType !== "full_time" &&
    payload.employmentType !== "part_time"
  ) {
    return "Employment type must be full-time or part-time.";
  }
  if (
    payload.monthlySalaryPaise !== undefined &&
    (typeof payload.monthlySalaryPaise !== "number" ||
      !Number.isFinite(payload.monthlySalaryPaise) ||
      payload.monthlySalaryPaise < 0)
  ) {
    return "A valid monthly salary is required.";
  }

  return null;
}

export function validateApprovePayslipPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as ApprovePayslipPayload;
  if (
    payload.paymentReference !== undefined &&
    typeof payload.paymentReference !== "string"
  ) {
    return "Payment reference must be text.";
  }

  return null;
}

export function validateBulkApprovePayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as BulkApprovePayslipsPayload;
  if (!Array.isArray(payload.payslipIds) || payload.payslipIds.length === 0) {
    return "At least one payslip is required.";
  }

  for (const id of payload.payslipIds) {
    if (typeof id !== "string" || !id) {
      return "Invalid payslip id.";
    }
  }

  return null;
}

export function getMonthPeriod(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function daysExpectedForEmployment(type: EmploymentType): number {
  return type === "part_time" ? 16 : 26;
}
