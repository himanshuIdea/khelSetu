import { integer, pgEnum, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "../_shared";

export const inventorySchema = pgSchema("inventory");

export const itemConditionEnum = pgEnum("item_condition", ["good", "worn", "damaged"]);
export const gearMovementTypeEnum = pgEnum("gear_movement_type", ["issue", "return", "reorder_alert"]);

export const inventoryItems = inventorySchema.table("inventory_items", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  inStock: integer("in_stock").notNull().default(0),
  issuedCount: integer("issued_count").notNull().default(0),
  condition: itemConditionEnum("condition").notNull().default("good"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  iconBg: text("icon_bg"),
  iconColor: text("icon_color"),
  ...timestamps,
});

export const gearMovements = inventorySchema.table("gear_movements", {
  id: primaryId(),
  itemId: uuid("item_id").notNull(),
  playerId: uuid("player_id"),
  quantity: integer("quantity").notNull().default(1),
  type: gearMovementTypeEnum("type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
