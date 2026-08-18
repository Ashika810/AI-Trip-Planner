import { suggestions } from "@/app/_components/Hero";
import React from "react";

type EmptyBoxStateProps = {
  onSelectOption: (value: string) => void;
};

function EmptyBoxState({ onSelectOption }: EmptyBoxStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10">
      {/* Heading */}
      <h1 className="max-w-3xl text-center text-4xl font-bold leading-tight md:text-5xl">
        Start Planning new{" "}
        <span className="text-primary">Trip</span> using AI
      </h1>

      {/* Description */}
      <p className="mt-5 max-w-2xl text-center text-gray-500 leading-7">
        Discover personalized travel itineraries, find the best destinations,
        and plan your dream vacation effortlessly with the power of AI. Let our
        smart assistant do the hard work while you enjoy the journey.
      </p>

      {/* Suggestion Cards */}
      <div className="mt-10 flex w-full max-w-3xl flex-col gap-4">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectOption(suggestion.title)}
            className="flex h-14 items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 text-left transition-all duration-200 hover:border-primary hover:bg-primary/5"
          >
            <div className="text-xl">{suggestion.icon}</div>

            <span className="text-base font-medium text-gray-800">
              {suggestion.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyBoxState;