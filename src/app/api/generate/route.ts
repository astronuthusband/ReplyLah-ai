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
//  Rate limiting (simple in-memory — use Redis/Upstash for production)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
//  POST /api/generate
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse + validate request body
    const body = await req.json();
    const { customerMessage, businessType, tone, businessNotes } =
      body as GenerateInput;

    if (!customerMessage?.trim()) {
      return NextResponse.json(
        { error: "Customer message is required." },
        { status: 400 }
      );
    }

    if (customerMessage.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)." },
        { status: 400 }
      );
    }

    const validBusinessTypes = [
      "salon","food","tuition","ecommerce","clinic","boutique","gym","cleaning","other",
    ];
    const validTones = ["friendly", "professional", "super_polite"];

    if (!validBusinessTypes.includes(businessType)) {
      return NextResponse.json(
        { error: "Invalid business type." },
        { status: 400 }
      );
    }

    if (!validTones.includes(tone)) {
      return NextResponse.json(
        { error: "Invalid tone selection." },
        { status: 400 }
      );
    }

    const input: GenerateInput = {
      customerMessage: customerMessage.trim(),
      businessType,
      tone,
      businessNotes: businessNotes?.trim() || undefined,
    };

    // Call Groq API
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(input) },
        { role: "user",   content: buildUserPrompt(input.customerMessage) },
      ],
    });

    // Extract text content
    const rawText = completion.choices[0]?.message?.content ?? "";

    // Parse JSON response
    let parsed: { replies: string[]; detectedIntent: string };
    try {
      // Strip markdown code fences if model wrapped in them
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed. Raw response:", rawText);
      return NextResponse.json(
        { error: "AI response format error. Please try again." },
        { status: 500 }
      );
    }

    // Validate structure
    if (!Array.isArray(parsed.replies) || parsed.replies.length === 0) {
      return NextResponse.json(
        { error: "Unexpected AI response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      replies: parsed.replies.slice(0, 3),
      detectedIntent: parsed.detectedIntent ?? "Customer enquiry",
      usage: {
        inputTokens: completion.usage?.prompt_tokens ?? 0,
        outputTokens: completion.usage?.completion_tokens ?? 0,
      },
    });
  } catch (error: unknown) {
    console.error("Generate API error:", error);

    if (
      error instanceof Error &&
      error.message?.includes("authentication")
    ) {
      return NextResponse.json(
        { error: "API key configuration error." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
