import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  mindCards: defineTable({
    userId: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("voice")),
    title: v.optional(v.string()),
    sourceText: v.optional(v.string()),
    text: v.optional(v.string()),
    imageData: v.optional(v.string()),
    audioData: v.optional(v.string()),
    audioDurationSeconds: v.optional(v.number()),
    autoCategory: v.optional(v.string()),
    autoThemes: v.array(v.string()),
    autoTags: v.array(v.string()),
    autoMood: v.optional(v.string()),
    autoSummary: v.optional(v.string()),
    aiConfidence: v.optional(v.number()),
    autoCategoryState: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    autoCategoryReason: v.optional(v.string()),
    autoCategoryModel: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    autoClassifiedAt: v.optional(v.number()),
  })
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_user_type_and_created", ["userId", "type", "createdAt"])
    .index("by_user_auto_state_and_created", [
      "userId",
      "autoCategoryState",
      "createdAt",
    ]),
});
