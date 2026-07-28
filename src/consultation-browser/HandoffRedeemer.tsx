import { useEffect, useRef } from "react";
import { redeemHandoff } from "./api";
import { ConsultationStatus } from "./ConsultationStatus";

type Props = {
  code: string;
  onRedeemed: () => void;
  onError: (error: unknown) => void;
};

export const HandoffRedeemer = ({ code, onRedeemed, onError }: Props) => {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void redeemHandoff(code).then(onRedeemed).catch(onError);
  }, [code, onError, onRedeemed]);

  return <ConsultationStatus text="Securing your consultation…" />;
};
