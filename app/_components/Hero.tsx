"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowDown, Globe2, Landmark, Plane, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { Textarea } from "@/components/ui/textarea";

export const suggestions = [
  {
    title: "Create New Trip",
    icon: <Globe2 className="text-blue-400 h-5 w-5" />,
  },
  {
    title: "Inspire me where to go",
    icon: <Plane className="text-green-400 h-5 w-5" />,
  },
  {
    title: "Discover Hidden gems",
    icon: <Landmark className="text-orange-400 h-5 w-5" />,
  },
  {
    title: "Adventure Destinations",
    icon: <Globe2 className="text-yellow-400 h-5 w-5" />,
  },
];

function Hero() {
  const { user } = useUser();
  const router = useRouter();

  const onSend = () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    // navigate to create trip planner web page
    router.push("/create-new-trip");
  };

  return (
    <div className="mt-24 w-full flex justify-center">
      {/* Content */}
      <div className="max-w-3xl w-full text-center space-y-4 items-center flex flex-col">
        <h1 className="text-xl md:text-5xl font-bold">
          Hey, I'm your Personal{" "}
          <span className="text-primary">Trip Planner</span>
        </h1>

        <p className="text-lg">
          Tell me what you want, and I'll handle the rest: Flights, Hotels,
          Trip - all in seconds
        </p>

        {/* Input Box */}
        <div className="w-full">
          <div className="border rounded-2xl p-4 relative w-full">
            <Textarea
              placeholder="Create a trip from Paris to New York"
              className="w-full h-28 bg-transparent border-none focus-visible:ring-0 shadow-none resize-none"
            />

            <Button
              size="icon"
              className="absolute bottom-6 right-6"
              onClick={onSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Suggestion List */}
        <div className="flex gap-5 flex-wrap justify-center">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center gap-x-2 border p-4 rounded-lg mt-4 text-sm md:text-base cursor-pointer hover:bg-primary hover:text-white"
            >
              {suggestion.icon}
              <h2 className="text-sm">{suggestion.title}</h2>
            </div>
          ))}
        </div>

        <h2 className="my-7 mt-14 flex gap-2 text-center">
          Not Sure where to start?
          <strong>See how it works</strong>
          <ArrowDown />
        </h2>

        {/* Video Section */}
        <HeroVideoDialog
          className="block dark:hidden"
          animationStyle="from-center"
          videoSrc="https://www.example.com/dummy-video"
          thumbnailSrc="/thumbnail.svg"
          thumbnailAlt="Dummy Video Thumbnail"
        />
      </div>
    </div>
  );
}

export default Hero;