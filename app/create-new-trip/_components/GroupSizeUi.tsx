"use client";

import React, { useState } from "react";

type GroupSizeUiProps = {
  onSelectedOption: (value: string) => void;
};

export const SelectTravelesList = [
  {
    id: 1,
    title: "Just Me",
    desc: "Solo Traveler",
    icon: "✈️",
    people: "1 Person",
  },
  {
    id: 2,
    title: "Couple",
    desc: "Two Travelers",
    icon: "🥂",
    people: "2 People",
  },
  {
    id: 3,
    title: "Family",
    desc: "Family Trip",
    icon: "🏡",
    people: "3-5 People",
  },
  {
    id: 4,
    title: "Friends",
    desc: "Group Adventure",
    icon: "⛵",
    people: "5-10 People",
  },
];

function GroupSizeUi({ onSelectedOption }: GroupSizeUiProps) {
  const [selected, setSelected] = useState("");

  const handleSelect = (title: string, people: string) => {
    setSelected(title);
    onSelectedOption(`${title}:${people}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {SelectTravelesList.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item.title, item.people)}
          className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:border-primary hover:shadow-md
          ${
            selected === item.title
              ? "border-primary bg-primary/5"
              : "bg-white"
          }`}
        >
          <div className="text-3xl">{item.icon}</div>

          <h2 className="mt-2 text-sm font-semibold">
            {item.title}
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            {item.desc}
          </p>

          <p className="mt-3 text-xs font-medium text-primary">
            {item.people}
          </p>
        </div>
      ))}
    </div>
  );
}

export default GroupSizeUi;