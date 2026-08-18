"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import EmptyBoxState from "./EmptyBoxState";
import GroupSizeUi from "./GroupSizeUi";
import BudgetUi from "./BudgetUi";
import SelectDaysUi from "./SelectDaysUi";
import FinalUi from "./FinalUi";

type Message = {
  role: string;
  content: string;
  ui?: string;
  [key: string]: any;
};

function Chatbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.role === "assistant" &&
      lastMessage.ui === "Final"
    ) {
      setIsFinal(true);

      // GenerateTrip();
    }
  }, [messages]);

  const RenderGenerativeUi = (ui: string) => {
    switch (ui) {
      case "groupSize":
        return (
          <GroupSizeUi
            onSelectedOption={(value) => onSend(value)}
          />
        );

      case "budget":
        return (
          <BudgetUi
            onSelectedOption={(value) => onSend(value)}
          />
        );

      case "TripDuration":
        return (
          <SelectDaysUi
            onSelectedOption={(value) => onSend(value)}
          />
        );

      case "Final":
        return (
          <FinalUi
            isLoading={isFinal}
            viewTrip={() => {
              console.log("View Trip");
            }}
          />
        );

      default:
        return null;
    }
  };

  const onSend = async (text?: string) => {
    const message = text ?? userInput;

    if (!message.trim() || loading) return;

    // Message sent to AI
    let finalMessage = message;

    if (message.toLowerCase().includes(" to ")) {
      const [origin, destination] = message.split(/to/i);

      finalMessage = `
Origin: ${origin.trim()}
Destination: ${destination.trim()}
      `;
    }

    // Message shown to user
    const newMsg: Message = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, newMsg]);
    setUserInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/aimodel", {
        messages: [
          ...messages,
          {
            role: "user",
            content: finalMessage,
          },
        ],
      });

      console.log("API Response:", data);

      if (data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.resp,
            ui: data.ui,
            ...data,
          },
        ]);
      }
          } catch (error) {
      console.error("Axios Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white">
      {messages.length === 0 && (
        <EmptyBoxState
          onSelectOption={(value: string) => onSend(value)}
        />
      )}

      {/* Chat Messages */}
      <section className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div className="max-w-[90%]">
              <div
                className={`rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm leading-6 whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>

              {msg.role === "assistant" &&
                msg.ui && (
                  <div className="mt-3">
                    {RenderGenerativeUi(msg.ui)}
                  </div>
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300" />
                <span className="ml-2 text-sm text-gray-500">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Input */}
      <section className="border-t bg-white p-4">
        <div className="relative">
          <Textarea
            placeholder="Type your message..."
            className="min-h-[100px] resize-none rounded-xl pr-14 focus-visible:ring-0"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading || isFinal}
          />

          <Button
            size="icon"
            className="absolute bottom-3 right-3 rounded-full"
            onClick={() => onSend()}
            disabled={loading || isFinal}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Chatbox;