export type ItemCondition = "good" | "worn" | "damaged";

export const INVENTORY_CATEGORIES = [
  "Wrestling",
  "Boxing",
  "Athletics",
  "Kabaddi",
  "Common",
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export type GearFormOptions = {
  sports: { id: string; name: string }[];
  batches: { id: string; name: string; sportId: string }[];
  players: { id: string; name: string; sportId: string; batchId: string | null }[];
  items: { id: string; name: string; inStock: number }[];
};

export type CreateInventoryItemPayload = {
  name: string;
  category: string;
  condition: ItemCondition;
  inStock: number;
  lowStockThreshold: number;
};

export type UpdateInventoryItemPayload = CreateInventoryItemPayload;

export type IssueGearPayload = {
  itemId: string;
  playerId: string;
  quantity: number;
  expectedReturnAt?: string | null;
  notes?: string | null;
};

export type ReturnGearPayload = {
  issueMovementId: string;
  quantity: number;
  notes?: string | null;
};

export type OpenGearIssue = {
  issueId: string;
  itemId: string;
  itemName: string;
  playerId: string;
  playerName: string;
  issuedQuantity: number;
  returnedQuantity: number;
  outstandingQuantity: number;
  expectedReturnAt: string | null;
  isOverdue: boolean;
  issuedAt: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidCondition(value: unknown): value is ItemCondition {
  return value === "good" || value === "worn" || value === "damaged";
}

function parsePositiveInt(value: unknown, field: string): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0) {
    return null;
  }
  return n;
}

function parsePositiveIntMin(value: unknown, field: string, min: number): number | null {
  const n = parsePositiveInt(value, field);
  if (n === null || n < min) {
    return null;
  }
  return n;
}

export function validateCreateInventoryItemPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<CreateInventoryItemPayload>;
  if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
    return "Item name is required.";
  }
  if (!payload.category || typeof payload.category !== "string" || !payload.category.trim()) {
    return "Category is required.";
  }
  if (!isValidCondition(payload.condition)) {
    return "Condition must be good, worn, or damaged.";
  }
  if (parsePositiveInt(payload.inStock, "inStock") === null) {
    return "In-stock quantity must be a non-negative whole number.";
  }
  if (parsePositiveInt(payload.lowStockThreshold, "lowStockThreshold") === null) {
    return "Low-stock threshold must be a non-negative whole number.";
  }

  return null;
}

export function validateUpdateInventoryItemPayload(body: unknown): string | null {
  return validateCreateInventoryItemPayload(body);
}

export function validateIssueGearPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<IssueGearPayload>;
  if (!payload.itemId || typeof payload.itemId !== "string") {
    return "Item is required.";
  }
  if (!payload.playerId || typeof payload.playerId !== "string") {
    return "Player is required.";
  }
  if (parsePositiveIntMin(payload.quantity, "quantity", 1) === null) {
    return "Quantity must be at least 1.";
  }
  if (
    payload.expectedReturnAt !== undefined &&
    payload.expectedReturnAt !== null &&
    (typeof payload.expectedReturnAt !== "string" || !ISO_DATE_RE.test(payload.expectedReturnAt))
  ) {
    return "Expected return date must be YYYY-MM-DD.";
  }

  return null;
}

export function validateReturnGearPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<ReturnGearPayload>;
  if (!payload.issueMovementId || typeof payload.issueMovementId !== "string") {
    return "Issue reference is required.";
  }
  if (parsePositiveIntMin(payload.quantity, "quantity", 1) === null) {
    return "Return quantity must be at least 1.";
  }

  return null;
}
