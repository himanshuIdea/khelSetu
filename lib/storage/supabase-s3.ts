import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadEnv } from "@/lib/load-env";

loadEnv();

/** Create these buckets in Supabase Storage (both Public). */
export const SUPABASE_COACH_MEDIA_BUCKET = "coach-media";
export const SUPABASE_PLAYER_SUBMISSIONS_BUCKET = "player-submissions";
/** Private bucket — KYC documents for academy onboarding verification. */
export const SUPABASE_ACADEMY_VERIFICATION_BUCKET =
  process.env.SUPABASE_ACADEMY_VERIFICATION_BUCKET?.trim() || "academy-verification";

export type SupabaseS3Config = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  projectRef: string;
};

function extractProjectRefFromDatabaseUrl(databaseUrl: string): string | null {
  const match = databaseUrl.match(/postgres\.([a-z0-9]+)/i);
  return match?.[1] ?? null;
}

function extractRegionFromDatabaseUrl(databaseUrl: string): string | null {
  const match = databaseUrl.match(/aws-\d+-([a-z0-9-]+)\.pooler\.supabase\.com/i);
  return match?.[1] ?? null;
}

export function getSupabaseS3Config(): SupabaseS3Config | null {
  const accessKeyId =
    process.env.ACCESS_KEY_ID?.trim() ||
    process.env.SUPABASE_S3_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim();

  const secretAccessKey =
    process.env.SECRET_ACCESS_KEY?.trim() ||
    process.env.SUPABASE_S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    extractProjectRefFromDatabaseUrl(databaseUrl);

  if (!projectRef) {
    throw new Error(
      "Supabase project ref not found. Set SUPABASE_PROJECT_REF or a Supabase DATABASE_URL."
    );
  }

  const region =
    process.env.SUPABASE_S3_REGION?.trim() ||
    process.env.SUPABASE_REGION?.trim() ||
    extractRegionFromDatabaseUrl(databaseUrl) ||
    "ap-south-1";

  const endpoint =
    process.env.SUPABASE_S3_ENDPOINT?.trim() ||
    `https://${projectRef}.storage.supabase.co/storage/v1/s3`;

  return {
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
    projectRef,
  };
}

let cachedClient: S3Client | null = null;
let cachedConfigKey: string | null = null;

function getS3Client(config: SupabaseS3Config): S3Client {
  const configKey = `${config.endpoint}:${config.region}:${config.accessKeyId}`;
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
  cachedConfigKey = configKey;
  return cachedClient;
}

/** Encode each path segment for Supabase public object URLs. */
export function encodeObjectKeyForPublicUrl(objectKey: string): string {
  return objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getSupabaseStoragePublicUrl(
  config: SupabaseS3Config,
  bucket: string,
  objectKey: string
): string {
  const publicBase =
    process.env.SUPABASE_STORAGE_PUBLIC_URL?.trim() ||
    `https://${config.projectRef}.supabase.co/storage/v1/object/public`;

  const encodedKey = encodeObjectKeyForPublicUrl(objectKey);
  return `${publicBase.replace(/\/$/, "")}/${bucket}/${encodedKey}`;
}

export async function verifyPublicObjectReachable(publicUrl: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
  } catch {
    throw new Error(
      "Upload saved but the public video URL could not be reached. Check that coach-media and player-submissions buckets are Public in Supabase Storage."
    );
  }

  if (response.status === 200 || response.status === 206) {
    return;
  }

  if (response.status === 404) {
    throw new Error(
      "Upload saved but the video URL was not found. Confirm coach-media and player-submissions buckets exist in Supabase."
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Upload saved but the bucket is not public — enable Public bucket in Supabase Storage so coaches and players can preview videos."
    );
  }

  throw new Error(
    `Upload saved but preview is unavailable (HTTP ${response.status}). Check your Supabase Storage bucket settings.`
  );
}

export async function uploadToSupabaseS3(input: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  verifyPublicAccess?: boolean;
}): Promise<{ key: string; url: string; contentType: string }> {
  const config = getSupabaseS3Config();
  if (!config) {
    throw new Error("Supabase S3 credentials are not configured.");
  }

  const client = getS3Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const url = getSupabaseStoragePublicUrl(config, input.bucket, input.key);

  if (input.verifyPublicAccess !== false) {
    await verifyPublicObjectReachable(url);
  }

  return {
    key: input.key,
    url,
    contentType: input.contentType,
  };
}

export async function deleteFromSupabaseS3(bucket: string, objectKey: string): Promise<void> {
  const config = getSupabaseS3Config();
  if (!config) {
    throw new Error("Supabase S3 credentials are not configured.");
  }

  const client = getS3Client(config);

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    })
  );
}

export function isCoachDrillObjectKeyForAcademy(objectKey: string, academyId: string): boolean {
  const prefix = `coach-drills/${academyId}/`;
  return objectKey.startsWith(prefix) && !objectKey.includes("..");
}

export function isPlayerSubmissionObjectKeyForAcademy(objectKey: string, academyId: string): boolean {
  const prefix = `player-submissions/${academyId}/`;
  return objectKey.startsWith(prefix) && !objectKey.includes("..");
}
