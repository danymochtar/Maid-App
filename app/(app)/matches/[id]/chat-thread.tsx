"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessageAction } from "./actions";

type Msg = {
  id: string;
  senderId: string;
  body: string;
  redactedTypes: string[];
  createdAt: string;
};

export function ChatThread({
  matchId,
  mySenderId,
  locked,
  initialMessages,
}: {
  matchId: string;
  mySenderId: string;
  locked: boolean;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const body = text.trim();
    if (!body || locked) return;
    setText("");
    setError(null);
    startTransition(async () => {
      const r = await sendMessageAction(matchId, body);
      if (!r.ok) {
        setError(r.error ?? "Failed to send");
        return;
      }
      setMessages((m) => [
        ...m,
        {
          id: r.id,
          senderId: mySenderId,
          body: r.body,
          redactedTypes: r.redactedTypes,
          createdAt: r.createdAt,
        },
      ]);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <ul className="flex flex-1 flex-col gap-2 p-3">
        {messages.length === 0 && (
          <li className="text-center text-sm text-zinc-400">No messages yet. Say hi 👋</li>
        )}
        {messages.map((m) => {
          const mine = m.senderId === mySenderId;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-900"
                }`}
              >
                <p>{m.body}</p>
                {m.redactedTypes.length > 0 && (
                  <p
                    className={`mt-1 text-[10px] ${mine ? "text-brand-50" : "text-zinc-500"}`}
                  >
                    🛡️ {m.redactedTypes.join(", ")} hidden — keep contact on-platform
                  </p>
                )}
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ul>

      <div className="sticky bottom-16 z-10 border-t border-zinc-200 bg-white p-2">
        {error && <p className="mb-1 px-2 text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={locked || pending}
            placeholder={locked ? "Chat locked until matched" : "Type a message…"}
            className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-base disabled:bg-zinc-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={locked || pending || !text.trim()}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
