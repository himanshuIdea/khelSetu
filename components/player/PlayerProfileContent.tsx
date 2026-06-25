import { PortalLogoutButton } from "@/components/auth/PortalLogoutButton";
import { UpIcon } from "@/components/academy/icons";
import { Pill } from "@/components/academy/shared";
import { PlayerBackButton } from "@/components/player/PlayerChrome";
import { PlayerEmptyState } from "@/components/player/PlayerEmptyState";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { playerLayout } from "@/lib/player-layout";
import { playerRoutes } from "@/lib/player-nav";
import type {
  PlayerPortalProfile,
  PlayerPortalRatingPoint,
  PlayerPortalSkillScore,
} from "@/lib/repositories/players";

type PlayerProfileContentProps = {
  profile: PlayerPortalProfile;
  variant?: "self" | "peer";
};

const SKILL_BAR_COLORS: Record<PlayerPortalSkillScore["key"], string> = {
  technique: "#FF6B2C",
  speed: "#2F6BFF",
  form: "#12B886",
};

function formatSubtitle(profile: PlayerPortalProfile): string {
  return [profile.sportName, profile.weightCategory, profile.batchName]
    .filter(Boolean)
    .join(" · ");
}

function formatStatValue(value: number): string {
  return value > 0 ? String(value) : "—";
}

function truncateDrillLabel(name: string, maxLength = 10): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function ratingToChartX(
  rating: number,
  paddingLeft: number,
  chartWidth: number
): number {
  const clamped = Math.max(1, Math.min(10, rating));
  return paddingLeft + ((clamped - 1) / 9) * chartWidth;
}

function reviewRowCenterY(
  reviewIndex: number,
  reviewCount: number,
  paddingTop: number,
  rowHeight: number
): number {
  const plotHeight = reviewCount * rowHeight;
  return paddingTop + plotHeight - (reviewIndex + 0.5) * rowHeight;
}

function RatingTrendChart({ points }: { points: PlayerPortalRatingPoint[] }) {
  if (points.length === 0) return null;

  const width = 320;
  const paddingLeft = 72;
  const paddingRight = 12;
  const paddingTop = 8;
  const paddingBottom = 22;
  const rowHeight = 36;
  const chartWidth = width - paddingLeft - paddingRight;
  const plotHeight = points.length * rowHeight;
  const height = paddingTop + plotHeight + paddingBottom;
  const xAxisTicks = [1, 4, 7, 10];
  const baselineY = paddingTop + plotHeight;

  const coords = points.map((point, index) => ({
    x: ratingToChartX(point.rating, paddingLeft, chartWidth),
    y: reviewRowCenterY(index, points.length, paddingTop, rowHeight),
    point,
    reviewNumber: index + 1,
  }));

  const linePath = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1]!.x} ${baselineY} L${coords[0]!.x} ${baselineY} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="min-w-0"
      role="img"
      aria-label={`Coach rating trend across ${points.length} review${points.length === 1 ? "" : "s"}`}
    >
      {xAxisTicks.map((tick) => {
        const x = ratingToChartX(tick, paddingLeft, chartWidth);
        return (
          <g key={tick}>
            <line x1={x} y1={paddingTop} x2={x} y2={baselineY} stroke="#EDF0F6" strokeWidth="1" />
            <text
              x={x}
              y={height - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#9AA5BC"
              fontFamily="Poppins"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {coords.map((coord) => (
        <line
          key={`row-${coord.point.reviewedAt}`}
          x1={paddingLeft}
          y1={coord.y}
          x2={width - paddingRight}
          y2={coord.y}
          stroke="#F4F6FA"
          strokeWidth="1"
        />
      ))}

      <line
        x1={paddingLeft}
        y1={baselineY}
        x2={width - paddingRight}
        y2={baselineY}
        stroke="#EDF0F6"
        strokeWidth="1"
      />

      <defs>
        <linearGradient id="playerRatingGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF6B2C" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FF6B2C" stopOpacity="0" />
        </linearGradient>
      </defs>

      {points.length > 1 && <path d={areaPath} fill="url(#playerRatingGradient)" />}
      {points.length > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="#FF6B2C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {coords.map((coord) => (
        <g key={coord.point.reviewedAt}>
          <text
            x={paddingLeft - 6}
            y={coord.y + 3.5}
            textAnchor="end"
            fontSize="9"
            fill="#9AA5BC"
            fontFamily="Poppins"
          >
            {truncateDrillLabel(coord.point.drillName)}
          </text>
          <circle cx={coord.x} cy={coord.y} r="5" fill="#FF6B2C" stroke="#fff" strokeWidth="2" />
          <text
            x={coord.x}
            y={coord.y - 10}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#0E1B33"
            fontFamily="Poppins"
          >
            {coord.point.rating}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AspectBreakdown({ scores }: { scores: PlayerPortalSkillScore[] }) {
  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      {scores.map((skill) => (
        <div key={skill.key} className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11.5px] text-muted w-[72px] shrink-0 truncate">{skill.label}</span>
          <div className="flex-1 min-w-0 h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (skill.score / 10) * 100)}%`,
                background: SKILL_BAR_COLORS[skill.key],
              }}
            />
          </div>
          <span className="text-[11.5px] font-semibold text-ink w-7 text-right tabular-nums shrink-0">
            {skill.score.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CoachRatingsCard({
  profile,
  isPeer,
}: {
  profile: PlayerPortalProfile;
  isPeer: boolean;
}) {
  const hasTrend = profile.ratingTrend.length > 0;
  const hasAspects = profile.skillScores.length > 0;
  const latest = hasTrend ? profile.ratingTrend[profile.ratingTrend.length - 1]! : null;
  const previous = hasTrend && profile.ratingTrend.length > 1
    ? profile.ratingTrend[profile.ratingTrend.length - 2]!
    : null;
  const isImproving =
    latest != null && previous != null && latest.rating > previous.rating;

  return (
    <div className={`${playerLayout.card} p-4 min-w-0`}>
      <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
        <div className="text-[13.5px] font-bold text-ink">Coach rating trend</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isImproving ? (
            <Pill variant="green" className="text-[10px]">
              <UpIcon className="w-2.5 h-2.5" />
              Improving
            </Pill>
          ) : null}
          {profile.reviewCount > 0 ? (
            <span className="text-[10px] font-semibold text-[#0E9B72] bg-green-soft px-2 py-0.5 rounded-full">
              {profile.reviewCount} review{profile.reviewCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>

      {hasTrend ? (
        <>
          <div className="text-[11px] text-muted mb-2">
            {profile.ratingTrend.length === 1
              ? "Coach score out of 10"
              : `Review 1 → ${profile.ratingTrend.length} · oldest at bottom`}
          </div>
          <RatingTrendChart points={profile.ratingTrend} />
        </>
      ) : (
        <p className="text-[11px] text-muted mb-3">
          {isPeer
            ? "Overall coach scores will appear here after drill reviews."
            : "Your coach review scores will appear here after drill submissions are rated."}
        </p>
      )}

      {hasAspects ? (
        <div className={`${hasTrend ? "mt-4 pt-4 border-t border-line" : ""} min-w-0`}>
          <div className="text-[13.5px] font-bold text-ink mb-3">Coach aspect breakdown</div>
          <AspectBreakdown scores={profile.skillScores} />
        </div>
      ) : null}
    </div>
  );
}

export function PlayerProfileContent({ profile, variant = "self" }: PlayerProfileContentProps) {
  const isPeer = variant === "peer";
  const stats = [
    { value: formatStatValue(profile.sessionsCount), label: "Sessions" },
    { value: profile.attendance, label: "Attendance" },
    { value: formatStatValue(profile.drillsDone), label: "Drills done" },
    { value: formatStatValue(profile.boutsWon), label: "Bouts won" },
  ];

  const latestReview =
    profile.ratingTrend.length > 0 ? profile.ratingTrend[profile.ratingTrend.length - 1]! : null;

  const overallSubtitle = profile.usesReviewAverage
    ? `Avg. from ${profile.reviewCount} coach review${profile.reviewCount === 1 ? "" : "s"}`
    : profile.rating != null && profile.reviewCount > 0
      ? `${profile.reviewCount} coach review${profile.reviewCount === 1 ? "" : "s"}`
      : null;

  return (
    <PlayerScreen>
      <PlayerPageHeader
        leading={
          isPeer ? (
            <PlayerBackButton href={playerRoutes.explore} label="Back to explore" />
          ) : undefined
        }
        title={isPeer ? profile.fullName : "My Performance"}
      />

      <PlayerScrollBody className="gap-3 sm:gap-4">
        <div
          className={`${playerLayout.cardLg} bg-linear-to-br from-ink to-ink3 p-4 sm:p-[18px] text-white flex flex-col sm:flex-row sm:items-center gap-4 min-w-0`}
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold truncate">{profile.fullName}</div>
              <div className="text-xs text-[#A9B5D1] truncate">
                {formatSubtitle(profile) || "—"}
              </div>
              <div className="text-[11px] text-[#A9B5D1] mt-1 leading-snug">
                {profile.externalId}
                {profile.status ? ` · ${profile.status}` : ""}
                {profile.joinedAt ? ` · Joined ${profile.joinedAt}` : ""}
              </div>
              {profile.coachName && (
                <div className="text-[11px] text-[#A9B5D1] mt-0.5 truncate">
                  Coach: {profile.coachName}
                </div>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 sm:text-right shrink-0 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div className="text-[28px] sm:text-[30px] font-bold leading-none tabular-nums">
              {profile.rating ?? "—"}
            </div>
            <div className="text-[10.5px] text-[#A9B5D1] uppercase tracking-wide">Overall</div>
            {overallSubtitle ? (
              <div className="text-[11px] text-[#A9B5D1] mt-1 leading-snug max-w-[140px] sm:max-w-none sm:text-right">
                {overallSubtitle}
              </div>
            ) : null}
            {latestReview && profile.rating != null ? (
              <div className="text-[11px] text-[#34D399] font-semibold mt-1 tabular-nums">
                Latest {latestReview.rating}/10
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 min-w-0">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`${playerLayout.card} rounded-[13px] py-3 px-2 sm:px-2.5 text-center min-w-0`}
            >
              <div className="text-lg font-bold text-ink truncate tabular-nums">{stat.value}</div>
              <div className="text-[10px] sm:text-[10.5px] text-muted mt-1 leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {profile.ratingTrend.length > 0 || profile.skillScores.length > 0 ? (
          <CoachRatingsCard profile={profile} isPeer={isPeer} />
        ) : (
          <PlayerEmptyState
            variant="inline"
            compact
            title="No coach ratings yet"
            description={
              isPeer
                ? "Coach review scores and skill breakdowns appear here after their coach reviews drill submissions."
                : "Coach review scores and skill breakdowns appear here after your coach reviews your drill submissions."
            }
          />
        )}

        {!isPeer ? (
          <PortalLogoutButton portal="player" variant="profile" className="mt-1" />
        ) : null}
      </PlayerScrollBody>
    </PlayerScreen>
  );
}
