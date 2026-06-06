import type { Booking } from "@/types/booking";
import type { AvailabilitySlot } from "@/types/specialist";

export const DEFAULT_CONSULTATION_TIME_ZONE = "Africa/Addis_Ababa";

const getSlotDateKey = (slotDate: string) => slotDate.split("T")[0];

const getNowInTimeZone = (timeZone = DEFAULT_CONSULTATION_TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    dateKey: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    minutes: Number(getPart("hour")) * 60 + Number(getPart("minute")),
    seconds: Number(getPart("second")),
  };
};

const toMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
};

export const isFutureConsultationSlot = (
  slot: Pick<AvailabilitySlot, "date" | "startTime">,
  timeZone = DEFAULT_CONSULTATION_TIME_ZONE,
) => {
  const now = getNowInTimeZone(timeZone);
  const slotDateKey = getSlotDateKey(slot.date);
  const slotStartMinutes = toMinutes(slot.startTime);

  if (slotDateKey > now.dateKey) return true;
  if (slotDateKey < now.dateKey) return false;
  return slotStartMinutes > now.minutes;
};

export const compareConsultationSlots = (
  left: Pick<AvailabilitySlot, "date" | "startTime">,
  right: Pick<AvailabilitySlot, "date" | "startTime">,
) => {
  const leftDateKey = getSlotDateKey(left.date);
  const rightDateKey = getSlotDateKey(right.date);

  if (leftDateKey !== rightDateKey) {
    return leftDateKey.localeCompare(rightDateKey);
  }

  return toMinutes(left.startTime) - toMinutes(right.startTime);
};

export const getConsultationSlotWindowState = (
  slot: Pick<Booking["slot"], "date" | "startTime" | "endTime">,
  timeZone = DEFAULT_CONSULTATION_TIME_ZONE,
) => {
  try {
    const now = getNowInTimeZone(timeZone);
    const slotDateKey = getSlotDateKey(slot.date);
    const startMinutes = toMinutes(slot.startTime);
    const endMinutes = toMinutes(slot.endTime);

    if (slotDateKey > now.dateKey) return "upcoming" as const;
    if (slotDateKey < now.dateKey) return "ended" as const;
    if (now.minutes < startMinutes) return "upcoming" as const;
    if (now.minutes > endMinutes) return "ended" as const;
    if (now.minutes === endMinutes && now.seconds > 0) return "ended" as const;
    return "active" as const;
  } catch {
    return "unknown" as const;
  }
};

export const getBookingSessionWindowState = (
  booking: Pick<Booking, "slot" | "consultationTimeZone" | "sessionWindowState">,
) => {
  if (booking.sessionWindowState && booking.sessionWindowState !== "unknown") {
    return booking.sessionWindowState;
  }

  return getConsultationSlotWindowState(
    booking.slot,
    booking.consultationTimeZone || DEFAULT_CONSULTATION_TIME_ZONE,
  );
};

export const getConsultationSlotRemainingMs = (
  slot: Pick<Booking["slot"], "date" | "startTime" | "endTime">,
  timeZone = DEFAULT_CONSULTATION_TIME_ZONE,
) => {
  const state = getConsultationSlotWindowState(slot, timeZone);
  if (state !== "active") return 0;

  const now = getNowInTimeZone(timeZone);
  const endMinutes = toMinutes(slot.endTime);
  const remainingMinutes = endMinutes - now.minutes;
  const remainingSeconds = 60 - now.seconds;

  return Math.max(0, remainingMinutes * 60_000 + remainingSeconds * 1_000);
};
