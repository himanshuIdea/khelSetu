"use client";

import { useState } from "react";
import { UsersIcon } from "@/components/academy/icons";
import { EmptyState, SectionTitle } from "@/components/academy/shared";

type SportSlice = {
  sport: string;
  color: string;
  count: number;
};

type PlayersBySportChartProps = {
  playersBySport: SportSlice[];
  activePlayers: number;
};

type HoverSlice = {
  sport: string;
  count: number;
  percent: number;
};

export function PlayersBySportChart({ playersBySport, activePlayers }: PlayersBySportChartProps) {
  const [hovered, setHovered] = useState<HoverSlice | null>(null);
  const totalPlayersBySport = playersBySport.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="bg-card border border-line rounded-(--radius) px-5 py-[18px]">
      <SectionTitle title="Players by sport" />
      {activePlayers === 0 ? (
        <EmptyState
          compact
          className="border-none shadow-none bg-transparent mt-2"
          icon={<UsersIcon className="w-5 h-5" />}
          title="No players onboarded"
          description="Add athletes to see sport-wise distribution on your dashboard."
        />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-[18px] mt-3.5">
          <div className="relative shrink-0">
            {hovered && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-10 rounded-[8px] border border-line bg-card px-2.5 py-1.5 text-[11px] shadow-card whitespace-nowrap pointer-events-none">
                <div className="font-semibold text-ink">{hovered.sport}</div>
                <div className="text-muted">
                  {hovered.count} players · {hovered.percent}%
                </div>
              </div>
            )}
            <svg width="128" height="128" viewBox="0 0 128 128">
              <g transform="rotate(-90 64 64)" fill="none" strokeWidth="18">
                {playersBySport.map((s, i) => {
                  const circumference = 2 * Math.PI * 50;
                  const dash = (s.count / Math.max(totalPlayersBySport, 1)) * circumference;
                  const offset = playersBySport
                    .slice(0, i)
                    .reduce(
                      (sum, p) => sum + (p.count / Math.max(totalPlayersBySport, 1)) * circumference,
                      0
                    );
                  const percent = Math.round((s.count / Math.max(totalPlayersBySport, 1)) * 100);
                  return (
                    <circle
                      key={s.sport}
                      cx="64"
                      cy="64"
                      r="50"
                      stroke={s.color}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                      className="cursor-pointer transition-opacity"
                      style={{ opacity: hovered && hovered.sport !== s.sport ? 0.45 : 1 }}
                      onMouseEnter={() =>
                        setHovered({ sport: s.sport, count: s.count, percent })
                      }
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })}
              </g>
              <text
                x="64"
                y="60"
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill="#0E1B33"
                fontFamily="Poppins"
              >
                {activePlayers}
              </text>
              <text
                x="64"
                y="78"
                textAnchor="middle"
                fontSize="9.5"
                fill="#6B7790"
                fontFamily="Poppins"
              >
                players
              </text>
            </svg>
          </div>
          <div className="flex-1 w-full">
            {playersBySport.map((s, i) => {
              const percent = Math.round((s.count / Math.max(totalPlayersBySport, 1)) * 100);
              return (
                <div
                  key={s.sport}
                  className={`flex items-center gap-[7px] text-[11.5px] text-muted cursor-default rounded-[6px] px-1 -mx-1 transition-colors ${
                    i < playersBySport.length - 1 ? "mb-2" : ""
                  } ${hovered?.sport === s.sport ? "bg-surface" : ""}`}
                  onMouseEnter={() =>
                    setHovered({ sport: s.sport, count: s.count, percent })
                  }
                  onMouseLeave={() => setHovered(null)}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: s.color }}
                  />
                  {s.sport}
                  <b className="ml-auto text-text">{s.count}</b>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
