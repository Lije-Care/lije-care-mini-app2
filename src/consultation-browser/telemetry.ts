type TelemetryFields = Record<string, string | number | boolean | undefined>;

const correlationId =
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `consultation-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const consultationTelemetry = (
  event: string,
  fields: TelemetryFields = {},
) => {
  console.info(
    JSON.stringify({
      scope: "browser_consultation",
      event,
      correlationId,
      occurredAt: new Date().toISOString(),
      ...fields,
    }),
  );
};
