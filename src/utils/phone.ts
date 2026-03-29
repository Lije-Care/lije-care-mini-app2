export const normalizePhoneNumber = (
  value?: string | null
): string | undefined => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return undefined;

  return `+${digits}`;
};
