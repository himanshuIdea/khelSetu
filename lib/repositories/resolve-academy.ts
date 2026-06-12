import { cache } from "react";
import { notFound } from "next/navigation";
import { getAcademyMeta } from "./academy";
import type { AcademyMeta } from "./types";

export const resolveAcademy = cache(async (academyId: string): Promise<AcademyMeta> => {
  const meta = await getAcademyMeta(academyId);
  if (!meta) {
    notFound();
  }
  return meta;
});
