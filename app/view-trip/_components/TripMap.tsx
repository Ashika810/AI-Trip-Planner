"use client";

import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

type MapLocation = {
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  bestTime?: string;
  ticketPrice?: string;
};

type TripMapProps = {
  locations: MapLocation[];
};

function TripMap({ locations }: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const validLocations = locations.filter(
    (location) =>
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapContainerRef.current || validLocations.length === 0) {
        return;
      }

      // Load Leaflet only in the browser.
      const leafletModule = await import("leaflet");

      if (cancelled || !mapContainerRef.current) {
        return;
      }

      const L = leafletModule.default;

      // Remove any previous map instance.
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const firstLocation = validLocations[0];

      const map = L.map(mapContainerRef.current).setView(
        [firstLocation.latitude, firstLocation.longitude],
        12
      );

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      ).addTo(map);

      const bounds = L.latLngBounds([]);

      const routeCoordinates: [number, number][] = [];

      validLocations.forEach((location) => {
        const coordinates: [number, number] = [
          location.latitude,
          location.longitude,
        ];

        routeCoordinates.push(coordinates);

        bounds.extend(coordinates);

        const marker = L.circleMarker(coordinates, {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: "#047857",
          fillOpacity: 1,
        }).addTo(map);

        const popup = `
          <div style="min-width:220px;">
            <h3 style="font-size:16px;font-weight:700;margin:0 0 8px;">
              ${location.name}
            </h3>

            ${
              location.description
                ? `<p style="font-size:13px;color:#475569;margin:0 0 8px;">
                    ${location.description}
                  </p>`
                : ""
            }

            ${
              location.address
                ? `<p style="font-size:12px;color:#64748b;margin:4px 0;">
                    📍 ${location.address}
                  </p>`
                : ""
            }

            ${
              location.ticketPrice
                ? `<p style="font-size:12px;color:#64748b;margin:4px 0;">
                    🎟️ ${location.ticketPrice}
                  </p>`
                : ""
            }

            ${
              location.bestTime
                ? `<p style="font-size:12px;color:#64748b;margin:4px 0;">
                    🕐 ${location.bestTime}
                  </p>`
                : ""
            }
          </div>
        `;

        marker.bindPopup(popup);
      });

      if (routeCoordinates.length > 1) {
        L.polyline(routeCoordinates, {
          color: "#047857",
          weight: 4,
          opacity: 0.7,
        }).addTo(map);
      }

      if (validLocations.length > 1) {
        map.fitBounds(bounds, {
          padding: [40, 40],
        });
      }

      setTimeout(() => {
        if (!cancelled && mapRef.current) {
          map.invalidateSize();
        }
      }, 100);
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations]);

  if (validLocations.length === 0) {
    return (
      <div className="flex h-[450px] items-center justify-center rounded-2xl bg-slate-100">
        <div className="text-center">
          <p className="font-semibold text-slate-700">
            Map locations unavailable
          </p>

          <p className="mt-1 text-sm text-slate-500">
            No valid coordinates were provided for this trip.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-xl font-bold text-slate-900">
          Trip Map
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Explore the locations included in your itinerary.
        </p>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[450px] w-full"
      />
    </div>
  );
}

export default TripMap;