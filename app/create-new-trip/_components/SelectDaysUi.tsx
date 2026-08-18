"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

type SelectDaysUiProps = {
  onSelectedOption: (value: string) => void;
};

function SelectDaysUi({ onSelectedOption }: SelectDaysUiProps) {
  const [days, setDays] = useState(3);

  const increaseDays = () => {
    if (days < 30) {
      setDays((prev) => prev + 1);
    }
  };

  const decreaseDays = () => {
    if (days > 1) {
      setDays((prev) => prev - 1);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-center text-lg font-semibold">
        How many days do you want to travel?
      </h2>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          onClick={decreaseDays}
          className="flex h-12 w-12 items-center justify-center rounded-full border transition hover:bg-gray-100"
        >
          <Minus className="h-5 w-5" />
        </button>

        <h2 className="min-w-24 text-center text-4xl font-bold">
          {days} {days === 1 ? "Day" : "Days"}
        </h2>

        <button
          onClick={increaseDays}
          className="flex h-12 w-12 items-center justify-center rounded-full border transition hover:bg-gray-100"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={() => onSelectedOption(`${days} Days`)}
          className="px-8"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default SelectDaysUi;