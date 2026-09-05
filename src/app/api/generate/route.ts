
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  buildSystemPrompt,
  buildUserPrompt,
  GenerateInput,
} from "@/lib/prompts";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ---------------------------------------------------------------------------
// Rate limiting (simple in-memory — use Redis/Upstash for production)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// POST /api/generate
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment.",
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();

    const {
      customerMessage,
      businessType,
      tone,
      businessNotes,
    } = body as GenerateInput;

    // Validate customer message
    if (!customerMessage?.trim()) {
      return NextResponse.json(
        {
          error: "Customer message is required.",
        },
        { status: 400 }
      );
    }

    if (customerMessage.length > 500) {
      return NextResponse.json(
        {
          error: "Message too long (max 500 characters).",
        },
        { status: 400 }
      );
    }

    // Validate business type
    const validBusinessTypes = [
      "salon",
      "food",
      "tuition",
      "ecommerce",
      "clinic",
      "boutique",
      "gym",
      "cleaning",
      "other",
    ];

    if (!validBusinessTypes.includes(businessType)) {
      return NextResponse.json(
        {
          error: "Invalid business type.",
        },
        { status: 400 }
      );
    }

    // Validate tone
    const validTones = [
      "friendly",
      "professional",
      "super_polite",
    ];

    if (!validTones.includes(tone)) {
      return NextResponse.json(
        {
          error: "Invalid tone selection.",
        },
        { status: 400 }
      );
    }

    // Build input
    const input: GenerateInput = {
      customerMessage: customerMessage.trim(),
      businessType,
      tone,
      businessNotes: businessNotes?.trim() || undefined,
    };

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured.");

      return NextResponse.json(
        {
          error: "API key configuration error.",
        },
        { status: 500 }
      );
    }

    // Call Groq API
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      max_tokens: 800,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(input),
        },
        {
          role: "user",
          content: buildUserPrompt(input.customerMessage),
        },
      ],
    });

    // Extract response
    const rawText =
      completion.choices[0]?.message?.content ?? "";

    if (!rawText) {
      console.error("Groq returned an empty response.");

      return NextResponse.json(
        {
          error: "AI returned an empty response. Please try again.",
        },
        { status: 500 }
      );
    }

    // Parse JSON response
    let parsed: {
      replies: string[];
      detectedIntent: string;
    };

    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "JSON parse failed:",
        parseError,
        "Raw response:",
        rawText
      );

      return NextResponse.json(
        {
          error: "AI response format error. Please try again.",
        },
        { status: 500 }
      );
    }

    // Validate AI response
    if (
      !Array.isArray(parsed.replies) ||
      parsed.replies.length === 0
    ) {
      console.error(
        "Unexpected AI response structure:",
        parsed
      );

      return NextResponse.json(
        {
          error: "Unexpected AI response. Please try again.",
        },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      replies: parsed.replies.slice(0, 3),
      detectedIntent:
        parsed.detectedIntent ?? "Customer enquiry",
      usage: {
        inputTokens:
          completion.usage?.prompt_tokens ?? 0,
        outputTokens:
          completion.usage?.completion_tokens ?? 0,
      },
    });
  } catch (error: unknown) {
    console.error("Generate API error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    const apiError = error as {
      status?: number;
      message?: string;
      error?: {
        message?: string;
        type?: string;
        code?: string;
      };
    };

    const status = apiError.status ?? 500;

    const errorMessage =
      apiError.error?.message ??
      apiError.message ??
      (error instanceof Error
        ? error.message
        : "Unknown error");

    // Authentication error
    if (
      status === 401 ||
      errorMessage.toLowerCase().includes("authentication") ||
      errorMessage.toLowerCase().includes("api key")
    ) {
      return NextResponse.json(
        {
          error: "Groq API key is invalid or not configured.",
        },
        { status: 500 }
      );
    }

    // Rate limit error
    if (status === 429) {
      return NextResponse.json(
        {
          error: "Groq rate limit reached. Please try again shortly.",
        },
        { status: 429 }
      );
    }

    // Model/API request error
    if (
      status === 400 &&
      (
        errorMessage.toLowerCase().includes("model") ||
        errorMessage.toLowerCase().includes("invalid")
      )
    ) {
      return NextResponse.json(
        {
          error: `Groq model error: ${errorMessage}`,
        },
        { status: 500 }
      );
    }

    // General error
    return NextResponse.json(
      {
        error: `Groq API error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

