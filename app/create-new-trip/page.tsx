"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";

import Chatbox from "./_components/Chatbox";
import { api } from "@/convex/_generated/api";

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

function CreateNewTrip() {
  const router = useRouter();
  const { user } = useUser();

  const saveTrip = useMutation(api.trip.saveTrip);

  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);

  const handleTripGenerated = async (trip: TripPlan) => {
    if (!user?.id) {
      throw new Error("You must be signed in to save a trip.");
    }

    setSavingTrip(true);
    setTripPlan(null);
    setTripId(null);

    try {
      console.log("========== SAVING TRIP ==========");
      console.log(trip);

      const savedTripId = await saveTrip({
        userId: user.id,
        tripPlan: trip,
      });

      console.log("========== TRIP SAVED ==========");
      console.log(savedTripId);

      setTripPlan(trip);
      setTripId(savedTripId);
    } catch (error) {
      console.error("========== SAVE TRIP ERROR ==========");
      console.error(error);

      throw error;
    } finally {
      setSavingTrip(false);
    }
  };

  const handleViewTrip = () => {
    if (!tripId) {
      return;
    }

    router.push(`/view-trip/${tripId}`);
  };

  return (
    <div className="grid h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-2">
      {/* Chat Section */}
      <div className="h-full border-r bg-white">
        <Chatbox
          onTripGenerated={handleTripGenerated}
          onViewTrip={handleViewTrip}
          isSavingTrip={savingTrip}
        />
      </div>

      {/* Trip Plan Section */}
      <div className="h-full overflow-y-auto bg-slate-50">
        {!tripPlan ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">
                Map & Trip Plan
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {savingTrip
                  ? "Saving your trip..."
                  : "Your itinerary will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Trip Header */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">
                Your Personalized Trip
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-800">
                {tripPlan.destination}
              </h1>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">From</p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {tripPlan.origin}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Duration</p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {tripPlan.duration}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Travellers</p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {tripPlan.group_size}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Budget</p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {tripPlan.budget}
                  </p>
                </div>
              </div>
            </div>

            {/* Hotels */}
            {tripPlan.hotels && tripPlan.hotels.length > 0 && (
              <section className="mt-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Recommended Hotels
                </h2>

                <div className="mt-3 space-y-4">
                  {tripPlan.hotels.map((hotel, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm"
                    >
                      {hotel.hotel_image_url && (
                        <img
                          src={hotel.hotel_image_url}
                          alt={hotel.hotel_name}
                          className="h-44 w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">
                              {hotel.hotel_name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {hotel.hotel_address}
                            </p>
                          </div>

                          <div className="rounded-lg bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-700">
                            ⭐ {hotel.rating}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {hotel.description}
                        </p>

                        <p className="mt-3 font-semibold text-slate-800">
                          {hotel.price_per_night}
                          {" / night"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Itinerary */}
            {tripPlan.itinerary && tripPlan.itinerary.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-800">
                  Day-by-Day Itinerary
                </h2>

                <div className="mt-4 space-y-5">
                  {tripPlan.itinerary.map((day, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-emerald-700">
                          Day {day.day}
                        </h3>

                        <span className="text-xs font-medium text-slate-500">
                          {day.best_time_to_visit_day}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {day.day_plan}
                      </p>

                      {day.activities && day.activities.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {day.activities.map(
                            (activity, activityIndex) => (
                              <div
                                key={activityIndex}
                                className="overflow-hidden rounded-xl border border-slate-100"
                              >
                                {activity.place_image_url && (
                                  <img
                                    src={activity.place_image_url}
                                    alt={activity.place_name}
                                    className="h-36 w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                )}

                                <div className="p-4">
                                  <h4 className="font-semibold text-slate-800">
                                    {activity.place_name}
                                  </h4>

                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {activity.place_details}
                                  </p>

                                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500">
                                    <p>
                                      📍 {activity.place_address}
                                    </p>

                                    <p>
                                      🎟️ {activity.ticket_pricing}
                                    </p>

                                    <p>
                                      🕐 Best time:{" "}
                                      {activity.best_time_to_visit}
                                    </p>

                                    <p>
                                      🚗 Travel:{" "}
                                      {activity.time_travel_each_location}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Saved Status */}
            {tripId && (
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                <p className="text-sm font-medium text-emerald-700">
                  ✓ Trip saved successfully
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateNewTrip;