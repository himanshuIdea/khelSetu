"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/academy/icons";
import {
  portalKindFromCredentialSegment,
  portalLoginAbsoluteUrl,
} from "@/lib/auth/portal-login";
import type { CredentialRoleSegment } from "@/lib/repositories/credentials";

type CopiedField = "all" | "username" | "password" | false;

type CredentialRevealModalProps = {
  open: boolean;
  onClose: () => void;
  fullName: string;
  username: string;
  temporaryPassword: string;
  isReissue?: boolean;
  role: CredentialRoleSegment;
};

export function CredentialRevealModal({
  open,
  onClose,
  fullName,
  username,
  temporaryPassword,
  isReissue = false,
  role,
}: CredentialRevealModalProps) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState<CopiedField>(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setHovered(false);
    }
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyField(text: string, field: "username" | "password") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!open) return null;

  const portal = portalKindFromCredentialSegment(role);
  const signInUrl =
    typeof window !== "undefined"
      ? portalLoginAbsoluteUrl(portal, window.location.origin)
      : portalLoginAbsoluteUrl(portal, "http://localhost:3000");

  async function copyAll() {
    const text = [
      `Sign-in link: ${signInUrl}`,
      `Username: ${username}`,
      `Temporary password: ${temporaryPassword}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("all");
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credential-reveal-title"
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-line rounded-2xl shadow-xl p-6 z-10">
        <h2 id="credential-reveal-title" className="text-lg font-bold text-ink mb-1">
          {isReissue ? "Temporary password reissued" : "Credentials generated"}
        </h2>
        <p className="text-[13px] text-muted mb-5">
          Share these with <b className="text-ink">{fullName}</b> now. This password will not be
          shown again.
        </p>

        <div className="space-y-3 mb-5">
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
              Sign-in link
            </div>
            <div className="text-[13px] font-medium text-brand break-all">{signInUrl}</div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
              Username
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="text-[15px] font-semibold text-ink font-mono min-w-0 break-all">
                {username}
              </div>
              <button
                type="button"
                onClick={() => copyField(username, "username")}
                aria-label="Copy username"
                className="shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-line text-muted hover:text-ink hover:bg-card transition-colors"
              >
                {copied === "username" ? (
                  <CheckIcon className="w-4 h-4 text-brand" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
              Temporary password
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="text-[15px] font-semibold text-ink font-mono tracking-widest min-w-0 break-all">
                {temporaryPassword}
              </div>
              <button
                type="button"
                onClick={() => copyField(temporaryPassword, "password")}
                aria-label="Copy temporary password"
                className="shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-line text-muted hover:text-ink hover:bg-card transition-colors"
              >
                {copied === "password" ? (
                  <CheckIcon className="w-4 h-4 text-brand" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-muted mb-5 leading-relaxed">
          They must sign in and set a new password on first login. After that, you can only reissue
          a new temporary password — you cannot view their chosen password.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            {copied === "all" ? (
              <div
                role="status"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-ink text-white text-[12px] font-medium whitespace-nowrap shadow-lg"
              >
                Copied to clipboard
              </div>
            ) : null}
            <button
              type="button"
              onClick={copyAll}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[10px] bg-brand text-white text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-95"
            >
              {copied === "all" ? (
                <CheckIcon className="w-4 h-4" />
              ) : hovered ? (
                <CopyIcon className="w-4 h-4" />
              ) : (
                <CopyIcon className="w-4 h-4 opacity-80" />
              )}
              Copy credentials
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-[10px] border border-line text-[13px] font-semibold text-ink bg-card"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
