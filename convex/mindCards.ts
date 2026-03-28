import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./betterAuth/auth";
import { requireUserId } from "./lib/requireUser";

const mindCardType = v.union(
  v.literal("text"),
  v.literal("image"),
  v.literal("voice"),
);
const classificationState = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("failed"),
);

const titleMaxLen = 120;
const summaryMaxLen = 500;
const maxTagCount = 8;
const maxTagLen = 32;

/** OpenRouter free-models router (no paid models). */
const OPENROUTER_FREE_MODEL = "openrouter/free";

type CardContentForClassify = {
  cardId: string;
  title: string;
  baseText: string;
  type: "text" | "image" | "voice";
  imageData?: string;
  audioData?: string;
  audioDurationSeconds?: number;
};

/** Chat message user content parts we send for classification. */
type UserContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function normalizeText(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function compactText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function normalizeTags(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter(Boolean)
    .filter((tag, index, self) => self.indexOf(tag) === index)
    .map((tag) => compactText(tag, maxTagLen))
    .slice(0, maxTagCount);
}

function clampConfidence(value: unknown): number | undefined {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value)) return undefined;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function parseDataUrl(value: string): { mimeType: string; data: string } | null {
  const match = value.match(/^data:([^;,]+);base64,(.*)$/);
  if (!match || !match[2]) return null;
  return { mimeType: match[1], data: match[2] };
}

function decodeBase64(dataUrl: string): Uint8Array | null {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  try {
    const binary = atob(parsed.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function extractCardContent(
  card:
    | {
        _id: string;
        title?: string;
        sourceText?: string;
        text?: string;
        type: "text" | "image" | "voice";
        imageData?: string;
        audioData?: string;
        audioDurationSeconds?: number;
      }
    | null,
): CardContentForClassify | null {
  if (!card) return null;
  const text = compactText(
    [card.sourceText, card.text].filter(Boolean).join("\n\n"),
    5000,
  );

  return {
    cardId: card._id,
    title: normalizeText(card.title) ?? "Untitled card",
    baseText: text,
    type: card.type,
    imageData: normalizeText(card.imageData),
    audioData: normalizeText(card.audioData),
    audioDurationSeconds: card.audioDurationSeconds,
  };
}

function toPrompt(card: CardContentForClassify): {
  systemPrompt: string;
  userContent: UserContentPart[];
} {
  const systemPrompt = `You are an AI assistant for a note app.
Your job is to automatically structure unstructured content from thoughts, journals, and memory captures.
Return STRICT JSON with this shape:
{
  "title": "short human-readable title",
  "summary": "1-2 sentence summary",
  "category": "single high-level category",
  "mood": "overall tone",
  "themes": ["theme1", "theme2", "theme3"],
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0
}
Confidence is from 0.0 to 1.0. Output only JSON.`;

  const userParts: UserContentPart[] = [
    {
      type: "text",
      text:
        `Title: ${card.title}\n` +
        `Type: ${card.type}\n` +
        `Text:\n${card.baseText || "No textual content."}`,
    },
  ];

  if (card.type === "image" && card.imageData) {
    userParts.push({
      type: "image_url",
      image_url: {
        url: card.imageData,
      },
    });
  }

  if (card.type === "voice" && card.audioDurationSeconds) {
    userParts.push({
      type: "text",
      text: `Voice memo duration: ${card.audioDurationSeconds} seconds. The transcript is in the Text section above when present.`,
    });
  }

  return {
    systemPrompt,
    userContent: userParts,
  };
}

async function classifyWithOpenRouter(
  input: CardContentForClassify,
  options: { apiKey: string; model?: string },
): Promise<{
  title: string;
  summary: string;
  category: string;
  mood: string;
  themes: string[];
  tags: string[];
  confidence: number;
}> {
  const { systemPrompt, userContent } = toPrompt(input);
  const userParts = [...userContent];
  const hasImage = userParts.some((part) => part.type === "image_url");

  /** Gemma (and some free-router backends) reject system/developer role with vision; fold instructions into user text. */
  const messages = hasImage
    ? (() => {
        const first = userParts[0];
        if (first?.type !== "text") {
          throw new Error("Classification payload must start with a text part.");
        }
        return [
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: `${systemPrompt}\n\n---\n\n${first.text}`,
              },
              ...userParts.slice(1),
            ],
          },
        ];
      })()
    : [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        {
          role: "user" as const,
          content: userParts,
        },
      ];

  const payload = {
    model: options.model ?? OPENROUTER_FREE_MODEL,
    /** Gemma on Google AI Studio rejects `response_format` for vision; text-only path keeps strict JSON mode. */
    ...(hasImage
      ? {}
      : { response_format: { type: "json_object" as const } }),
    messages,
    temperature: 0.2,
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter classification failed: ${errText}`);
  }

  const body: unknown = await response.json();
  const choices = body as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = choices.choices?.[0]?.message?.content ?? "{}";
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    raw = {};
  }

  return {
    title: compactText(
      normalizeText(typeof raw.title === "string" ? raw.title : undefined) ??
        "Captured thought",
      titleMaxLen,
    ),
    summary: compactText(
      normalizeText(typeof raw.summary === "string" ? raw.summary : undefined) ?? "",
      summaryMaxLen,
    ),
    category: compactText(
      normalizeText(typeof raw.category === "string" ? raw.category : undefined) ??
        "note",
      80,
    ),
    mood: normalizeText(typeof raw.mood === "string" ? raw.mood : undefined) ?? "neutral",
    themes: normalizeTags(raw.themes),
    tags: normalizeTags(raw.tags),
    confidence: clampConfidence(raw.confidence) ?? 0.7,
  };
}

export const getCardForClassify = internalQuery({
  args: { id: v.id("mindCards"), userId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== args.userId) {
      return null;
    }
    return card;
  },
});

const patchClassificationArgs = {
  id: v.id("mindCards"),
  userId: v.string(),
  autoCategory: v.optional(v.string()),
  autoThemes: v.array(v.string()),
  autoTags: v.array(v.string()),
  autoMood: v.optional(v.string()),
  autoSummary: v.optional(v.string()),
  aiConfidence: v.optional(v.number()),
  autoCategoryState: v.optional(classificationState),
  autoCategoryModel: v.optional(v.string()),
  autoCategoryReason: v.optional(v.string()),
};

export const patchCardClassificationInternal = internalMutation({
  args: patchClassificationArgs,
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== args.userId) {
      throw new Error("Card not found.");
    }

    const now = Date.now();
    const state = args.autoCategoryState ?? card.autoCategoryState;

    return ctx.db.patch(args.id, {
      autoCategory: args.autoCategory,
      autoThemes: args.autoThemes,
      autoTags: args.autoTags,
      autoMood: args.autoMood,
      autoSummary: args.autoSummary,
      aiConfidence: args.aiConfidence,
      autoCategoryState: state,
      autoCategoryModel: args.autoCategoryModel,
      autoCategoryReason: args.autoCategoryReason,
      autoClassifiedAt: state === "ready" ? now : card.autoClassifiedAt,
      updatedAt: now,
    });
  },
});

export const listCards = query({
  args: {
    type: v.optional(mindCardType),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const cards = await ctx.db
      .query("mindCards")
      .withIndex("by_user_created_at", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const filteredByType = args.type
      ? cards.filter((card) => card.type === args.type)
      : cards;

    if (!args.search) return filteredByType;

    const normalized = args.search.toLowerCase();
    return filteredByType.filter((card) => {
      const searchable = [card.title, card.sourceText, card.text, card.autoSummary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        searchable.includes(normalized) || card.autoTags.some((tag) => tag.includes(normalized))
      );
    });
  },
});

export const getCard = query({
  args: { id: v.id("mindCards") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId) {
      return null;
    }
    return card;
  },
});

export const createCard = mutation({
  args: {
    type: mindCardType,
    title: v.optional(v.string()),
    sourceText: v.optional(v.string()),
    text: v.optional(v.string()),
    imageData: v.optional(v.string()),
    audioData: v.optional(v.string()),
    audioDurationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const hasText = normalizeText(args.text);
    const hasImage = normalizeText(args.imageData);
    const hasAudio = normalizeText(args.audioData);

    if (!hasText && !hasImage && !hasAudio) {
      throw new Error("Card payload is missing content.");
    }

    const userId = await requireUserId(ctx);
    return ctx.db.insert("mindCards", {
      userId,
      type: args.type,
      title: normalizeText(args.title),
      sourceText: normalizeText(args.sourceText),
      text: hasText,
      imageData: hasImage,
      audioData: hasAudio,
      audioDurationSeconds: args.audioDurationSeconds,
      autoCategory: undefined,
      autoThemes: [],
      autoTags: [],
      autoMood: undefined,
      autoSummary: undefined,
      aiConfidence: undefined,
      autoCategoryState: "pending",
      autoCategoryReason: undefined,
      autoCategoryModel: undefined,
      createdAt: now,
      updatedAt: now,
      autoClassifiedAt: undefined,
    });
  },
});

export const deleteCard = mutation({
  args: { id: v.id("mindCards") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId) {
      throw new Error("Card not found.");
    }
    return ctx.db.delete(args.id);
  },
});

export const setCardAutoClassification = mutation({
  args: {
    id: v.id("mindCards"),
    autoCategory: v.optional(v.string()),
    autoThemes: v.array(v.string()),
    autoTags: v.array(v.string()),
    autoMood: v.optional(v.string()),
    autoSummary: v.optional(v.string()),
    aiConfidence: v.optional(v.number()),
    autoCategoryState: v.optional(classificationState),
    autoCategoryModel: v.optional(v.string()),
    autoCategoryReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId) {
      throw new Error("Card not found.");
    }

    const now = Date.now();
    const state = args.autoCategoryState ?? card.autoCategoryState;

    return ctx.db.patch(args.id, {
      autoCategory: args.autoCategory,
      autoThemes: args.autoThemes,
      autoTags: args.autoTags,
      autoMood: args.autoMood,
      autoSummary: args.autoSummary,
      aiConfidence: args.aiConfidence,
      autoCategoryState: state,
      autoCategoryModel: args.autoCategoryModel,
      autoCategoryReason: args.autoCategoryReason,
      autoClassifiedAt: state === "ready" ? now : card.autoClassifiedAt,
      updatedAt: now,
    });
  },
});

export const classifyCard = action({
  args: {
    id: v.id("mindCards"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }
    const userId = user._id;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const card = await ctx.runQuery(internal.mindCards.getCardForClassify, {
      id: args.id,
      userId,
    });

    if (!card) {
      throw new Error("Card not found.");
    }

    if (!apiKey) {
      await ctx.runMutation(internal.mindCards.patchCardClassificationInternal, {
        id: args.id,
        userId,
        autoThemes: [],
        autoTags: [],
        autoCategoryState: "failed",
        autoCategoryReason:
          "OPENROUTER_API_KEY is not configured in your Convex deployment environment.",
        autoCategoryModel: undefined,
        autoCategory: "uncategorized",
        autoSummary: "Auto-categorization is unavailable.",
        aiConfidence: 0,
      });

      return {
        success: false,
        state: "failed" as const,
      };
    }

    const cardPayload = extractCardContent(card);
    if (!cardPayload) {
      throw new Error("Could not build classification payload from card.");
    }

    const classifier = await classifyWithOpenRouter(cardPayload, {
      apiKey,
      model: OPENROUTER_FREE_MODEL,
    });

    const themes = classifier.themes.length ? classifier.themes : ["note"];
    const tags = classifier.tags.length ? classifier.tags : ["note"];

    await ctx.runMutation(internal.mindCards.patchCardClassificationInternal, {
      id: args.id,
      userId,
      autoCategory: classifier.category,
      autoThemes: themes,
      autoTags: tags,
      autoMood: classifier.mood,
      autoSummary: classifier.summary,
      aiConfidence: classifier.confidence,
      autoCategoryState: "ready",
      autoCategoryModel: OPENROUTER_FREE_MODEL,
      autoCategoryReason: undefined,
    });

    return {
      success: true,
      autoCategory: classifier.category,
      autoThemes: themes,
      autoTags: tags,
      autoMood: classifier.mood,
      autoSummary: classifier.summary,
      aiConfidence: classifier.confidence,
    };
  },
});
