"use client";

export function DateDisplay() {
  return (
    <>
      {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
    </>
  );
}
