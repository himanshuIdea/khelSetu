import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { formatTimeAgo } from "@/lib/format";
import type {
  CreateInventoryItemPayload,
  GearFormOptions,
  IssueGearPayload,
  OpenGearIssue,
  ReturnGearPayload,
  UpdateInventoryItemPayload,
} from "@/lib/inventory";
import { gearMovements, inventoryItems, players, academySports, sports } from "@/db/schema";
import { listAcademyBatches } from "@/lib/repositories/batches";
import type { GearMovementFeedItem, InventoryItem } from "./types";

const CATEGORY_PALETTE: Record<string, { iconBg: string; iconColor: string }> = {
  Wrestling: { iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)" },
  Boxing: { iconBg: "var(--purple-soft)", iconColor: "#6443E0" },
  Athletics: { iconBg: "var(--blue-soft)", iconColor: "#2756D8" },
  Kabaddi: { iconBg: "var(--amber-soft)", iconColor: "#C77F12" },
  Common: { iconBg: "#EAF0FF", iconColor: "#2756D8" },
};

const DEFAULT_PALETTE = { iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)" };

function paletteForCategory(category: string) {
  return CATEGORY_PALETTE[category] ?? DEFAULT_PALETTE;
}

function mapInventoryItem(row: typeof inventoryItems.$inferSelect): InventoryItem {
  const isLow = row.inStock <= row.lowStockThreshold;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    inStock: row.inStock,
    issued: row.issuedCount,
    lowStockThreshold: row.lowStockThreshold,
    condition:
      row.condition === "good" ? "Good" : row.condition === "damaged" ? "Damaged" : "Worn",
    conditionValue: row.condition,
    conditionVariant: row.condition === "good" ? "green" : "amber",
    status: isLow ? "Low stock" : "In stock",
    statusVariant: isLow ? "red" : "green",
    iconBg: row.iconBg ?? paletteForCategory(row.category).iconBg,
    iconColor: row.iconColor ?? paletteForCategory(row.category).iconColor,
  };
}


function formatMovementTime(createdAt: Date): string {
  return createdAt.toDateString() === new Date().toDateString()
    ? "Today"
    : formatTimeAgo(createdAt);
}

function formatIssueNotes(quantity: number, itemName: string, playerName: string) {
  const qtyLabel = quantity > 1 ? `${quantity}× ${itemName}` : itemName;
  return {
    notes: `${qtyLabel} issued to ${playerName}`,
    bold: qtyLabel,
    text: `issued to ${playerName}`,
    prefix: false,
  };
}

function formatReturnNotes(quantity: number, itemName: string, playerName: string) {
  const qtyLabel = quantity > 1 ? `${quantity}× ${itemName}` : itemName;
  return {
    notes: `${qtyLabel} returned by ${playerName}`,
    bold: qtyLabel,
    text: `returned by ${playerName}`,
    prefix: false,
  };
}

async function maybeInsertReorderAlert(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  itemId: string,
  itemName: string
) {
  const [item] = await tx
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, itemId))
    .limit(1);

  if (!item || item.inStock > item.lowStockThreshold) {
    return;
  }

  const [recentAlert] = await tx
    .select({ id: gearMovements.id })
    .from(gearMovements)
    .where(
      and(
        eq(gearMovements.itemId, itemId),
        eq(gearMovements.type, "reorder_alert"),
        gte(gearMovements.createdAt, sql`now() - interval '24 hours'`)
      )
    )
    .limit(1);

  if (recentAlert) {
    return;
  }

  await tx.insert(gearMovements).values({
    itemId,
    quantity: 1,
    type: "reorder_alert",
    notes: `Reorder alert: ${itemName}`,
  });
}

export async function getInventoryStats(academyId: string) {
  const [row] = await db
    .select({
      totalItems: sql<number>`coalesce(sum(${inventoryItems.inStock} + ${inventoryItems.issuedCount}), 0)`,
      issued: sql<number>`coalesce(sum(${inventoryItems.issuedCount}), 0)`,
      lowStock: sql<number>`count(*) filter (where ${inventoryItems.inStock} <= ${inventoryItems.lowStockThreshold})`,
      dueReturn: sql<number>`(
        select count(*) from inventory.gear_movements issue_gm
        inner join inventory.inventory_items ii on ii.id = issue_gm.item_id
        where ii.academy_id = ${academyId}
          and issue_gm.type = 'issue'
          and (
            issue_gm.quantity - coalesce((
              select sum(ret.quantity)
              from inventory.gear_movements ret
              where ret.type = 'return' and ret.related_issue_id = issue_gm.id
            ), 0)
          ) > 0
          and (
            (issue_gm.expected_return_at is not null and issue_gm.expected_return_at < now())
            or (issue_gm.expected_return_at is null and issue_gm.created_at < now() - interval '14 days')
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
    .where(eq(inventoryItems.academyId, academyId))
    .orderBy(inventoryItems.name);

  return rows.map(mapInventoryItem);
}

export async function getGearFormOptions(academyId: string): Promise<GearFormOptions> {
  const [sportRows, batchRows, playerRows, itemRows] = await Promise.all([
    db
      .select({ id: sports.id, name: sports.name })
      .from(academySports)
      .innerJoin(sports, eq(academySports.sportId, sports.id))
      .where(eq(academySports.academyId, academyId)),
    listAcademyBatches(academyId),
    db
      .select({
        id: players.id,
        name: players.fullName,
        sportId: players.sportId,
        batchId: players.batchId,
      })
      .from(players)
      .where(and(eq(players.academyId, academyId), ne(players.status, "inactive")))
      .orderBy(players.fullName),
    db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        inStock: inventoryItems.inStock,
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.academyId, academyId))
      .orderBy(inventoryItems.name),
  ]);

  return {
    sports: sportRows,
    batches: batchRows,
    players: playerRows,
    items: itemRows.filter((item) => item.inStock > 0),
  };
}

export async function createInventoryItem(
  academyId: string,
  payload: CreateInventoryItemPayload
): Promise<InventoryItem> {
  const palette = paletteForCategory(payload.category);

  const [row] = await db
    .insert(inventoryItems)
    .values({
      academyId,
      name: payload.name.trim(),
      category: payload.category.trim(),
      inStock: payload.inStock,
      issuedCount: 0,
      condition: payload.condition,
      lowStockThreshold: payload.lowStockThreshold,
      iconBg: palette.iconBg,
      iconColor: palette.iconColor,
    })
    .returning();

  if (!row) {
    throw new Error("Could not create inventory item.");
  }

  if (row.inStock <= row.lowStockThreshold) {
    await db.insert(gearMovements).values({
      itemId: row.id,
      quantity: 1,
      type: "reorder_alert",
      notes: `Reorder alert: ${row.name}`,
    });
  }

  return mapInventoryItem(row);
}

export async function updateInventoryItem(
  academyId: string,
  itemId: string,
  payload: UpdateInventoryItemPayload
): Promise<InventoryItem> {
  const [existing] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.academyId, academyId)))
    .limit(1);

  if (!existing) {
    throw new Error("Inventory item not found.");
  }

  const palette = paletteForCategory(payload.category);

  const [row] = await db
    .update(inventoryItems)
    .set({
      name: payload.name.trim(),
      category: payload.category.trim(),
      inStock: payload.inStock,
      condition: payload.condition,
      lowStockThreshold: payload.lowStockThreshold,
      iconBg: palette.iconBg,
      iconColor: palette.iconColor,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, itemId))
    .returning();

  if (!row) {
    throw new Error("Could not update inventory item.");
  }

  await maybeInsertReorderAlertDb(itemId, row.name);

  return mapInventoryItem(row);
}

async function maybeInsertReorderAlertDb(itemId: string, itemName: string) {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, itemId))
    .limit(1);

  if (!item || item.inStock > item.lowStockThreshold) {
    return;
  }

  const [recentAlert] = await db
    .select({ id: gearMovements.id })
    .from(gearMovements)
    .where(
      and(
        eq(gearMovements.itemId, itemId),
        eq(gearMovements.type, "reorder_alert"),
        gte(gearMovements.createdAt, sql`now() - interval '24 hours'`)
      )
    )
    .limit(1);

  if (recentAlert) {
    return;
  }

  await db.insert(gearMovements).values({
    itemId,
    quantity: 1,
    type: "reorder_alert",
    notes: `Reorder alert: ${itemName}`,
  });
}

export async function deleteInventoryItem(academyId: string, itemId: string): Promise<void> {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.academyId, academyId)))
    .limit(1);

  if (!item) {
    throw new Error("Inventory item not found.");
  }

  if (item.issuedCount > 0) {
    throw new Error("Cannot delete an item while gear is still issued.");
  }

  const openIssues = await listOpenGearIssues(academyId);
  if (openIssues.some((issue) => issue.itemId === itemId)) {
    throw new Error("Cannot delete an item with open gear issues.");
  }

  await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));
}

export async function listOpenGearIssues(academyId: string): Promise<OpenGearIssue[]> {
  const rows = await db
    .select({
      issueId: gearMovements.id,
      itemId: inventoryItems.id,
      itemName: inventoryItems.name,
      playerId: players.id,
      playerName: players.fullName,
      issuedQuantity: gearMovements.quantity,
      returnedQuantity: sql<number>`coalesce((
        select sum(ret.quantity)
        from inventory.gear_movements ret
        where ret.type = 'return' and ret.related_issue_id = ${gearMovements.id}
      ), 0)`,
      expectedReturnAt: gearMovements.expectedReturnAt,
      issuedAt: gearMovements.createdAt,
    })
    .from(gearMovements)
    .innerJoin(inventoryItems, eq(gearMovements.itemId, inventoryItems.id))
    .innerJoin(players, eq(gearMovements.playerId, players.id))
    .where(and(eq(inventoryItems.academyId, academyId), eq(gearMovements.type, "issue")))
    .orderBy(sql`${gearMovements.createdAt} desc`);

  return rows
    .map((row) => {
      const returnedQuantity = Number(row.returnedQuantity) || 0;
      const outstandingQuantity = row.issuedQuantity - returnedQuantity;
      const expectedReturnAt = row.expectedReturnAt
        ? row.expectedReturnAt.toISOString().slice(0, 10)
        : null;
      const isOverdue =
        row.expectedReturnAt !== null
          ? row.expectedReturnAt < new Date()
          : row.issuedAt < new Date(Date.now() - 14 * 24 * 3600000);

      return {
        issueId: row.issueId,
        itemId: row.itemId,
        itemName: row.itemName,
        playerId: row.playerId,
        playerName: row.playerName,
        issuedQuantity: row.issuedQuantity,
        returnedQuantity,
        outstandingQuantity,
        expectedReturnAt,
        isOverdue,
        issuedAt: row.issuedAt.toISOString(),
      };
    })
    .filter((row) => row.outstandingQuantity > 0);
}

export async function issueGear(
  academyId: string,
  payload: IssueGearPayload
): Promise<OpenGearIssue> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, payload.itemId), eq(inventoryItems.academyId, academyId)))
      .limit(1);

    if (!item) {
      throw new Error("Inventory item not found.");
    }

    if (payload.quantity > item.inStock) {
      throw new Error(`Only ${item.inStock} unit(s) available in stock.`);
    }

    const [player] = await tx
      .select({ id: players.id, fullName: players.fullName })
      .from(players)
      .where(
        and(
          eq(players.id, payload.playerId),
          eq(players.academyId, academyId),
          ne(players.status, "inactive")
        )
      )
      .limit(1);

    if (!player) {
      throw new Error("Player not found.");
    }

    const issueCopy = formatIssueNotes(payload.quantity, item.name, player.fullName);
    const expectedReturnAt = payload.expectedReturnAt
      ? new Date(`${payload.expectedReturnAt}T23:59:59`)
      : null;

    const [movement] = await tx
      .insert(gearMovements)
      .values({
        itemId: item.id,
        playerId: player.id,
        quantity: payload.quantity,
        type: "issue",
        notes: payload.notes?.trim() || issueCopy.notes,
        expectedReturnAt,
      })
      .returning();

    await tx
      .update(inventoryItems)
      .set({
        inStock: item.inStock - payload.quantity,
        issuedCount: item.issuedCount + payload.quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, item.id));

    await maybeInsertReorderAlert(tx, item.id, item.name);

    return {
      issueId: movement.id,
      itemId: item.id,
      itemName: item.name,
      playerId: player.id,
      playerName: player.fullName,
      issuedQuantity: payload.quantity,
      returnedQuantity: 0,
      outstandingQuantity: payload.quantity,
      expectedReturnAt: payload.expectedReturnAt ?? null,
      isOverdue: false,
      issuedAt: movement.createdAt.toISOString(),
    };
  });
}

export async function returnGear(
  academyId: string,
  payload: ReturnGearPayload
): Promise<{ outstandingQuantity: number }> {
  return db.transaction(async (tx) => {
    const [issue] = await tx
      .select({
        movement: gearMovements,
        item: inventoryItems,
        playerName: players.fullName,
      })
      .from(gearMovements)
      .innerJoin(inventoryItems, eq(gearMovements.itemId, inventoryItems.id))
      .innerJoin(players, eq(gearMovements.playerId, players.id))
      .where(
        and(
          eq(gearMovements.id, payload.issueMovementId),
          eq(gearMovements.type, "issue"),
          eq(inventoryItems.academyId, academyId)
        )
      )
      .limit(1);

    if (!issue) {
      throw new Error("Gear issue not found.");
    }

    const [returnedRow] = await tx
      .select({
        returned: sql<number>`coalesce(sum(${gearMovements.quantity}), 0)`,
      })
      .from(gearMovements)
      .where(
        and(
          eq(gearMovements.type, "return"),
          eq(gearMovements.relatedIssueId, issue.movement.id)
        )
      );

    const returnedSoFar = Number(returnedRow?.returned) || 0;
    const outstanding = issue.movement.quantity - returnedSoFar;

    if (payload.quantity > outstanding) {
      throw new Error(`Only ${outstanding} unit(s) remain outstanding for this issue.`);
    }

    const returnCopy = formatReturnNotes(
      payload.quantity,
      issue.item.name,
      issue.playerName
    );

    await tx.insert(gearMovements).values({
      itemId: issue.item.id,
      playerId: issue.movement.playerId,
      quantity: payload.quantity,
      type: "return",
      relatedIssueId: issue.movement.id,
      notes: payload.notes?.trim() || returnCopy.notes,
    });

    await tx
      .update(inventoryItems)
      .set({
        inStock: issue.item.inStock + payload.quantity,
        issuedCount: issue.item.issuedCount - payload.quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, issue.item.id));

    return { outstandingQuantity: outstanding - payload.quantity };
  });
}

export async function getGearMovements(academyId: string): Promise<GearMovementFeedItem[]> {
  const rows = await db
    .select({
      movement: gearMovements,
      itemName: inventoryItems.name,
      playerName: players.fullName,
    })
    .from(gearMovements)
    .innerJoin(inventoryItems, eq(gearMovements.itemId, inventoryItems.id))
    .leftJoin(players, eq(gearMovements.playerId, players.id))
    .where(eq(inventoryItems.academyId, academyId))
    .orderBy(sql`${gearMovements.createdAt} desc`)
    .limit(8);

  return rows.map((row) => {
    const typeMap = {
      issue: "up" as const,
      return: "check" as const,
      reorder_alert: "bell" as const,
    };

    if (row.movement.type === "reorder_alert") {
      return {
        id: row.movement.id,
        bold: row.itemName,
        text: "reorder alert",
        time: formatMovementTime(row.movement.createdAt),
        type: typeMap.reorder_alert,
        prefix: true,
      };
    }

    if (row.movement.type === "issue" && row.playerName) {
      const copy = formatIssueNotes(row.movement.quantity, row.itemName, row.playerName);
      return {
        id: row.movement.id,
        bold: copy.bold,
        text: copy.text,
        time: formatMovementTime(row.movement.createdAt),
        type: typeMap.issue,
      };
    }

    if (row.movement.type === "return" && row.playerName) {
      const copy = formatReturnNotes(row.movement.quantity, row.itemName, row.playerName);
      return {
        id: row.movement.id,
        bold: copy.bold,
        text: copy.text,
        time: formatMovementTime(row.movement.createdAt),
        type: typeMap.return,
      };
    }

    return {
      id: row.movement.id,
      bold: row.itemName,
      text: row.movement.notes ?? "",
      time: formatMovementTime(row.movement.createdAt),
      type: typeMap[row.movement.type],
    };
  });
}

export async function getInventoryItemById(
  academyId: string,
  itemId: string
): Promise<InventoryItem | null> {
  const [row] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.academyId, academyId)))
    .limit(1);

  return row ? mapInventoryItem(row) : null;
}
