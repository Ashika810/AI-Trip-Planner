"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import TripMap from "@/app/view-trip/_components/TripMap";

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
    hotel_image_url?: string;

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
      place_image_url?: string;

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

export default function ViewTripPage() {
  const router = useRouter();
  const params = useParams();

  const { user, isLoaded } = useUser();

  const tripID = params.tripID as string;

  const trip = useQuery(
    api.trip.getTrip,
    isLoaded && user?.id && tripID
      ? {
          tripId: tripID as Id<"TripTable">,
          userId: user.id,
        }
      : "skip"
  );

  if (!isLoaded || trip === undefined) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your trip...
          </p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">
            Trip not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            We couldn't find this saved trip.
          </p>

          <button
            type="button"
            onClick={() => router.push("/my-trips")}
            className="mt-6 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  const tripPlan = trip.tripPlan as TripPlan;

  /*
   * Build map locations from all itinerary activities.
   */
  const mapLocations =
    tripPlan.itinerary?.flatMap((day) =>
      (day.activities ?? [])
        .filter(
          (activity) =>
            activity.geo_coordinates &&
            Number.isFinite(
              activity.geo_coordinates.latitude
            ) &&
            Number.isFinite(
              activity.geo_coordinates.longitude
            )
        )
        .map((activity) => ({
          name: activity.place_name,
          description: activity.place_details,
          address: activity.place_address,
          latitude:
            activity.geo_coordinates!.latitude,
          longitude:
            activity.geo_coordinates!.longitude,
          bestTime: activity.best_time_to_visit,
          ticketPrice: activity.ticket_pricing,
        }))
    ) ?? [];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/my-trips")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to My Trips
        </button>

        {/* Trip Header */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Your Personalized Trip
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {tripPlan.destination}
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                From
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {tripPlan.origin}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Duration
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {tripPlan.duration}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Travellers
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {tripPlan.group_size}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Budget
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {tripPlan.budget}
              </p>
            </div>
          </div>
        </section>

        {/* Map */}
        {mapLocations.length > 0 && (
          <section className="mt-8">
            <TripMap locations={mapLocations} />
          </section>
        )}

        {/* Hotels */}
        {tripPlan.hotels &&
          tripPlan.hotels.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-slate-900">
                Recommended Hotels
              </h2>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {tripPlan.hotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    {hotel.hotel_image_url && (
                      <img
                        src={hotel.hotel_image_url}
                        alt={hotel.hotel_name}
                        className="h-48 w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {hotel.hotel_name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {hotel.hotel_address}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-700">
                          ⭐ {hotel.rating}
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {hotel.description}
                      </p>

                      <p className="mt-4 font-semibold text-slate-900">
                        {hotel.price_per_night} / night
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Itinerary */}
        {tripPlan.itinerary &&
          tripPlan.itinerary.length > 0 && (
            <section className="mt-8 pb-10">
              <h2 className="text-xl font-bold text-slate-900">
                Day-by-Day Itinerary
              </h2>

              <div className="mt-4 space-y-5">
                {tripPlan.itinerary.map((day, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
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

                    {day.activities &&
                      day.activities.length > 0 && (
                        <div className="mt-5 space-y-4">
                          {day.activities.map(
                            (
                              activity,
                              activityIndex
                            ) => (
                              <div
                                key={activityIndex}
                                className="overflow-hidden rounded-xl border border-slate-100"
                              >
                                {activity.place_image_url && (
                                  <img
                                    src={
                                      activity.place_image_url
                                    }
                                    alt={
                                      activity.place_name
                                    }
                                    className="h-40 w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                )}

                                <div className="p-4">
                                  <h4 className="font-semibold text-slate-900">
                                    {
                                      activity.place_name
                                    }
                                  </h4>

                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {
                                      activity.place_details
                                    }
                                  </p>

                                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                                    <p>
                                      📍{" "}
                                      {
                                        activity.place_address
                                      }
                                    </p>

                                    <p>
                                      🎟️{" "}
                                      {
                                        activity.ticket_pricing
                                      }
                                    </p>

                                    <p>
                                      🕐 Best time:{" "}
                                      {
                                        activity.best_time_to_visit
                                      }
                                    </p>

                                    <p>
                                      🚗 Travel:{" "}
                                      {
                                        activity.time_travel_each_location
                                      }
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

        {/* Bottom Action */}
        <div className="pb-10 text-center">
          <button
            type="button"
            onClick={() =>
              router.push("/create-new-trip")
            }
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Plan Another Trip
          </button>
        </div>
      </div>
    </div>
  );
}