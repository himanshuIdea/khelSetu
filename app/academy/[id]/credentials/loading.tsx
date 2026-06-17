import { PageBody } from "@/components/academy/shared";

export default function CredentialsLoading() {
  return (
    <PageBody>
      <div className="h-4 w-32 bg-line rounded animate-pulse mb-4" />
      <div className="h-8 w-56 bg-line rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-full max-w-md bg-line rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 bg-line rounded-2xl animate-pulse" />
        ))}
      </div>
    </PageBody>
  );
}
