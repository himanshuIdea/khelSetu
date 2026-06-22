"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RecordFeePaymentModal } from "@/components/academy/RecordFeePaymentModal";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { BellIcon, CashIcon, CheckIcon, ClockIcon, UsersIcon } from "@/components/academy/icons";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  EmptyState,
  Pill,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import type { PlayerFeeBillingRow } from "@/lib/repositories/types";
import { matchesStateTextSearch } from "@/lib/state-search";

type PlayerFeesSectionProps = {
  academyId: string;
  feeStats: {
    value: string;
    label: string;
    iconBg: string;
    iconColor: string;
    icon: "cash" | "clock" | "alert" | "users";
  }[];
  billingRows: PlayerFeeBillingRow[];
  formOptions: {
    sports: { id: string; name: string }[];
    batches: { id: string; name: string; sportId: string }[];
  };
  searchQuery?: string;
};

const feeIcons = {
  cash: CashIcon,
  clock: ClockIcon,
  alert: BellIcon,
  users: UsersIcon,
};

export function PlayerFeesSection({
  academyId,
  feeStats,
  billingRows: initialRows,
  formOptions,
  searchQuery = "",
}: PlayerFeesSectionProps) {
  const router = useRouter();
  const [sportId, setSportId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentInvoices, setPaymentInvoices] = useState<PlayerFeeBillingRow[] | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const batchOptions = useMemo(() => {
    const filtered = sportId
      ? formOptions.batches.filter((batch) => batch.sportId === sportId)
      : formOptions.batches;
    return [
      { value: "", label: "All batches" },
      ...filtered.map((batch) => ({ value: batch.id, label: batch.name })),
    ];
  }, [formOptions.batches, sportId]);

  const sportOptions = useMemo(
    () => [
      { value: "", label: "All sports" },
      ...formOptions.sports.map((sport) => ({ value: sport.id, label: sport.name })),
    ],
    [formOptions.sports]
  );

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "due", label: "Due" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.fees.billing(academyId, {
        sportId: sportId || undefined,
        batchId: batchId || undefined,
        status: status === "all" ? undefined : status,
      });
      setRows(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load billing.");
    } finally {
      setLoading(false);
    }
  }, [academyId, sportId, batchId, status]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const payableRows = rows.filter(
    (row) => row.status === "due" || row.status === "partial" || row.status === "overdue"
  );

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    return rows.filter((row) =>
      matchesStateTextSearch(searchQuery, [
        row.playerName,
        row.sportBatch,
        row.period,
        row.statusLabel,
        row.amountLabel,
      ])
    );
  }, [rows, searchQuery]);

  const selectedPayable = payableRows.filter((row) => selectedIds.has(row.id));

  function toggleSelect(invoiceId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) next.delete(invoiceId);
      else next.add(invoiceId);
      return next;
    });
  }

  async function handleGenerateInvoices() {
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.fees.generateInvoices(academyId);
      setMessage(`Generated ${result.created} invoice${result.created === 1 ? "" : "s"} for ${result.period}.`);
      await loadBilling();
      router.refresh();
    } catch (genError) {
      setError(genError instanceof Error ? genError.message : "Could not generate invoices.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-end mb-4">
        <button
          type="button"
          onClick={() => void handleGenerateInvoices()}
          disabled={generating}
          className="min-h-[44px] px-4 rounded-[10px] bg-brand text-white text-[13px] font-semibold hover:bg-brand-d disabled:opacity-50 w-full sm:w-auto"
        >
          {generating ? "Generating…" : "Generate invoices"}
        </button>
      </div>

      <StatGrid>
        {feeStats.map((stat) => {
          const Icon = feeIcons[stat.icon];
          return (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={<Icon className="w-5 h-5" />}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              compact
            />
          );
        })}
      </StatGrid>

      <div className="mb-4 rounded-[11px] border border-line2 bg-surface/50 p-3 sm:p-3.5 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted2 mb-1.5">
              Sport
            </label>
            <InlineSelect
              value={sportId}
              onChange={(value) => {
                setSportId(value);
                setBatchId("");
              }}
              options={sportOptions}
              variant="input"
              aria-label="Sport filter"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted2 mb-1.5">
              Batch
            </label>
            <InlineSelect
              value={batchId}
              onChange={setBatchId}
              options={batchOptions}
              variant="input"
              aria-label="Batch filter"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted2 mb-1.5">
              Status
            </label>
            <InlineSelect
              value={status}
              onChange={setStatus}
              options={statusOptions}
              variant="input"
              aria-label="Status filter"
            />
          </div>
        </div>
      </div>

      {selectedPayable.length > 0 && (
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-[10px] border border-brand/20 bg-brand-soft/40">
          <span className="text-[13px] font-semibold text-ink flex-1">
            {selectedPayable.length} selected
          </span>
          <button
            type="button"
            onClick={() => setPaymentInvoices(selectedPayable)}
            className="min-h-[40px] px-3.5 rounded-[9px] bg-brand text-white text-[12.5px] font-semibold w-full sm:w-auto"
          >
            Record payment
          </button>
        </div>
      )}

      {error && <p className="mb-3 text-[12.5px] text-red">{error}</p>}
      {message && <p className="mb-3 text-[12.5px] text-green font-medium">{message}</p>}

      {loading ? (
        <p className="text-[13px] text-muted">Loading billing…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CashIcon className="w-5 h-5" />}
          title="No fee invoices"
          description="Generate monthly invoices for active players or adjust filters."
        />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          compact
          icon={<CashIcon className="w-5 h-5" />}
          title="No invoices match your search"
          description="Try a different search term."
        />
      ) : (
        <>
          <AcademyCardList className="lg:hidden mb-4">
            {filteredRows.map((row) => {
              const canPay =
                row.status === "due" || row.status === "partial" || row.status === "overdue";
              return (
                <AcademyCardListItem key={row.id}>
                  <div className="flex items-start gap-3 min-w-0">
                    {canPay ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="mt-1 w-4 h-4 rounded border-line accent-brand shrink-0"
                        aria-label={`Select ${row.playerName}`}
                      />
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <Avatar initials={row.initials} color={row.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13.5px] text-ink">{row.playerName}</div>
                      <div className="text-[12px] text-muted mt-0.5">{row.sportBatch}</div>
                      <div className="text-[12px] text-muted mt-1">
                        {row.period} · <b>{row.amountLabel}</b>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Pill variant={row.statusVariant}>{row.statusLabel}</Pill>
                        {canPay && (
                          <button
                            type="button"
                            onClick={() => setPaymentInvoices([row])}
                            className="text-[12px] font-semibold text-brand"
                          >
                            Record payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </AcademyCardListItem>
              );
            })}
          </AcademyCardList>

          <AcademyTable
            className="hidden lg:block min-w-0 w-full"
            headers={["", "Player", "Sport · Batch", "Period", "Amount", "Status", "Action"]}
            columnWidths={["4%", "20%", "22%", "12%", "14%", "12%", "16%"]}
            minWidth={820}
          >
            {filteredRows.map((row) => {
              const canPay =
                row.status === "due" || row.status === "partial" || row.status === "overdue";
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {canPay ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="w-4 h-4 rounded border-line accent-brand"
                        aria-label={`Select ${row.playerName}`}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar initials={row.initials} color={row.avatarColor} size="sm" />
                      <span className="font-semibold text-ink truncate">{row.playerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{row.sportBatch}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell>
                    <b>{row.amountLabel}</b>
                  </TableCell>
                  <TableCell>
                    <Pill variant={row.statusVariant}>{row.statusLabel}</Pill>
                  </TableCell>
                  <TableCell>
                    {canPay ? (
                      <button
                        type="button"
                        onClick={() => setPaymentInvoices([row])}
                        className="text-[12px] font-semibold text-brand"
                      >
                        Record payment
                      </button>
                    ) : (
                      <Pill variant="green">
                        <CheckIcon className="w-3 h-3" />
                        Paid
                      </Pill>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </AcademyTable>
        </>
      )}

      <RecordFeePaymentModal
        academyId={academyId}
        invoices={paymentInvoices ?? []}
        open={Boolean(paymentInvoices?.length)}
        onClose={() => setPaymentInvoices(null)}
      />
    </div>
  );
}
