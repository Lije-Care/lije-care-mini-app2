export const ConsultationStatus = ({ text }: { text: string }) => (
  <main className="consultation-card" aria-live="polite">
    <div className="consultation-mark">LC</div>
    <h1>Lije Care Consultation</h1>
    <p>{text}</p>
  </main>
);
