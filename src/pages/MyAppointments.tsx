import { Page } from "@/components/Page";
import BookingsList from "@/components/booking/BookingsList";
import { useTranslation } from "react-i18next";

const MyAppointments = () => {
  const { t } = useTranslation();

  return (
    <Page>
      <div className="p-6 max-w-3xl mx-auto text-white space-y-6 bg-gray-800">
        <h2 className="text-2xl font-bold text-emerald-400">
          📅 {t("Your Booked Sessions")}
        </h2>
        <BookingsList />
      </div>
    </Page>
  );
};

export default MyAppointments;
