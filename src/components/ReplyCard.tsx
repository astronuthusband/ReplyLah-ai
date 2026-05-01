"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface ReplyCardProps {
  reply: string;
  index: number;
}

export function ReplyCard({ reply, index }: ReplyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = reply;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const labels = ["Option A", "Option B", "Option C"];

  return (
    <div className="reply-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
            {labels[index]}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
            copied
              ? "bg-green-500 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 active:scale-95"
          }`}
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={2.5} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} strokeWidth={2} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Message bubble — WhatsApp style */}
      <div className="p-4">
        <div className="bubble-out inline-block max-w-full px-3.5 py-2.5 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            {reply}
          </p>
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-gray-400">
              {new Date().toLocaleTimeString("en-MY", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            {/* WhatsApp double tick */}
            <svg
              className="ml-1 mt-0.5"
              width="14"
              height="10"
              viewBox="0 0 14 10"
              fill="none"
            >
              <path
                d="M1 5l3 3L13 1"
                stroke="#53bdeb"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 5l3 3"
                stroke="#53bdeb"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Paste hint */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-400">
          Copy → paste into WhatsApp → send 🚀
        </p>
      </div>
    </div>
  );
}
