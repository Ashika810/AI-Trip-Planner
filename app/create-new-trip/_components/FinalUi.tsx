import React from "react";
import { Globe2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type FinalUiProps = {
  isLoading?: boolean;
  viewTrip?: () => void;
};

function FinalUi({
  isLoading = false,
  viewTrip,
}: FinalUiProps) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border bg-white p-6 shadow-sm">
      <Globe2
        className={`text-primary ${
          isLoading ? "animate-bounce" : ""
        }`}
        size={40}
      />

      <h2 className="mt-3 text-lg font-semibold text-primary">
        {isLoading
          ? "✈️ Planning your dream trip..."
          : "🎉 Your trip is ready!"}
      </h2>

      <p className="mt-1 text-center text-sm text-gray-500">
        {isLoading
          ? "Gathering best destinations, activities, and travel details for you."
          : "Your personalized trip plan has been generated successfully."}
      </p>

      <Button
        disabled={isLoading}
        onClick={viewTrip}
        className="mt-4 w-full"
      >
        {isLoading ? "Generating Trip..." : "View Trip"}
      </Button>
    </div>
  );
}

export default FinalUi;