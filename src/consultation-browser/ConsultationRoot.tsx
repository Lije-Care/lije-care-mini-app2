import { useCallback, useState } from "react";
import { ConsultationApiError } from "./api";
import { ConsultationError } from "./ConsultationError";
import { ConsultationPage, isBrowserCompatible } from "./ConsultationPage";
import { HandoffRedeemer } from "./HandoffRedeemer";
import type { ConsultationErrorCode } from "./state";

type Stage = "redeeming" | "ready" | "error";

export const ConsultationRoot = ({ code }: { code: string | null }) => {
  const [stage, setStage] = useState<Stage>(code ? "redeeming" : "ready");
  const [errorCode, setErrorCode] =
    useState<ConsultationErrorCode>("UNKNOWN");

  const fail = useCallback((error: unknown) => {
    setErrorCode(
      error instanceof ConsultationApiError
        ? (error.code as ConsultationErrorCode)
        : "UNKNOWN",
    );
    setStage("error");
  }, []);

  const loaded = useCallback(() => {
    if (!isBrowserCompatible()) {
      setErrorCode("BROWSER_UNSUPPORTED");
      setStage("error");
      return;
    }
    setStage("ready");
  }, []);

  if (stage === "redeeming" && code) {
    return (
      <HandoffRedeemer
        code={code}
        onRedeemed={loaded}
        onError={fail}
      />
    );
  }
  if (stage === "ready") return <ConsultationPage />;
  return <ConsultationError code={errorCode} />;
};
