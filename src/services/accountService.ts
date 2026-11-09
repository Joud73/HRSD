/** The signed-in user's own account: session after an invite or recovery link, and setting a password. */
import { supabase } from "@/integrations/supabase/client";
import { authCopy } from "@/lib/copy";
import { ServiceError } from "@/services/errors";

/**
 * Resolves with the user id once the link has produced a session (the client reads the
 * tokens from the URL while it initializes), or null when the link is invalid or expired.
 */
export async function getLinkSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function setPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new ServiceError(authCopy.set_password_failed, error);
}
