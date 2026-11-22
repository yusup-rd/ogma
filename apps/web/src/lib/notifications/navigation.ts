"use client";

import { toast } from "sonner";

const arrivalKey = "ogma-arrival-notification";

export function notifyAfterNavigation(message: string) {
  try {
    sessionStorage.setItem(
      arrivalKey,
      JSON.stringify({ message, createdAt: Date.now() }),
    );
  } catch {
    toast.success(message);
  }
}

export function takeArrivalNotification() {
  try {
    const stored = sessionStorage.getItem(arrivalKey);
    sessionStorage.removeItem(arrivalKey);
    if (!stored) return;
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof value.message === "string" &&
      "createdAt" in value &&
      typeof value.createdAt === "number" &&
      Date.now() - value.createdAt < 30_000
    )
      return value.message;
  } catch {
    return;
  }
}
