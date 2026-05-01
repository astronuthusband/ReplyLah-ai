"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* WhatsApp-style typing bubble */}
      <div className="flex items-center gap-1 bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-sm text-gray-400">AI tengah generate replies...</span>
    </div>
  );
}
