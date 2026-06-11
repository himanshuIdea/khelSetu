import { notFound } from "next/navigation";
import { isValidAcademyId } from "@/lib/academy-id";
import { api, ApiError } from "@/lib/api";
import type { AcademyMeta } from "./types";

export async function resolveAcademy(academyId: string): Promise<AcademyMeta> {
  if (!isValidAcademyId(academyId)) {
    notFound();
  }

  try {
    return await api.academy.getMeta(academyId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
