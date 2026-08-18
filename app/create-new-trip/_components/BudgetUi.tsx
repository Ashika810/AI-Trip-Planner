"use client";

import React, { useState } from "react";

type BudgetUiProps = {
  onSelectedOption: (value: string) => void;
};

export const SelectBudgetOptions = [
  {
    id: 1,
    title: "Cheap",
    desc: "Save money and travel smart",
    icon: "💵",
  },
  {
    id: 2,
    title: "Moderate",
    desc: "Balance comfort and budget",
    icon: "💰",
  },
  {
    id: 3,
    title: "Luxury",
    desc: "Premium travel experience",
    icon: "💸",
  },
];

function BudgetUi({ onSelectedOption }: BudgetUiProps) {
  const [selected, setSelected] = useState("");

  const handleSelect = (title: string) => {
    setSelected(title);
    onSelectedOption(title);
  };

  return (
    <div className="grid grid-cols-3 gap-3 mt-3">
      {SelectBudgetOptions.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item.title)}
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

          <p className="mt-1 text-xs text-gray-500 leading-5">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default BudgetUi;