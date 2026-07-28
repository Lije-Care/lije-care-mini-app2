import { useEffect, useRef } from "react";
import { loadConsultationSession } from "./api";
import type { ConsultationSession } from "./state";
import { ConsultationStatus } from "./ConsultationStatus";

type Props = {
  onLoaded: (session: ConsultationSession) => void;
  onError: (error: unknown) => void;
};

export const SessionLoader = ({ onLoaded, onError }: Props) => {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void loadConsultationSession().then(onLoaded).catch(onError);
  }, [onError, onLoaded]);

  return <ConsultationStatus text="Loading your appointment…" />;
};
