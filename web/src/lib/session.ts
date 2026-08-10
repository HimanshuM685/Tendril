import type { Session } from "../App";

export function isCustodialSession(session: Session | null | undefined): boolean {
  return session?.authType === "google" || session?.authType === "email";
}
