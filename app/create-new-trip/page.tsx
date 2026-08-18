import React from "react";
import Chatbox from "./_components/Chatbox";

function CreateNewTrip() {
  return (
    <div className="grid h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-2">
      {/* Chat Section */}
      <div className="h-full border-r bg-white">
        <Chatbox />
      </div>

      {/* Map Section */}
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700">
            Map & Trip Plan
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your itinerary will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateNewTrip;