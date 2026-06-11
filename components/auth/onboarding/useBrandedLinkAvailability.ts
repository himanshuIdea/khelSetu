"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { validateBrandedLink } from "@/lib/branded-link";
import type { SlugStatus } from "./BrandedLinkField";

type AvailabilityResponse = {
  available: boolean;
  reason?: string;
  message?: string;
};

export function useBrandedLinkAvailability(subdomain: string) {
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [formatError, setFormatError] = useState<string | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;

    if (!subdomain) {
      setStatus("idle");
      setFormatError(null);
      setAvailabilityMessage(null);
      return;
    }

    const validation = validateBrandedLink(subdomain);
    if (!validation.valid) {
      setStatus("invalid");
      setFormatError(validation.message);
      setAvailabilityMessage(null);
      return;
    }

    setFormatError(null);
    setAvailabilityMessage(null);
    setStatus("checking");

    const timer = window.setTimeout(async () => {
      try {
        const result = (await api.academy.checkSlug(subdomain)) as AvailabilityResponse;
        if (currentRequest !== requestId.current) return;

        if (result.available) {
          setStatus("available");
          setAvailabilityMessage("This link is available.");
          return;
        }

        if (result.reason === "error") {
          setStatus("unavailable");
          setAvailabilityMessage(
            result.message ?? "Could not verify availability. Try again in a moment."
          );
          return;
        }

        setStatus("taken");
        setAvailabilityMessage(
          result.message ?? "This link is already taken — try another."
        );
      } catch {
        if (currentRequest !== requestId.current) return;
        setStatus("unavailable");
        setAvailabilityMessage("Could not verify availability. Try again in a moment.");
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [subdomain]);

  return { status, formatError, availabilityMessage };
}
