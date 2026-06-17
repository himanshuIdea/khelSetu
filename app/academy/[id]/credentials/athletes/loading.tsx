import { PageBody } from "@/components/academy/shared";

export default function CredentialsGridLoading() {
  return (
    <PageBody>
      <div className="h-4 w-40 bg-line rounded animate-pulse mb-4" />
      <div className="h-8 w-40 bg-line rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-72 max-w-full bg-line rounded animate-pulse mb-6" />
      <div className="lg:hidden border border-line rounded-(--radius) overflow-hidden divide-y divide-line2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-line/40" />
        ))}
      </div>
      <div className="hidden lg:block border border-line rounded-(--radius) overflow-hidden animate-pulse">
        <div className="h-10 bg-line/60" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-line2 bg-line/30" />
        ))}
      </div>
    </PageBody>
  );
}
