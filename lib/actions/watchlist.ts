"use server";

import { createServerClient } from "@/lib/supabase/server";
import { toggleWatchlist, updateWatchlistNote } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleWatchlistAction(companyId: string): Promise<{ added: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { added: false, error: "ログインが必要です" };
    const result = await toggleWatchlist(user.id, companyId);
    revalidatePath("/watchlist");
    return { added: result.added };
  } catch (e) {
    return { added: false, error: String(e) };
  }
}

export async function updateNoteAction(itemId: string, note: string): Promise<{ error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "ログインが必要です" };
    await updateWatchlistNote(itemId, note);
    revalidatePath("/watchlist");
    return {};
  } catch (e) {
    return { error: String(e) };
  }
}
