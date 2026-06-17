"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  EmptyState,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { UsersIcon } from "@/components/academy/icons";
import { CredentialRevealModal } from "@/components/academy/credentials/CredentialRevealModal";
import { api, ApiError } from "@/lib/api";
import { getInitials } from "@/lib/format";
import type {
  CredentialRoleSegment,
  CredentialRow,
  CredentialStatus,
} from "@/lib/repositories/credentials";

const TABLE_HEADERS = ["Name", "Username", "Password", "Status", ""] as const;

const DESKTOP_TABLE_COLUMN_CLASSES = [
  "w-[28%] min-w-0",
  "w-[18%] min-w-0",
  "w-[14%] min-w-0",
  "w-[18%] min-w-0",
  "w-[22%] min-w-0",
] as const;

function statusPill(status: CredentialStatus) {
  switch (status) {
    case "none":
      return { variant: "grey" as const, label: "No credentials" };
    case "pending_first_login":
      return { variant: "amber" as const, label: "Pending first login" };
    case "active":
      return { variant: "green" as const, label: "Active" };
  }
}

type CredentialsGridProps = {
  academyId: string;
  role: CredentialRoleSegment;
  title: string;
  rows: CredentialRow[];
};

export function CredentialsGrid({ academyId, role, title, rows }: CredentialsGridProps) {
  const [listRows, setListRows] = useState(rows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{
    fullName: string;
    username: string;
    temporaryPassword: string;
    isReissue: boolean;
  } | null>(null);

  useEffect(() => {
    setListRows(rows);
  }, [rows]);

  const refreshRow = useCallback(
    async (personId: string) => {
      const fetchList =
        role === "athletes"
          ? api.credentials.listAthletes
          : role === "coaches"
            ? api.credentials.listCoaches
            : api.credentials.listStaff;
      const updated = await fetchList(academyId);
      setListRows(updated);
      return updated.find((row) => row.personId === personId);
    },
    [academyId, role]
  );

  async function handleProvision(row: CredentialRow) {
    setError(null);
    setBusyId(row.personId);
    try {
      const result = await api.credentials.provision(academyId, role, row.personId);
      await refreshRow(row.personId);
      setReveal({
        fullName: row.fullName,
        username: result.username,
        temporaryPassword: result.temporaryPassword,
        isReissue: false,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate credentials.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReissue(row: CredentialRow) {
    setError(null);
    setBusyId(row.personId);
    try {
      const result = await api.credentials.reissue(academyId, role, row.personId);
      await refreshRow(row.personId);
      setReveal({
        fullName: row.fullName,
        username: result.username,
        temporaryPassword: result.temporaryPassword,
        isReissue: true,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reissue password.");
    } finally {
      setBusyId(null);
    }
  }

  if (listRows.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="w-6 h-6" />}
        title={`No ${title.toLowerCase()} yet`}
        description={`Add ${title.toLowerCase()} to your academy roster before issuing credentials.`}
      />
    );
  }

  return (
    <>
      {error && (
        <p className="text-[13px] font-medium text-red mb-3" role="alert">
          {error}
        </p>
      )}

      <AcademyCardList className="lg:hidden min-w-0 w-full">
        {listRows.map((row) => {
          const pill = statusPill(row.credentialStatus);
          return (
            <AcademyCardListItem key={row.personId}>
              <div className="flex items-start gap-3 min-w-0">
                <Avatar initials={getInitials(row.fullName)} color="#FF6B2C" size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] text-ink truncate">{row.fullName}</div>
                  <div className="text-[11.5px] text-muted truncate">{row.subtitle}</div>
                  <div className="text-[12px] text-muted mt-1 font-mono">
                    {row.username ?? "—"}
                  </div>
                  <div className="text-[12px] text-muted font-mono mt-0.5">
                    {row.hasCredentials ? "••••••••" : "—"}
                  </div>
                  <div className="mt-2">
                    <Pill variant={pill.variant}>{pill.label}</Pill>
                  </div>
                  <div className="mt-3">
                    {row.hasCredentials ? (
                      <button
                        type="button"
                        disabled={busyId === row.personId}
                        onClick={() => handleReissue(row)}
                        className="text-[12px] font-semibold text-brand disabled:opacity-50 min-h-[44px] px-1"
                      >
                        {busyId === row.personId ? "Working…" : "Reissue temp password"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === row.personId}
                        onClick={() => handleProvision(row)}
                        className="text-[12px] font-semibold text-brand disabled:opacity-50 min-h-[44px] px-1"
                      >
                        {busyId === row.personId ? "Working…" : "Generate credentials"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </AcademyCardListItem>
          );
        })}
      </AcademyCardList>

      <div className="hidden lg:block border border-line rounded-(--radius) overflow-hidden min-w-0 w-full">
        <AcademyTable headers={[...TABLE_HEADERS]} columnClassNames={[...DESKTOP_TABLE_COLUMN_CLASSES]}>
          {listRows.map((row) => {
            const pill = statusPill(row.credentialStatus);
            return (
              <TableRow key={row.personId}>
                <TableCell className="min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar initials={getInitials(row.fullName)} color="#FF6B2C" size="sm" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[13.5px] text-ink truncate">{row.fullName}</div>
                      <div className="text-[11.5px] text-muted truncate">{row.subtitle}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[13px] text-ink">
                  {row.username ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-[13px] text-muted tracking-widest">
                  {row.hasCredentials ? "••••••••" : "—"}
                </TableCell>
                <TableCell>
                  <Pill variant={pill.variant}>{pill.label}</Pill>
                </TableCell>
                <TableCell className="text-right">
                  {row.hasCredentials ? (
                    <button
                      type="button"
                      disabled={busyId === row.personId}
                      onClick={() => handleReissue(row)}
                      className="text-[12px] font-semibold text-brand disabled:opacity-50 min-h-[44px] px-2"
                    >
                      {busyId === row.personId ? "Working…" : "Reissue temp password"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === row.personId}
                      onClick={() => handleProvision(row)}
                      className="text-[12px] font-semibold text-brand disabled:opacity-50 min-h-[44px] px-2"
                    >
                      {busyId === row.personId ? "Working…" : "Generate credentials"}
                    </button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </AcademyTable>
      </div>

      {reveal && (
        <CredentialRevealModal
          open
          onClose={() => setReveal(null)}
          fullName={reveal.fullName}
          username={reveal.username}
          temporaryPassword={reveal.temporaryPassword}
          isReissue={reveal.isReissue}
          role={role}
        />
      )}
    </>
  );
}
