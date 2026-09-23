import { NextRequest, NextResponse } from "next/server";
import arcjet, { tokenBucket } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";

const MODEL = "llama3.2:3b";
const OLLAMA_URL = "http://localhost:11434/api/generate";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({
      mode: "LIVE",
      characteristics: ["userId"],
      refillRate: 10,
      interval: 86400,
      capacity: 10,
    }),
  ],
});

const PROMPT = `
You are an AI Trip Planner Agent.

Your task is to help users plan a trip by asking ONLY ONE question at a time.

Collect the following information in this order:

1. Starting Location
2. Destination
3. Group Size
4. Budget
5. Trip Duration

Rules:

- Ask ONLY ONE question at a time.
- Never ask multiple questions together.
- Never skip a step.
- If the answer is unclear, ask for clarification.
- Maintain a friendly conversational tone.
- If the user provides both origin and destination together,
  automatically extract both and continue with Group Size.
- Never ask again for origin or destination if they already exist in the conversation.
- After Trip Duration, DO NOT ask any more questions.
- Immediately return ui="Final".
- Never ask about interests, food, hotels, transport or activities.
- Return ONLY valid JSON.

The "ui" field must be exactly one of:

- "none"
- "groupSize"
- "budget"
- "TripDuration"
- "Final"

Examples:

{
  "resp": "Where are you travelling from?",
  "ui": "none"
}

{
  "resp": "Where would you like to travel?",
  "ui": "none"
}

{
  "resp": "Who are you travelling with?",
  "ui": "groupSize"
}

{
  "resp": "What is your budget?",
  "ui": "budget"
}

{
  "resp": "How many days is your trip?",
  "ui": "TripDuration"
}

{
  "resp": "Thanks! I'm generating your personalized trip plan.",
  "ui": "Final"
}

Return ONLY valid JSON.
`;

const FINAL_PROMPT = `
Generate a complete travel plan based on the conversation.

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include explanations outside the JSON.

Output Schema:

{
  "trip_plan": {
    "destination": "string",
    "origin": "string",
    "duration": "string",
    "budget": "string",
    "group_size": "string",

    "hotels": [
      {
        "hotel_name": "string",
        "hotel_address": "string",
        "price_per_night": "string",
        "hotel_image_url": "string",

        "geo_coordinates": {
          "latitude": 0,
          "longitude": 0
        },

        "rating": 0,
        "description": "string"
      }
    ],

    "itinerary": [
      {
        "day": 1,
        "day_plan": "string",
        "best_time_to_visit_day": "string",

        "activities": [
          {
            "place_name": "string",
            "place_details": "string",
            "place_image_url": "string",

            "geo_coordinates": {
              "latitude": 0,
              "longitude": 0
            },

            "place_address": "string",
            "ticket_pricing": "string",
            "time_travel_each_location": "string",
            "best_time_to_visit": "string"
          }
        ]
      }
    ]
  }
}

Important:

- Return realistic travel information.
- Keep hotel and activity information relevant to the destination.
- Coordinates must be numeric latitude and longitude.
- Ratings must be numeric.
- Prices should be strings including currency.
- Create a useful day-by-day itinerary.
- Do not ask the user any questions.
- Return ONLY the JSON object.
`;

function cleanJson(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    // Get the currently signed-in Clerk user.
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        {
          error: "You must be signed in to use the AI Trip Planner.",
        },
        { status: 401 }
      );
    }

    // Apply Arcjet rate limiting using the real Clerk user ID.
    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    console.log("========== ARCJET DECISION ==========");
    console.log(decision);

    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error:
            "Daily AI request limit reached. Please try again tomorrow.",
          reason: decision.reason,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    const messages = Array.isArray(body?.messages)
      ? body.messages
      : [];

    const isFinal = Boolean(body?.isFinal);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages were provided." },
        { status: 400 }
      );
    }

    const conversation = messages
      .map(
        (message: any) =>
          `${message.role}: ${message.content}`
      )
      .join("\n");

    const prompt = `
${isFinal ? FINAL_PROMPT : PROMPT}

Conversation:

${conversation}
`;

    console.log("========== OLLAMA REQUEST ==========");
    console.log("Model:", MODEL);
    console.log("User:", userId);
    console.log("isFinal:", isFinal);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("========== OLLAMA API ERROR ==========");
      console.error("Status:", response.status);
      console.error(JSON.stringify(data, null, 2));

      return NextResponse.json(
        {
          error:
            data?.error ||
            "Ollama request failed.",
        },
        { status: 500 }
      );
    }

    const content = data?.response;

    if (!content) {
      console.error("========== EMPTY OLLAMA RESPONSE ==========");
      console.error(JSON.stringify(data, null, 2));

      return NextResponse.json(
        { error: "Ollama returned an empty response." },
        { status: 500 }
      );
    }

    console.log("========== OLLAMA RESPONSE ==========");
    console.log(content);

    const cleaned = cleanJson(content);

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      console.error("========== JSON PARSE ERROR ==========");
      console.error(error);
      console.error("RAW RESPONSE:");
      console.error(cleaned);

      return NextResponse.json(
        {
          error: "Ollama returned invalid JSON.",
          raw: cleaned,
        },
        { status: 500 }
      );
    }

    console.log("========== PARSED JSON ==========");
    console.log(parsed);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("========== OLLAMA SERVER ERROR ==========");
    console.error(error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not connect to Ollama. Make sure Ollama is running.",
      },
      { status: 500 }
    );
  }
}