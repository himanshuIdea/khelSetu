import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { gearMovements, inventoryItems } from "@/db/schema";
import { formatTimeAgo } from "@/lib/format";
import type { InventoryItem } from "./types";

export async function getInventoryStats(academyId: string) {
  const [row] = await db
    .select({
      totalItems: sql<number>`coalesce(sum(${inventoryItems.inStock} + ${inventoryItems.issuedCount}), 0)`,
      issued: sql<number>`coalesce(sum(${inventoryItems.issuedCount}), 0)`,
      lowStock: sql<number>`count(*) filter (where ${inventoryItems.inStock} <= ${inventoryItems.lowStockThreshold})`,
      dueReturn: sql<number>`(
        select count(*) from inventory.gear_movements gm
        inner join inventory.inventory_items ii on ii.id = gm.item_id
        where ii.academy_id = ${academyId}
          and gm.type = 'issue'
          and gm.related_issue_id is null
          and (
            (gm.expected_return_at is not null and gm.expected_return_at < now())
            or (gm.expected_return_at is null and gm.created_at < now() - interval '14 days')
          )
      )`,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.academyId, academyId));

  return [
    { value: String(row?.totalItems ?? 0), label: "Total items" },
    { value: String(row?.issued ?? 0), label: "Currently issued" },
    { value: String(row?.lowStock ?? 0), label: "Low stock", color: "var(--red)" },
    { value: String(row?.dueReturn ?? 0), label: "Due for return", color: "var(--amber)" },
  ];
}

export async function getInventoryItems(academyId: string): Promise<InventoryItem[]> {
  const rows = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.academyId, academyId));

  return rows.map((row) => {
    const isLow = row.inStock <= row.lowStockThreshold;
    return {
      name: row.name,
      category: row.category,
      inStock: row.inStock,
      issued: row.issuedCount,
      condition:
        row.condition === "good" ? "Good" : row.condition === "damaged" ? "Damaged" : "Worn",
      conditionVariant: row.condition === "good" ? "green" : "amber",
      status: isLow ? "Low stock" : "In stock",
      statusVariant: isLow ? "red" : "green",
      iconBg: row.iconBg ?? "var(--brand-soft)",
      iconColor: row.iconColor ?? "var(--brand-d)",
    };
  });
}

export async function getGearMovements(academyId: string) {
  const rows = await db
    .select({
      movement: gearMovements,
      itemName: inventoryItems.name,
    })
    .from(gearMovements)
    .innerJoin(inventoryItems, eq(gearMovements.itemId, inventoryItems.id))
    .where(eq(inventoryItems.academyId, academyId))
    .orderBy(sql`${gearMovements.createdAt} desc`)
    .limit(5);

  return rows.map((row) => {
    const typeMap = {
      issue: "up" as const,
      return: "check" as const,
      reorder_alert: "bell" as const,
    };

    return {
      bold: row.movement.notes?.split(" ")[0] ?? row.itemName,
      text: row.movement.notes?.split(" ").slice(1).join(" ") ?? row.itemName,
      time:
        row.movement.createdAt.toDateString() === new Date().toDateString()
          ? "Today"
          : formatTimeAgo(row.movement.createdAt),
      type: typeMap[row.movement.type],
      prefix: row.movement.type === "reorder_alert",
    };
  });
}
