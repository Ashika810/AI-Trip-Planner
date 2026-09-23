"use client";

import React from "react";
import Link from "next/link";
import { MapPin, CalendarDays, Users, Wallet } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

type TripPlan = {
  destination?: string;
  origin?: string;
  duration?: string;
  budget?: string;
  group_size?: string;

  hotels?: {
    hotel_name?: string;
  }[];

  itinerary?: {
    day?: number;
  }[];
};

export default function MyTripsPage() {
  const { user, isLoaded } = useUser();

  const trips = useQuery(
    api.trip.getUserTrips,
    isLoaded && user?.id
      ? {
          userId: user.id,
        }
      : "skip"
  );

  /*
   * Clerk is still loading
   */
  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your trips...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * User isn't signed in
   */
  if (!user) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
        <div className="mx-auto flex min-h-[400px] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Sign in to view your trips
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Your saved trips will appear here after you sign in.
            </p>

            <Link
              href="/sign-in"
              className="mt-6 inline-flex rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Convex is loading
   */
  if (trips === undefined) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your saved trips...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-emerald-700">
            Your Travel Collection
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Trips
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View and manage all your saved travel plans.
          </p>
        </div>

        {/* No Trips */}
        {trips.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <MapPin className="h-8 w-8 text-emerald-700" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No trips yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You haven't saved any trips yet. Create your first
              personalized travel plan and it will appear here.
            </p>

            <Link
              href="/create-new-trip"
              className="mt-6 inline-flex rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Create New Trip
            </Link>
          </div>
        ) : (
          /* Trip Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const tripPlan = trip.tripPlan as TripPlan;

              return (
                <div
                  key={trip._id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Card Top */}
                  <div className="bg-emerald-700 p-6 text-white">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">
                      Saved Trip
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      {tripPlan.destination || "Unknown Destination"}
                    </h2>

                    {tripPlan.origin && (
                      <p className="mt-1 text-sm text-emerald-100">
                        From {tripPlan.origin}
                      </p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="space-y-3">
                      {tripPlan.duration && (
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <CalendarDays className="h-4 w-4 text-emerald-700" />

                          <span>
                            {tripPlan.duration}
                          </span>
                        </div>
                      )}

                      {tripPlan.group_size && (
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Users className="h-4 w-4 text-emerald-700" />

                          <span>
                            {tripPlan.group_size}
                          </span>
                        </div>
                      )}

                      {tripPlan.budget && (
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Wallet className="h-4 w-4 text-emerald-700" />

                          <span>
                            {tripPlan.budget}
                          </span>
                        </div>
                      )}

                      {tripPlan.itinerary &&
                        tripPlan.itinerary.length > 0 && (
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-emerald-700" />

                            <span>
                              {tripPlan.itinerary.length}{" "}
                              {tripPlan.itinerary.length === 1
                                ? "day"
                                : "days"}{" "}
                              itinerary
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Hotel */}
                    {tripPlan.hotels &&
                      tripPlan.hotels.length > 0 &&
                      tripPlan.hotels[0]?.hotel_name && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Recommended hotel
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {tripPlan.hotels[0].hotel_name}
                          </p>
                        </div>
                      )}

                    {/* View Trip */}
                    <Link
                      href={`/view-trip/${trip._id}`}
                      className="mt-6 block rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      View Trip
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}