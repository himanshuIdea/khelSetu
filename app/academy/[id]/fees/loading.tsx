import { PageBody } from "@/components/academy/shared";

export default function FeesLoading() {
  return (
    <PageBody>
      <div className="animate-pulse space-y-4 min-w-0">
        <div className="h-8 w-56 bg-line rounded-[8px]" />
        <div className="h-4 w-full max-w-md bg-line rounded-[6px]" />
        <div className="h-10 w-full max-w-xs bg-line rounded-[10px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 bg-line rounded-(--radius) border border-line" />
          ))}
        </div>
        <div className="h-64 bg-line rounded-(--radius) border border-line" />
      </div>
    </PageBody>
  );
}
