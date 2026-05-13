// import JoinForm from "./JoinForm";
import "./styles.css";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HMSRoomState,
  selectIsConnectedToRoom,
  selectRoomState,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import Header from "./Header";
import Conference from "./Conference";
import Footer from "./Footer";
import { Loader } from "./Loader";
import { APP_BACK_INTENT_EVENT } from "@/navigation/back";

const loadingStates = [HMSRoomState.Connecting, HMSRoomState.Disconnecting];

export default function VideoCall() {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const roomState = useHMSStore(selectRoomState);
  const hmsActions = useHMSActions();
  const navigate = useNavigate();

  // Same pattern as ChatScreen: intercept Telegram back button to avoid
  // window.history.go(-1) closing the Mini App from the video-call page.
  useEffect(() => {
    const handleBackIntent = (e: Event) => {
      e.preventDefault();
      navigate("/consultation", { replace: true });
    };
    window.addEventListener(APP_BACK_INTENT_EVENT, handleBackIntent);
    return () => window.removeEventListener(APP_BACK_INTENT_EVENT, handleBackIntent);
  }, [navigate]);

  useEffect(() => {
    window.onunload = () => {
      if (isConnected) {
        hmsActions.leave();
      }
    };
  }, [hmsActions, isConnected]);

  if (loadingStates.includes(roomState) || !roomState) {
    return <Loader />;
  }

  return (
    <div>
      {isConnected && (
        <>
          <Header />
          <Conference />
          <Footer />
        </>
      )}
    </div>
  );
}
