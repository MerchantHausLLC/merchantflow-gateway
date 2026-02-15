import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── AES-256-GCM helpers ──────────────────────────────────────────────

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get("ENCRYPTION_KEY");
  if (!keyHex || keyHex.length < 32) {
    throw new Error("ENCRYPTION_KEY not configured or too short");
  }
  // Use first 32 bytes (256 bits) of the key string, hashed for consistency
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.digest("SHA-256", encoder.encode(keyHex));
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptValue(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  // Format: hex(iv):hex(ciphertext+tag)  — GCM appends the auth tag
  return `${toHex(iv.buffer)}:${toHex(encrypted)}`;
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, ssn_full, routing_number, account_number } =
      await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // At least one sensitive value must be provided
    if (!ssn_full && !routing_number && !account_number) {
      return new Response(
        JSON.stringify({ error: "No sensitive values provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encKey = await getEncryptionKey();

    const ssnEnc = ssn_full ? await encryptValue(ssn_full, encKey) : null;
    const routingEnc = routing_number
      ? await encryptValue(routing_number, encKey)
      : null;
    const accountEnc = account_number
      ? await encryptValue(account_number, encKey)
      : null;

    // Use service role to write to application_secrets
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("application_secrets").upsert(
      {
        application_id,
        ssn_enc: ssnEnc,
        routing_enc: routingEnc,
        account_enc: accountEnc,
        key_version: 1,
      },
      { onConflict: "application_id" }
    );

    if (error) {
      console.error("Failed to store encrypted secrets:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Encrypt secrets error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
