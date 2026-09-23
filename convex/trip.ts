import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveTrip = mutation({
  args: {
    userId: v.string(),
    tripPlan: v.any(),
  },

  handler: async (ctx, args) => {
    const tripId = await ctx.db.insert("TripTable", {
      userId: args.userId,
      tripPlan: args.tripPlan,
    });

    return tripId;
  },
});

export const getTrip = query({
  args: {
    tripId: v.id("TripTable"),
    userId: v.string(),
  },

  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);

    if (!trip) {
      return null;
    }

    // Only return trips belonging to this user.
    if (trip.userId !== args.userId) {
      return null;
    }

    return trip;
  },
});

export const getUserTrips = query({
  args: {
    userId: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("TripTable")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});