"use client";

import { useRef, useState } from "react";

type OnboardingDocumentFieldProps = {
  label: string;
  hint?: string;
  fileName?: string | null;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
};

export function OnboardingDocumentField({
  label,
  hint,
  fileName,
  disabled = false,
  onUpload,
}: OnboardingDocumentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="text-[12.5px] font-semibold text-text mb-2">{label}</div>
      {hint ? <p className="text-[11.5px] text-muted mb-2">{hint}</p> : null}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[10px] border border-line bg-card text-[13px] font-semibold text-ink disabled:opacity-50"
        >
          {uploading ? "Uploading…" : fileName ? "Replace file" : "Upload file"}
        </button>
        {fileName ? (
          <span className="text-[12px] text-muted truncate">Uploaded: {fileName}</span>
        ) : (
          <span className="text-[12px] text-muted">JPG, PNG, WebP, or PDF · max 10MB</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={handleFileChange}
      />
      {error ? <p className="text-[11.5px] text-red mt-2">{error}</p> : null}
    </div>
  );
}
