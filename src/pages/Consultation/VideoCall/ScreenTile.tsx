import {
  selectScreenShareByPeerID,
  useHMSStore,
  useVideo,
} from "@100mslive/react-sdk";
import { useTranslation } from "react-i18next";

export const ScreenTile = ({ peer }: any) => {
  const { t } = useTranslation();
  const screenshareVideoTrack = useHMSStore(selectScreenShareByPeerID(peer.id));
  const { videoRef } = useVideo({
    trackId: screenshareVideoTrack.id,
  });

  return (
    <div className="peer-container">
      <video ref={videoRef} className="peer-video" autoPlay muted playsInline />
      <div className="peer-name">
        {t("Screen shared by")} {peer.name} {peer.isLocal ? `(${t("You")})` : ""}
      </div>
    </div>
  );
};
