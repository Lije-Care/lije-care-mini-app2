import React, { useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { Button } from "@telegram-apps/telegram-ui";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BookingsList: React.FC = () => {
  const { t } = useTranslation();
  const [chatOpen] = useState(false);
  const { bookings, loading, error } = useBookings();
  console.log({ bookings });
  const navigate = useNavigate();
  console.log(chatOpen);

  if (loading)
    return (
      <div className="min-h-screen w-full bg-gray-800 flex justify-center items-center">
        <p className="text-center text-gray-400">{t("Loading...")}</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen w-full bg-gray-800 flex justify-center items-center">
        <p className="text-center text-red-400">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gray-800 px-4 py-6">
      <h2 className="text-xl font-bold text-gray-400 mb-6">
        {t("Your Bookings")}
      </h2>
      {bookings.length === 0 ? (
        <div className="flex flex-col justify-center items-center  text-center text-gray-400">
          <p className="text-lg">{t("No bookings found")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-start justify-between shadow-sm border border-white/20 rounded-xl p-4 hover:shadow-md transition bg-[#0B8FAC] text-gray-200"
            >
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{t("Status")}:</span>{" "}
                  {t(booking.status)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t("Expert")}:</span>{" "}
                  {booking.expert.firstName} {booking.expert.lastName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t("Date")}:</span>{" "}
                  {new Date(booking.slot.date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t("Time")}:</span>{" "}
                  {booking.slot.startTime} - {booking.slot.endTime}
                </p>
              </div>
              <Button
                className="ml-4 p-2 rounded-full hover:bg-blue-200"
                onClick={() => navigate(`/chat/${booking.expert.id}`)}
              >
                <div>Join</div>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsList;
