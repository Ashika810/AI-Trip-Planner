import { NextRequest, NextResponse } from "next/server";

const MODEL = "llama3.2:3b";
const OLLAMA_URL = "http://localhost:11434/api/generate";

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
You are an AI Trip Planner.

Generate a complete travel plan based on the conversation.

IMPORTANT — TRIP DURATION RULE:

The conversation contains the user's requested trip duration.

You MUST generate EXACTLY the same number of itinerary days as requested.

For example:

If the user requested:
"2 Days"

You MUST return:

"itinerary": [
  {
    "day": 1,
    ...
  },
  {
    "day": 2,
    ...
  }
]

If the user requested:
"3 Days"

You MUST return:

"itinerary": [
  {
    "day": 1,
    ...
  },
  {
    "day": 2,
    ...
  },
  {
    "day": 3,
    ...
  }
]

NEVER return fewer days than requested.

NEVER return more days than requested.

NEVER stop the itinerary early.

Every day must have useful activities.

The day numbers MUST be sequential:

1, 2, 3, 4, etc.

The "duration" field must also match the requested trip duration.

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
- Every requested day MUST be included.
- Do not combine multiple days into one itinerary entry.
- Do not skip any day.
- Do not ask the user any questions.
- Return ONLY the JSON object.
`;

function cleanJson(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Extract the requested number of trip days from the conversation.
 *
 * Examples:
 * "Trip Duration: 2 Days" -> 2
 * "Trip Duration: 5 Days" -> 5
 * "2 days" -> 2
 */
function extractRequestedDays(conversation: string): number | null {
  const patterns = [
    /Trip Duration\s*:\s*(\d+)\s*Days?/i,
    /(\d+)\s*Days?/i,
    /for\s+(\d+)\s*days?/i,
  ];

  for (const pattern of patterns) {
    const match = conversation.match(pattern);

    if (match) {
      const days = Number(match[1]);

      if (Number.isInteger(days) && days > 0 && days <= 30) {
        return days;
      }
    }
  }

  return null;
}

/**
 * Validate that the generated itinerary contains exactly
 * the requested number of days.
 */
function validateItinerary(
  parsed: any,
  requestedDays: number | null
) {
  if (!parsed?.trip_plan) {
    return false;
  }

  if (!Array.isArray(parsed.trip_plan.itinerary)) {
    return false;
  }

  if (requestedDays === null) {
    return true;
  }

  if (parsed.trip_plan.itinerary.length !== requestedDays) {
    return false;
  }

  for (let index = 0; index < requestedDays; index++) {
    const expectedDay = index + 1;
    const actualDay = parsed.trip_plan.itinerary[index]?.day;

    if (actualDay !== expectedDay) {
      return false;
    }
  }

  return true;
}

/**
 * Ask Ollama to generate the response.
 */
async function generateWithOllama(prompt: string) {
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
        temperature: 0.1,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("========== OLLAMA API ERROR ==========");
    console.error("Status:", response.status);
    console.error(JSON.stringify(data, null, 2));

    throw new Error(
      data?.error || "Ollama request failed."
    );
  }

  const content = data?.response;

  if (!content) {
    console.error(
      "========== EMPTY OLLAMA RESPONSE =========="
    );
    console.error(JSON.stringify(data, null, 2));

    throw new Error("Ollama returned an empty response.");
  }

  return content;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = Array.isArray(body?.messages)
      ? body.messages
      : [];

    const isFinal = Boolean(body?.isFinal);

    if (messages.length === 0) {
      return NextResponse.json(
        {
          error: "No messages were provided.",
        },
        {
          status: 400,
        }
      );
    }

    const conversation = messages
      .map(
        (message: any) =>
          `${message.role}: ${message.content}`
      )
      .join("\n");

    /*
     * --------------------------------------------
     * NORMAL CONVERSATION
     * --------------------------------------------
     */

    if (!isFinal) {
      const prompt = `
${PROMPT}

Conversation:

${conversation}
`;

      console.log(
        "========== OLLAMA REQUEST =========="
      );
      console.log("Model:", MODEL);
      console.log("isFinal:", false);

      const content = await generateWithOllama(
        prompt
      );

      console.log(
        "========== OLLAMA RESPONSE =========="
      );
      console.log(content);

      const cleaned = cleanJson(content);

      try {
        const parsed = JSON.parse(cleaned);

        console.log(
          "========== PARSED JSON =========="
        );
        console.log(parsed);

        return NextResponse.json(parsed);
      } catch (error) {
        console.error(
          "========== JSON PARSE ERROR =========="
        );
        console.error(error);
        console.error("RAW RESPONSE:");
        console.error(cleaned);

        return NextResponse.json(
          {
            error: "Ollama returned invalid JSON.",
            raw: cleaned,
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * --------------------------------------------
     * FINAL TRIP GENERATION
     * --------------------------------------------
     */

    const requestedDays =
      extractRequestedDays(conversation);

    console.log(
      "========== FINAL TRIP GENERATION =========="
    );
    console.log("Requested days:", requestedDays);
    console.log("Conversation:");
    console.log(conversation);

    /*
     * Add the exact number of days directly into
     * the prompt so the model cannot miss it.
     */
    const durationInstruction =
      requestedDays !== null
        ? `
ABSOLUTE REQUIREMENT:

The user requested EXACTLY ${requestedDays} day${
            requestedDays === 1 ? "" : "s"
          }.

Therefore:

- itinerary MUST contain exactly ${requestedDays} objects.
- Day 1 MUST exist.
${
  requestedDays >= 2
    ? `- Day 2 MUST exist.
`
    : ""
}${
  requestedDays >= 3
    ? `- Day 3 MUST exist.
`
    : ""
}${
  requestedDays >= 4
    ? `- Days 4 through ${requestedDays} MUST also exist.
`
    : ""
}
- There must be NO missing days.
- There must be NO extra days.
- Day numbers MUST be exactly:
  ${Array.from(
    { length: requestedDays },
    (_, index) => index + 1
  ).join(", ")}.
- Each day MUST contain its own day_plan.
- Each day MUST contain useful activities.
- The duration field MUST say ${requestedDays} Days.
`
        : `
Use the trip duration provided in the conversation.
Generate one itinerary object for every requested day.
`;

    const prompt = `
${FINAL_PROMPT}

${durationInstruction}

Conversation:

${conversation}
`;

    console.log(
      "========== OLLAMA REQUEST =========="
    );
    console.log("Model:", MODEL);
    console.log("isFinal:", true);
    console.log(
      "Requested itinerary days:",
      requestedDays
    );

    /*
     * First generation.
     */
    let content = await generateWithOllama(
      prompt
    );

    console.log(
      "========== FIRST FINAL RESPONSE =========="
    );
    console.log(content);

    let cleaned = cleanJson(content);
    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      console.error(
        "========== FIRST JSON PARSE ERROR =========="
      );
      console.error(error);
      console.error(cleaned);

      /*
       * Give Ollama one clean retry if it produced
       * invalid JSON.
       */
      const retryPrompt = `
Generate the trip again.

Return ONLY valid JSON.

Do not include markdown.
Do not include explanations.

${durationInstruction}

Conversation:

${conversation}

The previous response was invalid JSON.
Generate the complete corrected JSON now.
`;

      content = await generateWithOllama(
        retryPrompt
      );

      cleaned = cleanJson(content);
      parsed = JSON.parse(cleaned);
    }

    /*
     * --------------------------------------------
     * CHECK NUMBER OF DAYS
     * --------------------------------------------
     */

    if (
      !validateItinerary(
        parsed,
        requestedDays
      )
    ) {
      console.warn(
        "========== WRONG ITINERARY LENGTH =========="
      );

      console.warn(
        "Requested days:",
        requestedDays
      );

      console.warn(
        "Returned itinerary:",
        parsed?.trip_plan?.itinerary?.length
      );

      /*
       * Ollama sometimes ignores the number of days.
       *
       * Ask it again with an extremely explicit
       * correction instruction.
       */
      const correctionPrompt = `
You previously generated an incorrect itinerary.

FIX IT.

The user requested EXACTLY ${
        requestedDays ?? "the requested"
      } days.

You MUST return exactly ${
        requestedDays ?? "the requested"
      } itinerary objects.

${
  requestedDays !== null
    ? `
Required day numbers:

${Array.from(
  { length: requestedDays },
  (_, index) => `Day ${index + 1}`
).join("\n")}

The final itinerary MUST have:

${Array.from(
  { length: requestedDays },
  (_, index) => `itinerary[${index}].day = ${index + 1}`
).join("\n")}
`
    : ""
}

DO NOT return fewer days.

DO NOT return extra days.

Every day needs:
- day
- day_plan
- best_time_to_visit_day
- activities

Every activity needs:
- place_name
- place_details
- place_image_url
- geo_coordinates
- place_address
- ticket_pricing
- time_travel_each_location
- best_time_to_visit

Return the complete trip object again.

Return ONLY valid JSON.
No markdown.
No code fences.
No explanation.

Original conversation:

${conversation}
`;

      content = await generateWithOllama(
        correctionPrompt
      );

      console.log(
        "========== CORRECTED FINAL RESPONSE =========="
      );
      console.log(content);

      cleaned = cleanJson(content);

      try {
        parsed = JSON.parse(cleaned);
      } catch (error) {
        console.error(
          "========== CORRECTED JSON PARSE ERROR =========="
        );
        console.error(error);
        console.error(cleaned);

        return NextResponse.json(
          {
            error:
              "Ollama returned invalid JSON after correction.",
            raw: cleaned,
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * --------------------------------------------
     * FINAL VALIDATION
     * --------------------------------------------
     */

    if (
      !validateItinerary(
        parsed,
        requestedDays
      )
    ) {
      console.error(
        "========== ITINERARY VALIDATION FAILED =========="
      );

      console.error(
        "Requested days:",
        requestedDays
      );

      console.error(
        "Returned days:",
        parsed?.trip_plan?.itinerary?.length
      );

      return NextResponse.json(
        {
          error:
            requestedDays !== null
              ? `The AI could not generate exactly ${requestedDays} itinerary days. Please try generating the trip again.`
              : "The AI generated an invalid itinerary.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Make sure the returned day numbers are clean
     * and sequential.
     */
    if (
      requestedDays !== null &&
      parsed?.trip_plan?.itinerary
    ) {
      parsed.trip_plan.itinerary =
        parsed.trip_plan.itinerary.map(
          (day: any, index: number) => ({
            ...day,
            day: index + 1,
          })
        );

      /*
       * Also make sure duration displayed in the
       * final trip matches the user's selection.
       */
      parsed.trip_plan.duration =
        `${requestedDays} ${
          requestedDays === 1
            ? "Day"
            : "Days"
        }`;
    }

    console.log(
      "========== FINAL VALIDATED TRIP =========="
    );
    console.log(
      "Requested days:",
      requestedDays
    );
    console.log(
      "Generated days:",
      parsed?.trip_plan?.itinerary?.length
    );
    console.log(
      JSON.stringify(parsed, null, 2)
    );

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(
      "========== OLLAMA SERVER ERROR =========="
    );
    console.error(error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not connect to Ollama. Make sure Ollama is running.",
      },
      {
        status: 500,
      }
    );
  }
}