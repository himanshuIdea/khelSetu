"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddItemModal } from "@/components/academy/AddItemModal";
import { DeleteItemDialog } from "@/components/academy/DeleteItemDialog";
import { EditItemModal } from "@/components/academy/EditItemModal";
import { InlineDatePicker } from "@/components/academy/InlineDatePicker";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { ReturnGearModal } from "@/components/academy/ReturnGearModal";
import {
  BellIcon,
  BoxIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  UpIcon,
} from "@/components/academy/icons";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  ActivityRow,
  EmptyState,
  PageHeader,
  Pill,
  SectionTitle,
  SidePanel,
  SplitLayout,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { api, ApiError } from "@/lib/api";
import { getBatchLabel } from "@/lib/batches";
import type { GearFormOptions, OpenGearIssue } from "@/lib/inventory";
import type { GearMovementFeedItem, InventoryItem } from "@/lib/repositories/types";

type GearWorkspaceProps = {
  academyId: string;
  inventoryStats: { value: string; label: string; color?: string }[];
  inventoryItems: InventoryItem[];
  gearMovements: GearMovementFeedItem[];
  openIssues: OpenGearIssue[];
  formOptions: GearFormOptions;
};

const GEAR_TABLE_COLUMN_CLASSES = [
  "w-[22%] min-w-0",
  "w-[14%] min-w-0",
  "w-[10%] min-w-0",
  "w-[10%] min-w-0",
  "w-[14%] min-w-0",
  "w-[14%] min-w-0",
  "w-[16%] min-w-0",
] as const;

const GEAR_TABLE_CELL =
  "px-2 py-2 xl:px-3.5 xl:py-[13px] text-[12px] xl:text-[13px]";

const GEAR_TABLE_HEADER =
  "text-[9.5px] xl:text-[10.5px] pb-2 xl:pb-[11px]";

const ISSUES_TABLE_COLUMN_CLASSES = [
  "w-[26%] min-w-0",
  "w-[24%] min-w-0",
  "w-[18%] min-w-0",
  "w-[16%] min-w-0",
  "w-[16%] min-w-0",
] as const;

const ISSUES_TABLE_CELL =
  "px-2 py-2 xl:px-3.5 xl:py-[13px] text-[12px] xl:text-[13px]";

const ISSUES_TABLE_HEADER =
  "text-[9.5px] xl:text-[10.5px] pb-2 xl:pb-[11px]";

export function GearWorkspace({
  academyId,
  inventoryStats,
  inventoryItems,
  gearMovements,
  openIssues,
  formOptions,
}: GearWorkspaceProps) {
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [returnIssue, setReturnIssue] = useState<OpenGearIssue | null>(null);

  const [sportId, setSportId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueMessage, setIssueMessage] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);

  const [listItems, setListItems] = useState(inventoryItems);
  const [issues, setIssues] = useState(openIssues);

  useEffect(() => {
    setListItems(inventoryItems);
  }, [inventoryItems]);

  useEffect(() => {
    setIssues(openIssues);
  }, [openIssues]);

  const hasSports = formOptions.sports.length > 0;

  const sportOptions = useMemo(
    () => formOptions.sports.map((sport) => ({ value: sport.id, label: sport.name })),
    [formOptions.sports]
  );

  const batchesForSport = useMemo(
    () => formOptions.batches.filter((batch) => batch.sportId === sportId),
    [formOptions.batches, sportId]
  );

  const batchOptions = useMemo(
    () =>
      batchesForSport.map((batch) => ({
        value: batch.id,
        label: getBatchLabel(batch.name),
      })),
    [batchesForSport]
  );

  const playersForBatch = useMemo(() => {
    if (!sportId || !batchId) return [];
    return formOptions.players.filter(
      (player) => player.sportId === sportId && player.batchId === batchId
    );
  }, [formOptions.players, sportId, batchId]);

  const playerOptions = useMemo(
    () => playersForBatch.map((player) => ({ value: player.id, label: player.name })),
    [playersForBatch]
  );

  const handleSportChange = useCallback((value: string) => {
    setSportId(value);
    setBatchId("");
    setPlayerId("");
    setIssueError(null);
    setIssueMessage(null);
  }, []);

  const handleBatchChange = useCallback((value: string) => {
    setBatchId(value);
    setPlayerId("");
    setIssueError(null);
    setIssueMessage(null);
  }, []);

  const itemOptions = useMemo(
    () =>
      formOptions.items.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.inStock} in stock)`,
      })),
    [formOptions.items]
  );

  const selectedItem = useMemo(
    () => formOptions.items.find((item) => item.id === itemId),
    [formOptions.items, itemId]
  );

  const maxQuantity = selectedItem?.inStock ?? 0;

  useEffect(() => {
    if (maxQuantity > 0 && Number(quantity) > maxQuantity) {
      setQuantity(String(maxQuantity));
    }
  }, [maxQuantity, quantity]);

  const handleIssue = useCallback(async () => {
    if (!playerId || !itemId || issuing) return;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setIssueError("Enter a valid quantity.");
      return;
    }

    setIssueError(null);
    setIssueMessage(null);
    setIssuing(true);

    try {
      await api.inventory.issue(academyId, {
        itemId,
        playerId,
        quantity: qty,
        expectedReturnAt: expectedReturnAt || null,
      });

      setIssueMessage("Gear issued successfully.");
      setSportId("");
      setBatchId("");
      setPlayerId("");
      setItemId("");
      setQuantity("1");
      setExpectedReturnAt("");
      router.refresh();
    } catch (err) {
      setIssueError(err instanceof ApiError ? err.message : "Could not issue gear.");
    } finally {
      setIssuing(false);
    }
  }, [academyId, expectedReturnAt, itemId, issuing, playerId, quantity, router]);

  const canIssue =
    sportId !== "" &&
    batchId !== "" &&
    playerId !== "" &&
    itemId !== "" &&
    maxQuantity > 0 &&
    Number(quantity) >= 1 &&
    Number(quantity) <= maxQuantity;

  return (
    <>
      <SplitLayout className="min-w-0 w-full">
        <div className="flex-1 min-w-0 w-full">
          <PageHeader
            title="Sports Gear & Inventory"
            subtitle="Track every kit, issue and return — know exactly where each item is."
            actionLabel="Add item"
            onActionClick={() => setAddOpen(true)}
          />

          <StatGrid>
            {inventoryStats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
                compact
                valueColor={stat.color}
              />
            ))}
          </StatGrid>

          {listItems.length === 0 ? (
            <EmptyState
              icon={<BoxIcon className="w-5 h-5" />}
              title="No gear in inventory"
              description="Add kits and equipment to track stock, issue items to players and monitor returns."
            />
          ) : (
            <div className="min-w-0 w-full">
              <AcademyTable
                headers={["Item", "Category", "In stock", "Issued", "Condition", "Status", ""]}
                minWidth={640}
                columnWidths={["22%", "14%", "10%", "10%", "14%", "14%", "16%"]}
                columnClassNames={GEAR_TABLE_COLUMN_CLASSES.map(
                  (col) => `${GEAR_TABLE_HEADER} ${col}`
                )}
                className="hidden lg:block min-w-0 w-full"
              >
                {listItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[0]}`}>
                      <div className="font-semibold text-[12px] xl:text-[13px] text-ink truncate">
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[1]} truncate`}>
                      {item.category}
                    </TableCell>
                    <TableCell className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[2]}`}>
                      <b>{item.inStock}</b>
                    </TableCell>
                    <TableCell className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[3]}`}>
                      {item.issued}
                    </TableCell>
                    <TableCell className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[4]}`}>
                      <Pill variant={item.conditionVariant} className="text-[10px] xl:text-[11px] px-2 xl:px-[9px]">
                        {item.condition}
                      </Pill>
                    </TableCell>
                    <TableCell className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[5]}`}>
                      <Pill variant={item.statusVariant} className="text-[10px] xl:text-[11px] px-2 xl:px-[9px]">
                        {item.status}
                      </Pill>
                    </TableCell>
                    <TableCell
                      className={`${GEAR_TABLE_CELL} ${GEAR_TABLE_COLUMN_CLASSES[6]} whitespace-nowrap`}
                    >
                      <div className="flex items-center justify-end gap-0.5 xl:gap-1">
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          aria-label="Edit item"
                          className="w-7 h-7 xl:w-8 xl:h-8 inline-flex items-center justify-center rounded-[8px] text-brand hover:bg-brand-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          disabled={item.issued > 0}
                          aria-label="Delete item"
                          className="w-7 h-7 xl:w-8 xl:h-8 inline-flex items-center justify-center rounded-[8px] text-red hover:bg-red-soft/60 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/30"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </AcademyTable>

              <AcademyCardList className="lg:hidden mt-1">
                {listItems.map((item) => (
                  <AcademyCardListItem key={item.id} className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <div className="font-semibold text-[12px] text-ink truncate">{item.name}</div>
                          <span className="text-[10.5px] text-muted truncate shrink">{item.category}</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5 min-w-0">
                          <span className="text-[10.5px] text-muted shrink-0">
                            <b className="text-ink">{item.inStock}</b> stock · {item.issued} issued
                          </span>
                          <Pill
                            variant={item.conditionVariant}
                            className="text-[9.5px] px-1.5 py-0 max-w-full shrink min-w-0"
                          >
                            <span className="truncate">{item.condition}</span>
                          </Pill>
                          <Pill
                            variant={item.statusVariant}
                            className="text-[9.5px] px-1.5 py-0 max-w-full shrink min-w-0"
                          >
                            <span className="truncate">{item.status}</span>
                          </Pill>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0 -mr-1 -mt-0.5">
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          aria-label="Edit item"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[8px] text-brand hover:bg-brand-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          disabled={item.issued > 0}
                          aria-label="Delete item"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[8px] text-red hover:bg-red-soft/60 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/30"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </AcademyCardListItem>
                ))}
              </AcademyCardList>
            </div>
          )}

          <div className="min-w-0 w-full mt-4">
            <SectionTitle
              title="Open issues"
              subtitle="Gear currently on loan to players."
            />
            {issues.length === 0 ? (
              <EmptyState
                compact
                className="mt-3"
                icon={<BoxIcon className="w-5 h-5" />}
                title="No open issues"
                description="Issued gear awaiting return will appear here."
              />
            ) : (
              <>
                <AcademyCardList className="mt-3 lg:hidden max-h-[320px] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                  {issues.map((issue) => (
                    <AcademyCardListItem key={issue.issueId} className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="font-semibold text-[12px] text-ink truncate">
                              {issue.itemName}
                            </div>
                            <Pill
                              variant={issue.isOverdue ? "amber" : "green"}
                              className="text-[9.5px] px-1.5 py-0 shrink-0"
                            >
                              {issue.isOverdue ? "Overdue" : "Issued"}
                            </Pill>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 min-w-0 text-[10.5px] text-muted">
                            <span className="truncate">{issue.playerName}</span>
                            <span className="shrink-0">·</span>
                            <span className="shrink-0">
                              <b className="text-ink">{issue.outstandingQuantity}</b>/
                              {issue.issuedQuantity} out
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReturnIssue(issue)}
                          aria-label="Mark returned"
                          className="min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-[8px] text-[#0E9B72] hover:bg-green-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-soft"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </AcademyCardListItem>
                  ))}
                </AcademyCardList>

                <div className="hidden lg:block mt-3 min-w-0 w-full max-h-[320px] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-card">
                  <AcademyTable
                    headers={["Item", "Player", "Outstanding", "Status", "Mark returned"]}
                    minWidth={560}
                    columnWidths={["26%", "24%", "18%", "16%", "16%"]}
                    columnClassNames={ISSUES_TABLE_COLUMN_CLASSES.map(
                      (col) => `${ISSUES_TABLE_HEADER} ${col}`
                    )}
                    className="min-w-0 w-full"
                  >
                    {issues.map((issue) => (
                      <TableRow key={issue.issueId}>
                        <TableCell
                          className={`${ISSUES_TABLE_CELL} ${ISSUES_TABLE_COLUMN_CLASSES[0]}`}
                        >
                          <div className="font-semibold text-[12px] xl:text-[13px] text-ink truncate">
                            {issue.itemName}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`${ISSUES_TABLE_CELL} ${ISSUES_TABLE_COLUMN_CLASSES[1]} truncate`}
                        >
                          {issue.playerName}
                        </TableCell>
                        <TableCell className={`${ISSUES_TABLE_CELL} ${ISSUES_TABLE_COLUMN_CLASSES[2]}`}>
                          {issue.outstandingQuantity} of {issue.issuedQuantity}
                        </TableCell>
                        <TableCell className={`${ISSUES_TABLE_CELL} ${ISSUES_TABLE_COLUMN_CLASSES[3]}`}>
                          <Pill
                            variant={issue.isOverdue ? "amber" : "green"}
                            className="text-[10px] xl:text-[11px] px-2 xl:px-[9px]"
                          >
                            {issue.isOverdue ? "Overdue" : "Issued"}
                          </Pill>
                        </TableCell>
                        <TableCell
                          className={`${ISSUES_TABLE_CELL} ${ISSUES_TABLE_COLUMN_CLASSES[4]} whitespace-nowrap`}
                        >
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setReturnIssue(issue)}
                              aria-label="Mark returned"
                              className="w-7 h-7 xl:w-8 xl:h-8 inline-flex items-center justify-center rounded-[8px] text-[#0E9B72] hover:bg-green-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-soft"
                            >
                              <CheckIcon className="w-3 h-3 xl:w-3.5 xl:h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </AcademyTable>
                </div>
              </>
            )}
          </div>
        </div>

        <SidePanel className="flex flex-col gap-3.5 min-w-0">
          <div className="bg-ink border-none rounded-(--radius) shadow-card p-[18px] text-white min-w-0">
            <div className="text-sm font-bold mb-1">Issue gear</div>
            <div className="text-[11.5px] text-[#A9B5D1] mb-3.5">
              Select sport, batch and player — then choose item and quantity.
            </div>

            <div className="space-y-2.5 mb-3.5 min-w-0">
              {!hasSports ? (
                <p className="text-[12.5px] text-[#A9B5D1]">
                  Add sports during academy onboarding to issue gear.
                </p>
              ) : (
                <>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#A9B5D1] mb-1.5">
                      Sport
                    </label>
                    <InlineSelect
                      value={sportId}
                      onChange={handleSportChange}
                      options={sportOptions}
                      placeholder="Select sport"
                      aria-label="Sport"
                      variant="input"
                      tone="dark"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#A9B5D1] mb-1.5">
                      Batch
                    </label>
                    <InlineSelect
                      value={batchId}
                      onChange={handleBatchChange}
                      options={batchOptions}
                      disabled={!sportId || batchOptions.length === 0}
                      placeholder={
                        !sportId
                          ? "Select sport first"
                          : batchOptions.length
                            ? "Select batch"
                            : "No batches"
                      }
                      aria-label="Batch"
                      variant="input"
                      tone="dark"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#A9B5D1] mb-1.5">
                      Player
                    </label>
                    <InlineSelect
                      value={playerId}
                      onChange={(value) => {
                        setPlayerId(value);
                        setIssueError(null);
                        setIssueMessage(null);
                      }}
                      options={playerOptions}
                      disabled={!batchId || playerOptions.length === 0}
                      placeholder={
                        !batchId
                          ? "Select batch first"
                          : playerOptions.length
                            ? "Select player"
                            : "No players in batch"
                      }
                      aria-label="Player"
                      variant="input"
                      tone="dark"
                    />
                  </div>
                </>
              )}

              <div className="border-t border-white/10 pt-3 space-y-2.5">
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#A9B5D1] mb-1.5">
                    Item
                  </label>
                  <InlineSelect
                    value={itemId}
                    onChange={(value) => {
                      setItemId(value);
                      setIssueError(null);
                      setIssueMessage(null);
                    }}
                    options={itemOptions}
                    placeholder={itemOptions.length ? "Select item" : "No stock available"}
                    disabled={itemOptions.length === 0}
                    aria-label="Item"
                    variant="input"
                    tone="dark"
                  />
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor="gear-issue-quantity"
                    className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#A9B5D1] mb-1.5"
                  >
                    Quantity
                  </label>
                  <input
                    id="gear-issue-quantity"
                    type="number"
                    min={1}
                    max={maxQuantity || 1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={!itemId}
                    className="w-full min-h-[44px] rounded-[10px] px-3 py-2 text-[13.5px] bg-white/8 border-none text-white placeholder:text-[#A9B5D1] outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
                  />
                </div>
                <InlineDatePicker
                  label="Expected return"
                  value={expectedReturnAt}
                  onChange={setExpectedReturnAt}
                  layout="stacked"
                  tone="dark"
                />
              </div>
            </div>

            {issueError && (
              <p className="text-[12px] text-red-soft mb-2" role="alert">
                {issueError}
              </p>
            )}
            {issueMessage && (
              <p className="text-[12px] text-green-soft mb-2" role="status">
                {issueMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleIssue()}
              disabled={!hasSports || !canIssue || issuing}
              className="w-full inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
            >
              {issuing ? "Issuing…" : "Issue now"}
            </button>
          </div>

          <div className="bg-card border border-line rounded-(--radius) shadow-card p-[18px] min-w-0">
            <SectionTitle title="Recent movement" />
            {gearMovements.length === 0 ? (
              <EmptyState
                compact
                className="border-none shadow-none bg-surface/60 mt-2"
                icon={<BoxIcon className="w-5 h-5" />}
                title="No recent movement"
                description="Gear issues, returns and stock alerts will appear here."
              />
            ) : (
              gearMovements.map((movement) => {
                const icons = { up: UpIcon, check: CheckIcon, bell: BellIcon };
                const colors = {
                  up: { bg: "var(--brand-soft)", color: "var(--brand-d)" },
                  check: { bg: "var(--green-soft)", color: "#0E9B72" },
                  bell: { bg: "var(--red-soft)", color: "#D63B3B" },
                };
                const Icon = icons[movement.type];
                const color = colors[movement.type];
                return (
                  <ActivityRow
                    key={movement.id}
                    icon={<Icon />}
                    iconBg={color.bg}
                    iconColor={color.color}
                    text={
                      movement.prefix ? (
                        <>
                          {movement.text} <b className="font-semibold text-ink">{movement.bold}</b>
                        </>
                      ) : (
                        <>
                          <b className="font-semibold text-ink">{movement.bold}</b> {movement.text}
                        </>
                      )
                    }
                    time={movement.time}
                  />
                );
              })
            )}
          </div>
        </SidePanel>
      </SplitLayout>

      <AddItemModal
        academyId={academyId}
        sports={formOptions.sports}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <EditItemModal
        academyId={academyId}
        sports={formOptions.sports}
        item={editItem}
        open={editItem !== null}
        onClose={() => setEditItem(null)}
      />
      <DeleteItemDialog
        academyId={academyId}
        item={deleteItem}
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
      />
      <ReturnGearModal
        academyId={academyId}
        issue={returnIssue}
        open={returnIssue !== null}
        onClose={() => setReturnIssue(null)}
      />
    </>
  );
}
