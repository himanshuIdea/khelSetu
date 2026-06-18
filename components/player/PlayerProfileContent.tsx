import { PortalLogoutButton } from "@/components/auth/PortalLogoutButton";
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

function RatingTrendChart({ points }: { points: PlayerPortalRatingPoint[] }) {
  if (points.length === 0) return null;

  const width = 320;
  const height = 116;
  const paddingX = 6;
  const paddingY = 20;
  const chartHeight = height - paddingY - 10;

  const ratings = points.map((point) => point.rating);
  const minRating = Math.min(...ratings, 1);
  const maxRating = Math.max(...ratings, 10);
  const range = Math.max(maxRating - minRating, 1);

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
    const y = paddingY + chartHeight - ((point.rating - minRating) / range) * chartHeight;
    return { x, y, point };
  });

  const linePath = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1]!.x} ${height - 10} L${coords[0]!.x} ${height - 10} Z`;
  const latest = coords[coords.length - 1]!;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="min-w-0">
      <g stroke="#EDF0F6" strokeWidth="1">
        <line x1="0" y1="20" x2={width} y2="20" />
        <line x1="0" y1="58" x2={width} y2="58" />
        <line x1="0" y1="96" x2={width} y2="96" />
      </g>
      <defs>
        <linearGradient id="playerRatingGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF6B2C" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FF6B2C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {points.length > 1 && <path d={areaPath} fill="url(#playerRatingGradient)" />}
      {points.length > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="#FF6B2C"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <circle cx={latest.x} cy={latest.y} r="5" fill="#FF6B2C" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function SkillBreakdown({ scores }: { scores: PlayerPortalSkillScore[] }) {
  return (
    <div className={`${playerLayout.card} p-4 min-w-0`}>
      <div className="text-[13.5px] font-bold text-ink mb-3">Skill breakdown</div>
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

  const latestTrendRating =
    profile.ratingTrend.length > 0 ? profile.ratingTrend[profile.ratingTrend.length - 1]!.rating : null;

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
            {latestTrendRating != null && profile.rating == null && (
              <div className="text-[11px] text-[#34D399] font-semibold mt-1 tabular-nums">
                Latest review {latestTrendRating}/10
              </div>
            )}
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

        {profile.ratingTrend.length > 0 ? (
          <div className={`${playerLayout.card} p-4 min-w-0`}>
            <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
              <div className="text-[13.5px] font-bold text-ink">Coach rating trend</div>
              <span className="text-[10px] font-semibold text-[#0E9B72] bg-green-soft px-2 py-0.5 rounded-full shrink-0">
                {profile.ratingTrend.length} review{profile.ratingTrend.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="text-[11px] text-muted mb-2">Recent coach scores</div>
            <RatingTrendChart points={profile.ratingTrend} />
            <div className="text-[11px] text-muted2 mt-2 truncate">
              Latest · {profile.ratingTrend[profile.ratingTrend.length - 1]!.timeAgo}
            </div>
          </div>
        ) : (
          <PlayerEmptyState
            variant="inline"
            compact
            title="No rating history yet"
            description={
              isPeer
                ? "Coach rating trends will appear here after their coach reviews drill submissions."
                : "Coach rating trends will appear here after your coach reviews your drill submissions."
            }
          />
        )}

        {profile.skillScores.length > 0 ? (
          <SkillBreakdown scores={profile.skillScores} />
        ) : (
          <PlayerEmptyState
            variant="inline"
            compact
            title="No skill scores yet"
            description={
              isPeer
                ? "Skill scores appear after a coach evaluates their drill submissions."
                : "Technique, speed, and form scores appear after your coach evaluates your drills."
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
