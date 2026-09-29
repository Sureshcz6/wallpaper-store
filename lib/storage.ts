import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase Storage is not configured.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SECRET_KEY &&
      process.env.SUPABASE_STORAGE_BUCKET
  );
}

export async function getSignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 900
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error("Supabase Storage is not configured.");
  }

  const supabase = getSupabaseServerClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET!;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storageKey, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Unable to create download URL: ${error?.message ?? "Unknown error"}`
    );
  }

  return data.signedUrl;
}