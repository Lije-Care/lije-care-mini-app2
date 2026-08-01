import { useVideo } from "@100mslive/react-sdk";
import type { HMSPeer } from "@100mslive/react-sdk";
import { ConsultationError } from "./ConsultationError";
import { ConsultationStatus } from "./ConsultationStatus";
import { useConsultationLifecycle } from "./useConsultationLifecycle";

export const isBrowserCompatible = () =>
  typeof window.RTCPeerConnection !== "undefined" &&
  typeof navigator.mediaDevices !== "undefined";

const PeerTile = ({ peer, allowVideo }: { peer: HMSPeer; allowVideo: boolean }) => {
  const { videoRef } = useVideo({ trackId: peer.videoTrack });
  return (
    <article className="peer-tile">
      {allowVideo && peer.videoTrack ? (
        <video ref={videoRef} autoPlay playsInline muted={peer.isLocal} />
      ) : (
        <div className="peer-avatar">{peer.name?.slice(0, 1)?.toUpperCase() || "?"}</div>
      )}
      <span>{peer.isLocal ? "You" : peer.name || "Participant"}</span>
    </article>
  );
};

export const ConsultationPage = () => {
  const call = useConsultationLifecycle();
  const { state, session } = call;

  if (state === "IDLE" || state === "VALIDATING_SESSION") {
    return <ConsultationStatus text="Validating your appointment…" />;
  }
  if (state === "ERROR_TERMINAL") {
    return <ConsultationError code={call.errorCode} />;
  }
  if (state === "ERROR_RECOVERABLE") {
    return (
      <main className="consultation-card consultation-error" role="alert">
        <div className="consultation-mark">!</div>
        <h1>Could not connect</h1>
        <p>Check browser permissions and your connection, then try again.</p>
        <button onClick={call.retry}>Try again</button>
      </main>
    );
  }
  if (!session) return <ConsultationStatus text="Loading your appointment…" />;

  const inCall = ["JOINING", "CONNECTED", "RECONNECTING", "LEAVING"].includes(state);
  return (
    <main className={`consultation-card ${inCall ? "call-card" : ""}`}>
      <div className="consultation-mark">LC</div>
      <p className="consultation-kicker">{session.consultationType} consultation</p>
      <h1>
        {state === "RECONNECTING"
          ? "Reconnecting…"
          : state === "DISCONNECTED"
            ? "Consultation ended"
            : `Hello, ${session.displayName}.`}
      </h1>
      {!inCall && state !== "DISCONNECTED" && (
        <>
          <p>
            {session.appointmentState === "ACTIVE"
              ? "Your browser will ask for camera or microphone permission when you join."
              : "Your consultation is not active yet. This page will update automatically."}
          </p>
          <button
            disabled={session.appointmentState !== "ACTIVE"}
            onClick={() => void call.join()}
          >
            Join consultation
          </button>
        </>
      )}
      {inCall && (
        <>
          <section className="peer-grid" aria-label="Consultation participants">
            {call.peers.map((peer) => (
              <PeerTile
                key={peer.id}
                peer={peer}
                allowVideo={session.consultationType === "VIDEO"}
              />
            ))}
          </section>
          <div className="call-controls">
            <button onClick={() => void call.toggleAudio()}>
              {call.audioEnabled ? "Mute" : "Unmute"}
            </button>
            {session.consultationType === "VIDEO" && (
              <button onClick={() => void call.toggleVideo()}>
                {call.videoEnabled ? "Camera off" : "Camera on"}
              </button>
            )}
            <button className="danger" onClick={() => void call.leave("user")}>
              End call
            </button>
          </div>
        </>
      )}
      <dl>
        <div><dt>Status</dt><dd>{state.toLowerCase().replace("_", " ")}</dd></div>
        <div>
          <dt>Ends</dt>
          <dd>{new Date(session.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</dd>
        </div>
      </dl>
    </main>
  );
};
