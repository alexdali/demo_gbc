import { cleanupScriptArgsSchema, validateOrThrow } from "@/lib/validation";
import { getReadableError } from "@/lib/errors";
import { getSupabaseAdminClient } from "@/lib/supabase";

function parseArgs() {
  const prefixArg = process.argv.find((arg) => arg.startsWith("--prefix="));
  const prefix = prefixArg ? prefixArg.split("=")[1] : "";

  return validateOrThrow(
    cleanupScriptArgsSchema,
    { prefix },
    "CLI arguments for cleanup-supabase-by-prefix are invalid.",
  );
}

async function main() {
  const { prefix } = parseArgs();
  const supabase = getSupabaseAdminClient();
  const likePattern = `${prefix}-%`;

  const { data: matchingRows, error: selectError } = await supabase
    .from("orders")
    .select("retailcrm_order_id, external_id")
    .like("external_id", likePattern);

  if (selectError) {
    throw new Error(`Failed to read matching Supabase orders: ${selectError.message}`);
  }

  if (!matchingRows || matchingRows.length === 0) {
    console.log(
      JSON.stringify({
        success: true,
        deleted: 0,
        prefix,
      }),
    );
    return;
  }

  const ids = matchingRows.map((row) => row.retailcrm_order_id);
  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .in("retailcrm_order_id", ids);

  if (deleteError) {
    throw new Error(`Failed to delete matching Supabase orders: ${deleteError.message}`);
  }

  console.log(
    JSON.stringify({
      success: true,
      deleted: ids.length,
      prefix,
    }),
  );
}

main().catch((error) => {
  const readable = getReadableError(error, "Supabase cleanup failed.");
  console.error(JSON.stringify({ success: false, error: readable.message, details: readable.details }));
  process.exit(1);
});
