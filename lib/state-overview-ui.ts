import { getInitials } from "@/lib/format";
import type { VerificationBreakdown } from "@/lib/state-portal";

/** Donut chart stroke segments for verification ring (circumference ≈ 339). */
export function verificationDonutSegments(breakdown: VerificationBreakdown): {
  verifiedDash: string;
  pendingDash: string;
  flaggedDash: string;
  verifiedOffset: number;
  pendingOffset: number;
  flaggedOffset: number;
} {
  const circumference = 339;
  const total = breakdown.verified + breakdown.pending + breakdown.flagged;
  if (total === 0) {
    return {
      verifiedDash: `0 ${circumference}`,
      pendingDash: `0 ${circumference}`,
      flaggedDash: `0 ${circumference}`,
      verifiedOffset: 0,
      pendingOffset: 0,
      flaggedOffset: 0,
    };
  }

  const verifiedLen = (breakdown.verified / total) * circumference;
  const pendingLen = (breakdown.pending / total) * circumference;
  const flaggedLen = (breakdown.flagged / total) * circumference;

  return {
    verifiedDash: `${verifiedLen.toFixed(1)} ${(circumference - verifiedLen).toFixed(1)}`,
    pendingDash: `${pendingLen.toFixed(1)} ${(circumference - pendingLen).toFixed(1)}`,
    flaggedDash: `${flaggedLen.toFixed(1)} ${(circumference - flaggedLen).toFixed(1)}`,
    verifiedOffset: 0,
    pendingOffset: -verifiedLen,
    flaggedOffset: -(verifiedLen + pendingLen),
  };
}

export function talentPipelineInitials(name: string): string {
  return getInitials(name);
}
