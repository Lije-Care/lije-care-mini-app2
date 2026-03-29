// import JoinForm from "./JoinForm";
import "./styles.css";

import { useEffect } from "react";
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


const loadingStates = [HMSRoomState.Connecting, HMSRoomState.Disconnecting];

export default function VideoCall() {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const roomState = useHMSStore(selectRoomState);
  const hmsActions = useHMSActions();
 
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
