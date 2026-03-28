import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { DataModel } from "../_generated/dataModel";
import { authComponent } from "../betterAuth/auth";

/**
 * Better Auth user id for the current Convex session, or throws if signed out.
 */
export async function requireUserId(ctx: GenericCtx<DataModel>): Promise<string> {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user._id;
}
