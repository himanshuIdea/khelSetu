"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type MedalTally = {
  gold: number;
  silver: number;
  bronze: number;
};

type TournamentMedalEditorProps = {
  tournamentId: string;
  academyName: string;
  initialMedals: MedalTally;
};

function MedalStepper({
  label,
  value,
  colorClass,
  onChange,
}: {
  label: string;
  value: number;
  colorClass: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div>
        <div className={`text-[22px] font-bold ${colorClass}`}>{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-[8px] border border-line text-lg font-semibold"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="w-14 h-10 text-center border border-line rounded-[8px] text-[13px] font-semibold"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-[8px] border border-line text-lg font-semibold"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function TournamentMedalEditor({
  tournamentId,
  academyName,
  initialMedals,
}: TournamentMedalEditorProps) {
  const router = useRouter();
  const [medals, setMedals] = useState(initialMedals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMedals(initialMedals);
  }, [initialMedals]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.tournaments.updateMedals(tournamentId, medals);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save medals.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-[15px] font-bold text-ink">{academyName}</div>
        <div className="text-[11.5px] text-muted">Host academy medal tally</div>
      </div>

      <div className="border border-line rounded-(--radius) divide-y divide-line2 px-3">
        <MedalStepper
          label="Gold"
          value={medals.gold}
          colorClass="text-amber"
          onChange={(gold) => setMedals((prev) => ({ ...prev, gold }))}
        />
        <MedalStepper
          label="Silver"
          value={medals.silver}
          colorClass="text-muted2"
          onChange={(silver) => setMedals((prev) => ({ ...prev, silver }))}
        />
        <MedalStepper
          label="Bronze"
          value={medals.bronze}
          colorClass="text-[#CD7F32]"
          onChange={(bronze) => setMedals((prev) => ({ ...prev, bronze }))}
        />
      </div>

      {error ? (
        <p className="text-[12px] text-red mt-3" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-[12px] text-brand mt-3">Medals saved.</p> : null}

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="mt-4 w-full min-h-[44px] rounded-[8px] bg-brand text-white text-[13px] font-semibold disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save medals"}
      </button>
    </div>
  );
}
