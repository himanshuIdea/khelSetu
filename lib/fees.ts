export type FeeBillingStatus = "due" | "paid" | "overdue" | "all";

export type FeeBillingFilters = {
  sportId?: string;
  batchId?: string;
  status?: FeeBillingStatus;
};

export type RecordFeePaymentPayload = {
  invoiceId: string;
  amountPaise: number;
  method: "cash" | "upi" | "bank";
  paidAt?: string;
};

export type GenerateInvoicesPayload = {
  period?: string;
};

export function validateRecordFeePaymentPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<RecordFeePaymentPayload>;
  if (!payload.invoiceId || typeof payload.invoiceId !== "string") {
    return "Invoice is required.";
  }
  if (
    typeof payload.amountPaise !== "number" ||
    !Number.isFinite(payload.amountPaise) ||
    payload.amountPaise <= 0
  ) {
    return "A valid payment amount is required.";
  }
  if (payload.method !== "cash" && payload.method !== "upi" && payload.method !== "bank") {
    return "Payment method must be cash, UPI, or bank transfer.";
  }

  return null;
}
