"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import GroupSizeUi from "./GroupSizeUi";
import BudgetUi from "./BudgetUi";
import SelectDaysUi from "./SelectDaysUi";
import FinalUi from "./FinalUi";

type Message = {
  role: "user" | "assistant";
  content: string;
  ui?: string;
};

type TripData = {
  origin: string;
  destination: string;
  groupSize: string;
  budget: string;
  duration: string;
};

type TripPlan = {
  destination: string;
  origin: string;
  duration: string;
  budget: string;
  group_size: string;

  hotels?: {
    hotel_name: string;
    hotel_address: string;
    price_per_night: string;
    hotel_image_url: string;

    geo_coordinates?: {
      latitude: number;
      longitude: number;
    };

    rating: number;
    description: string;
  }[];

  itinerary?: {
    day: number;
    day_plan: string;
    best_time_to_visit_day: string;

    activities?: {
      place_name: string;
      place_details: string;
      place_image_url: string;

      geo_coordinates?: {
        latitude: number;
        longitude: number;
      };

      place_address: string;
      ticket_pricing: string;
      time_travel_each_location: string;
      best_time_to_visit: string;
    }[];
  }[];
};

type ChatboxProps = {
  onTripGenerated?: (
    trip: TripPlan
  ) => void | Promise<void>;

  onViewTrip?: () => void;

  isSavingTrip?: boolean;
};

function Chatbox({
  onTripGenerated,
  onViewTrip,
  isSavingTrip = false,
}: ChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);

  const [tripData, setTripData] = useState<TripData>({
    origin: "",
    destination: "",
    groupSize: "",
    budget: "",
    duration: "",
  });

  /*
   * Start every new trip by explicitly asking
   * for the destination.
   *
   * We intentionally do NOT render EmptyBoxState here,
   * because that could allow a suggestion to bypass
   * the destination question.
   */
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Where would you like to travel?",
        ui: "none",
      },
    ]);
  }, []);

  const addAssistantMessage = (
    content: string,
    ui?: string
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content,
        ui,
      },
    ]);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content,
      },
    ]);
  };

  /*
   * Determine which piece of information
   * is still missing.
   *
   * Destination always comes first.
   */
  const getNextStep = (data: TripData) => {
    if (!data.destination) {
      return "destination";
    }

    if (!data.origin) {
      return "origin";
    }

    if (!data.groupSize) {
      return "groupSize";
    }

    if (!data.budget) {
      return "budget";
    }

    if (!data.duration) {
      return "duration";
    }

    return "final";
  };

  /*
   * Ask the next question based on the
   * information we already have.
   */
  const askNextQuestion = (data: TripData) => {
    const nextStep = getNextStep(data);

    switch (nextStep) {
      case "destination":
        addAssistantMessage(
          "Where would you like to travel?",
          "none"
        );
        break;

      case "origin":
        addAssistantMessage(
          "Where are you travelling from?",
          "none"
        );
        break;

      case "groupSize":
        addAssistantMessage(
          "Who are you travelling with?",
          "groupSize"
        );
        break;

      case "budget":
        addAssistantMessage(
          "What is your budget?",
          "budget"
        );
        break;

      case "duration":
        addAssistantMessage(
          "How many days is your trip?",
          "TripDuration"
        );
        break;

      case "final":
        generateTrip(data);
        break;
    }
  };

  /*
   * Detect inputs such as:
   *
   * India to UK
   * Delhi to London
   * New York to Paris
   *
   * If both locations are supplied,
   * we save both at once.
   */
  const extractLocations = (text: string) => {
    const match = text.match(
      /^(.+?)\s+(?:to|→|-)\s+(.+)$/i
    );

    if (!match) {
      return null;
    }

    const origin = match[1].trim();
    const destination = match[2].trim();

    if (!origin || !destination) {
      return null;
    }

    return {
      origin,
      destination,
    };
  };

  /*
   * Generate the final trip using the
   * existing Ollama API route.
   */
  const generateTrip = async (data: TripData) => {
    setLoading(true);
    setIsFinal(true);

    addAssistantMessage(
      "Thanks! I'm generating your personalized trip plan.",
      "Final"
    );

    try {
      const conversation = [
        {
          role: "user",
          content: `Starting Location: ${data.origin}`,
        },
        {
          role: "user",
          content: `Destination: ${data.destination}`,
        },
        {
          role: "user",
          content: `Group Size: ${data.groupSize}`,
        },
        {
          role: "user",
          content: `Budget: ${data.budget}`,
        },
        {
          role: "user",
          content: `Trip Duration: ${data.duration}`,
        },
      ];

      console.log(
        "========== GENERATING FINAL TRIP =========="
      );

      console.log(data);

      const { data: response } = await axios.post(
        "/api/aimodel",
        {
          messages: conversation,
          isFinal: true,
        }
      );

      console.log(
        "========== FINAL TRIP RESPONSE =========="
      );

      console.log(response);

      if (response?.trip_plan) {
        /*
         * Wait for the parent component to save
         * the generated trip into Convex.
         */
        await onTripGenerated?.(
          response.trip_plan
        );
      } else {
        console.error(
          "No trip_plan was returned from Ollama."
        );

        throw new Error(
          "No trip plan was returned."
        );
      }
    } catch (error: any) {
      console.error(
        "========== FINAL TRIP ERROR =========="
      );

      console.error(error);

      addAssistantMessage(
        "I couldn't generate or save the trip plan. Please try again."
      );

      setIsFinal(false);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Handle user answers.
   */
  const handleMessage = async (text: string) => {
    const message = text.trim();

    if (!message || loading || isFinal) {
      return;
    }

    addUserMessage(message);

    setUserInput("");

    const nextStep = getNextStep(tripData);

    const updatedData = {
      ...tripData,
    };

    /*
     * LOCATION HANDLING
     *
     * If the user gives:
     *
     * India to UK
     *
     * we immediately extract both.
     */
    if (
      nextStep === "destination" ||
      nextStep === "origin"
    ) {
      const locations =
        extractLocations(message);

      if (locations) {
        updatedData.origin =
          locations.origin;

        updatedData.destination =
          locations.destination;
      } else if (
        nextStep === "destination"
      ) {
        updatedData.destination = message;
      } else {
        updatedData.origin = message;
      }
    }

    /*
     * GROUP SIZE
     */
    else if (nextStep === "groupSize") {
      updatedData.groupSize = message;
    }

    /*
     * BUDGET
     */
    else if (nextStep === "budget") {
      updatedData.budget = message;
    }

    /*
     * TRIP DURATION
     */
    else if (nextStep === "duration") {
      updatedData.duration = message;
    }

    setTripData(updatedData);

    console.log(
      "========== TRIP DATA =========="
    );

    console.log(updatedData);

    const followingStep =
      getNextStep(updatedData);

    /*
     * Once all information is collected,
     * generate the final trip.
     */
    if (followingStep === "final") {
      await generateTrip(updatedData);
    } else {
      askNextQuestion(updatedData);
    }
  };

  const onSend = async (text?: string) => {
    await handleMessage(
      text ?? userInput
    );
  };

  /*
   * Render the interactive UI components
   * used during trip planning.
   */
  const RenderGenerativeUi = (
    ui: string
  ) => {
    switch (ui) {
      case "groupSize":
        return (
          <GroupSizeUi
            onSelectedOption={(value) =>
              onSend(value)
            }
          />
        );

      case "budget":
        return (
          <BudgetUi
            onSelectedOption={(value) =>
              onSend(value)
            }
          />
        );

      case "TripDuration":
        return (
          <SelectDaysUi
            onSelectedOption={(value) =>
              onSend(value)
            }
          />
        );

      case "Final":
        return (
          <FinalUi
            isLoading={
              loading || isSavingTrip
            }
            viewTrip={() => {
              if (
                !loading &&
                !isSavingTrip
              ) {
                onViewTrip?.();
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white">
      {/* Chat Messages */}
      <section className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {messages.map(
          (msg, index) => (
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
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {msg.content}
                  </p>
                </div>

                {msg.role ===
                  "assistant" &&
                  msg.ui && (
                    <div className="mt-3">
                      {RenderGenerativeUi(
                        msg.ui
                      )}
                    </div>
                  )}
              </div>
            </div>
          )
        )}

        {/* Normal loading state */}
        {loading && !isFinal && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />

                <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />

                <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-300" />

                <span className="ml-2 text-sm text-gray-500">
                  Planning your trip...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Saving trip state */}
        {isSavingTrip && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-700">
                Saving your trip...
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Message Input */}
      <section className="border-t bg-white p-4">
        <div className="relative">
          <Textarea
            placeholder="Type your message..."
            className="min-h-[100px] resize-none rounded-xl pr-14 focus-visible:ring-0"
            value={userInput}
            onChange={(e) =>
              setUserInput(
                e.target.value
              )
            }
            disabled={
              loading ||
              isFinal ||
              isSavingTrip
            }
          />

          <Button
            size="icon"
            className="absolute bottom-3 right-3 rounded-full"
            onClick={() => onSend()}
            disabled={
              loading ||
              isFinal ||
              isSavingTrip
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Chatbox;