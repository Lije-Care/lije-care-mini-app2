import React from "react";
import ReactDOM from "react-dom/client";
import { HMSRoomProvider } from "@100mslive/react-sdk";
import { ConsultationRoot } from "./ConsultationRoot";
import { captureAndCleanHandoffCode } from "./url";
import "./styles.css";

const code = captureAndCleanHandoffCode(window.location.href, (cleanUrl) => {
  window.history.replaceState(null, "", cleanUrl);
});

ReactDOM.createRoot(
  document.getElementById("consultation-root") as HTMLElement,
).render(
  <React.StrictMode>
    <HMSRoomProvider>
      <ConsultationRoot code={code} />
    </HMSRoomProvider>
  </React.StrictMode>,
);
