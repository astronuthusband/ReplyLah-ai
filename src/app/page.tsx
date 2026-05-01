"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, Info, MessageCircle } from "lucide-react";
import { ReplyCard } from "@/components/ReplyCard";
import { TypingIndicator } from "@/components/TypingIndicator";
import { BusinessType, Tone, EXAMPLE_MESSAGES } from "@/lib/prompts";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------
interface GenerateResult {
  replies: string[];
  detectedIntent: string;
}

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------
const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string }[] =
  [
    { value: "salon", label: "Salon / Barbershop", emoji: "✂️" },
    { value: "food", label: "F&B / Kedai Makan", emoji: "🍜" },
    { value: "tuition", label: "Tuition / Education", emoji: "📚" },
    { value: "ecommerce", label: "Online Shop", emoji: "📦" },
    { value: "clinic", label: "Klinik / Pharmacy", emoji: "🏥" },
    { value: "boutique", label: "Boutique / Fashion", emoji: "👗" },
    { value: "gym", label: "Gym / Fitness", emoji: "💪" },
    { value: "cleaning", label: "Cleaning Services", emoji: "🧹" },
    { value: "other", label: "Other Business", emoji: "🏪" },
  ];

const TONES: { value: Tone; label: string; desc: string }[] = [
  {
    value: "friendly",
    label: "Friendly Casual",
    desc: "Warm, Manglish mix",
  },
  {
    value: "professional",
    label: "Professional",
    desc: "Clear & efficient",
  },
  {
    value: "super_polite",
    label: "Super Polite",
    desc: "Formal, respectful",
  },
];

// ---------------------------------------------------------------------------
//  Main Page Component
// ---------------------------------------------------------------------------
export default function HomePage() {
  // Form state
  const [customerMessage, setCustomerMessage] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("salon");
  const [tone, setTone] = useState<Tone>("friendly");
  const [businessNotes, setBusinessNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Result state
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Count characters
  const charCount = customerMessage.length;
  const maxChars = 500;

  // Load example
  const loadExample = (idx: number) => {
    const ex = EXAMPLE_MESSAGES[idx];
    setCustomerMessage(ex.message);
    setBusinessType(ex.businessType);
    setTone(ex.tone);
    setResult(null);
    setError(null);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!customerMessage.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerMessage, businessType, tone, businessNotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data);
      // Scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Network error. Sila check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = customerMessage.trim().length > 0 && !loading;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ── Header ── */}
      <header className="bg-[#075E54] text-white">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">ReplyLah</h1>
            <p className="text-xs text-green-300 leading-none">
              AI WhatsApp Reply Assistant 🇲🇾
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* ── Quick examples ── */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Try an example
          </p>
          <div className="flex gap-2 flex-wrap">
            {EXAMPLE_MESSAGES.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(i)}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-green-400 hover:text-green-700 transition-all"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Customer message */}
          <div className="p-4 border-b border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Customer message
            </label>

            {/* WhatsApp-style input preview */}
            {customerMessage && (
              <div className="mb-3 flex justify-start">
                <div className="bubble-in max-w-[85%] px-3 py-2 shadow-sm">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {customerMessage}
                  </p>
                  <p className="text-[10px] text-gray-400 text-right mt-0.5">
                    {new Date().toLocaleTimeString("en-MY", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            )}

            <textarea
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder='Paste customer message here... e.g. "Ada slot petang tak?"'
              maxLength={maxChars}
              rows={3}
              className="w-full text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-[11px] ${
                  charCount > maxChars * 0.9 ? "text-orange-400" : "text-gray-400"
                }`}
              >
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Business type + Tone */}
          <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Business type
              </label>
              <div className="relative">
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.emoji} {bt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-3 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Tone / gaya
              </label>
              <div className="flex flex-col gap-1.5">
                {TONES.map((t) => (
                  <label
                    key={t.value}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 border transition-all text-xs ${
                      tone === t.value
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={t.value}
                      checked={tone === t.value}
                      onChange={() => setTone(t.value)}
                      className="accent-green-500"
                    />
                    <span>
                      <span className="font-medium">{t.label}</span>
                      <br />
                      <span className="text-[10px] opacity-60">{t.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Optional notes */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors"
            >
              <Info size={12} />
              {showNotes ? "Hide" : "Add"} pricing / policies (optional)
              <ChevronDown
                size={12}
                className={`transition-transform ${showNotes ? "rotate-180" : ""}`}
              />
            </button>

            {showNotes && (
              <textarea
                value={businessNotes}
                onChange={(e) => setBusinessNotes(e.target.value)}
                placeholder="e.g. Haircut RM30, colour dari RM80. Buka 10am-8pm. Closed Isnin."
                rows={3}
                maxLength={300}
                className="mt-2 w-full text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
            )}
          </div>

          {/* Submit button */}
          <div className="p-4">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                canSubmit
                  ? "bg-[#25D366] hover:bg-[#22c55e] active:scale-[0.98] text-white shadow-lg shadow-green-200"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <span className="typing-dot bg-white" />
                  <span className="typing-dot bg-white" />
                  <span className="typing-dot bg-white" />
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Replies
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {/* ── Results ── */}
        <div id="results">
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <TypingIndicator />
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              {/* Intent badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Detected:
                </span>
                <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">
                  {result.detectedIntent}
                </span>
              </div>

              {/* Reply cards */}
              {result.replies.map((reply, i) => (
                <ReplyCard key={i} reply={reply} index={i} />
              ))}

              {/* Footer nudge */}
              <div className="text-center py-2">
                <p className="text-xs text-gray-400">
                  Not happy? Edit your context above and regenerate 🔄
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-xs text-gray-400">
          ReplyLah is a copy-paste assistant. Always review before sending.
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Built for Malaysian businesses 🇲🇾
        </p>
      </footer>
    </div>
  );
}
