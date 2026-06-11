import {
  ActivityRow,
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import {
  CalendarIcon,
  CashIcon,
  CheckIcon,
  TrophyIcon,
  UpIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/academy/icons";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

const statIcons = [UsersIcon, CashIcon, CalendarIcon, TrophyIcon];

type DashboardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const [dashboardStats, playersBySport, todaySessions, recentActivity] = await Promise.all([
    api.dashboard.stats(academy.id),
    api.dashboard.playersBySport(academy.id),
    api.dashboard.todaySessions(academy.id),
    api.dashboard.activity(academy.id),
  ]);

  const totalPlayers = playersBySport.reduce((sum, s) => sum + s.count, 0);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageBody>
      <PageHeader
        title={`Namaste, ${academy.adminName.split(" ")[0]}`}
        subtitle={`${today} · Here's how your academy is doing today.`}
        actionLabel="Quick add"
      />

      <StatGrid>
        {dashboardStats.map((stat, i) => {
          const Icon = statIcons[i];
          return (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={<Icon className="w-5 h-5" />}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              delta={
                stat.up ? (
                  <span className="text-green flex items-center gap-1">
                    <UpIcon />
                    {stat.delta}
                  </span>
                ) : (
                  <span className="text-muted">{stat.delta}</span>
                )
              }
            />
          );
        })}
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        <div className="bg-card border border-line rounded-(--radius) px-5 py-[18px]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1.5">
            <SectionTitle title="Fee collection trend" />
            <Pill variant="grey">Last 6 months</Pill>
          </div>
          <div className="text-[11.5px] text-muted mb-1.5">
            Monthly fees collected (₹ lakh)
          </div>
          <svg viewBox="0 0 560 196" width="100%" height="196">
            <g stroke="#EDF0F6" strokeWidth="1">
              <line x1="40" y1="20" x2="552" y2="20" />
              <line x1="40" y1="62" x2="552" y2="62" />
              <line x1="40" y1="104" x2="552" y2="104" />
              <line x1="40" y1="146" x2="552" y2="146" />
            </g>
            <g fill="#9AA4B8" fontSize="10" fontFamily="Poppins">
              <text x="14" y="24">5.0</text>
              <text x="14" y="66">3.8</text>
              <text x="14" y="108">2.5</text>
              <text x="14" y="150">1.3</text>
            </g>
            <defs>
              <linearGradient id="feeArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF6B2C" stopOpacity=".24" />
                <stop offset="1" stopColor="#FF6B2C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M64 120 L162 100 L260 86 L358 70 L456 56 L540 40 L540 146 L64 146 Z"
              fill="url(#feeArea)"
            />
            <path
              d="M64 120 L162 100 L260 86 L358 70 L456 56 L540 40"
              fill="none"
              stroke="#FF6B2C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g fill="#FF6B2C">
              <circle cx="64" cy="120" r="4" />
              <circle cx="162" cy="100" r="4" />
              <circle cx="260" cy="86" r="4" />
              <circle cx="358" cy="70" r="4" />
              <circle cx="456" cy="56" r="4" />
              <circle cx="540" cy="40" r="5" stroke="#fff" strokeWidth="2" />
            </g>
            <g fill="#6B7790" fontSize="10.5" fontFamily="Poppins" textAnchor="middle">
              <text x="64" y="186">Jan</text>
              <text x="162" y="186">Feb</text>
              <text x="260" y="186">Mar</text>
              <text x="358" y="186">Apr</text>
              <text x="456" y="186">May</text>
              <text x="540" y="186">Jun</text>
            </g>
          </svg>
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-5 py-[18px]">
          <SectionTitle title="Players by sport" />
          <div className="flex flex-col sm:flex-row items-center gap-[18px] mt-3.5">
            <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
              <g transform="rotate(-90 64 64)" fill="none" strokeWidth="18">
                {playersBySport.map((s, i) => {
                  const circumference = 2 * Math.PI * 50;
                  const dash = (s.count / Math.max(totalPlayers, 1)) * circumference;
                  const offset = playersBySport
                    .slice(0, i)
                    .reduce((sum, p) => sum + (p.count / Math.max(totalPlayers, 1)) * circumference, 0);
                  return (
                    <circle
                      key={s.sport}
                      cx="64"
                      cy="64"
                      r="50"
                      stroke={s.color}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                })}
              </g>
              <text x="64" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0E1B33" fontFamily="Poppins">
                {totalPlayers}
              </text>
              <text x="64" y="78" textAnchor="middle" fontSize="9.5" fill="#6B7790" fontFamily="Poppins">
                players
              </text>
            </svg>
            <div className="flex-1 w-full">
              {playersBySport.map((s, i) => (
                <div key={s.sport} className={`flex items-center gap-[7px] text-[11.5px] text-muted ${i < playersBySport.length - 1 ? "mb-2" : ""}`}>
                  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: s.color }} />
                  {s.sport}
                  <b className="ml-auto text-text">{s.count}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4">
        <div className="bg-card border border-line rounded-(--radius) px-5 py-4">
          <SectionTitle title="Today's sessions" />
          {todaySessions.map((s) => (
            <div key={s.time} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-[11px] border-t border-line2 first:border-t-0">
              <div className="text-xs font-bold text-ink sm:w-[62px]">{s.time}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px]">{s.title}</div>
                <div className="text-[11.5px] text-muted">{s.coach}</div>
              </div>
              <Pill variant={s.pillVariant} className="self-start sm:self-auto">{s.pill}</Pill>
            </div>
          ))}
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-5 py-4">
          <SectionTitle title="Recent activity" />
          {recentActivity.map((a) => {
            const icons = { check: CheckIcon, video: VideoIcon, users: UsersIcon };
            const colors = {
              check: { bg: "var(--green-soft)", color: "#0E9B72" },
              video: { bg: "var(--brand-soft)", color: "var(--brand-d)" },
              users: { bg: "var(--blue-soft)", color: "#2756D8" },
            };
            const Icon = icons[a.type];
            const c = colors[a.type];
            return (
              <ActivityRow
                key={a.time}
                icon={<Icon />}
                iconBg={c.bg}
                iconColor={c.color}
                text={
                  a.prefix ? (
                    <>
                      {a.text} <b className="font-semibold text-ink">{a.bold}</b>
                    </>
                  ) : (
                    <>
                      <b className="font-semibold text-ink">{a.bold}</b> {a.text}
                    </>
                  )
                }
                time={a.time}
              />
            );
          })}
        </div>
      </div>
    </PageBody>
  );
}
