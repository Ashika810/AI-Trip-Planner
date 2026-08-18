import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
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
- If the user provides both origin and destination together (Example: India to London), automatically extract both and continue with Group Size.
- Never ask again for origin or destination if they already exist in the conversation.
- After Trip Duration, DO NOT ask any more questions.
- Immediately return ui="Final".
- Never ask about interests, food, hotels, transport or activities.
- Return ONLY JSON.

The "ui" field must be exactly one of:

- "none"
- "groupSize"
- "budget"
- "TripDuration"
- "Final"

Examples:

{
"resp":"Where are you travelling from?",
"ui":"none"
}

{
"resp":"Where would you like to travel?",
"ui":"none"
}

{
"resp":"Who are you travelling with?",
"ui":"groupSize"
}

{
"resp":"What is your budget?",
"ui":"budget"
}

{
"resp":"How many days is your trip?",
"ui":"TripDuration"
}

{
"resp":"Thanks! I'm generating your personalized trip plan.",
"ui":"Final"
}

Return ONLY valid JSON.
`;

const FINAL_PROMPT = `
Generate a complete travel plan.

Return ONLY valid JSON.

Output Schema:

{
  "trip_plan":{
    "destination":"string",
    "origin":"string",
    "duration":"string",
    "budget":"string",
    "group_size":"string",

    "hotels":[
      {
        "hotel_name":"string",
        "hotel_address":"string",
        "price_per_night":"string",
        "hotel_image_url":"string",

        "geo_coordinates":{
          "latitude":"number",
          "longitude":"number"
        },

        "rating":"number",
        "description":"string"
      }
    ],

    "itinerary":[
      {
        "day":"number",
        "day_plan":"string",
        "best_time_to_visit_day":"string",

        "activities":[
          {
            "place_name":"string",
            "place_details":"string",
            "place_image_url":"string",

            "geo_coordinates":{
              "latitude":"number",
              "longitude":"number"
            },

            "place_address":"string",
            "ticket_pricing":"string",
            "time_travel_each_location":"string",
            "best_time_to_visit":"string"
          }
        ]
      }
    ]
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, isFinal } = await req.json();

    const conversation = messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
${isFinal ? FINAL_PROMPT : PROMPT}

Conversation:

${conversation}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "Empty response from Groq.",
        },
        {
          status: 500,
        }
      );
    }

    console.log("========== GROQ RESPONSE ==========");
    console.log(content);

    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
          let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("========== JSON PARSE ERROR ==========");
      console.error(err);

      console.log("RAW RESPONSE:");
      console.log(cleaned);

      return NextResponse.json(
        {
          error: "Groq returned invalid JSON.",
          raw: cleaned,
        },
        {
          status: 500,
        }
      );
    }

    console.log("========== PARSED JSON ==========");
    console.log(parsed);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.log("========== GROQ ERROR ==========");

    if (error?.status) {
      console.log("Status:", error.status);
    }

    if (error?.message) {
      console.log("Message:", error.message);
    }

    if (error?.error) {
      console.dir(error.error, { depth: null });
    }

    console.dir(error, { depth: null });

    return NextResponse.json(
      {
        error: error?.message || "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}