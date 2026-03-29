"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "@telegram-apps/telegram-ui";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchSpecialists } from "@/redux/slices/specialistSlice";
import { Page } from "@/components/Page";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { MdWidthFull } from "react-icons/md";

export default function ConsultationTab() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { specialists, loading, error } = useSelector(
    (state: RootState) => state.specialists
  );

  const categories = [t("All"), t("Nutritionist"), t("Doctors"), t("Any(CS)")];
  const [activeCategory, setActiveCategory] = useState(t("All"));

  useEffect(() => {
    dispatch(fetchSpecialists({ page: 1, limit: 1000 }));
  }, [dispatch]);

  // ✅ Helper to check future unbooked slots
  const hasFutureUnbookedSlot = (slots: any[] = []) => {
    return slots.some((slot) => {
      if (!slot || slot.isBooked || !slot.startTime || !slot.date) return false;
      try {
        const [hour, minute] = slot.startTime.split(":").map(Number);
        const dateObj = new Date(slot.date);
        const slotDateTime = new Date(
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
          hour,
          minute
        );
        return slotDateTime.getTime() > Date.now();
      } catch {
        return false;
      }
    });
  };

  const filteredSpecialists = specialists.filter((doc) => {
    const hasAvailableSlot = hasFutureUnbookedSlot(doc.AvailabilitySlots);
    if (!hasAvailableSlot) return false;

    if (activeCategory === t("All")) return true;

    const role = doc?.role || "";
    // const specialty = doc?.SpecialistProfile?.specialty || "";
    console.log({ specialists });

    switch (activeCategory) {
      case t("Nutritionist"):
        return role.toUpperCase() === "NUTRITIONIST";
      case t("Doctors"):
        return role.toUpperCase() === "PEDIATRICIAN";
      case t("Questions"):
        return role.toUpperCase() === "CUSTOMER_SUPPORT";
      default:
        return false;
    }
  });

  return (
    <Page>
      <div className=" min-h-screen w-full mx-auto bg-gray-800  ">
        <div className=" flex justify-end bg-[#013222] pt-2">
          <div className=" px-2">
            <button
              className="bg-[#0B8FAC] hover:bg-[#0ea4c6] px-4 py-2 rounded text-gray-100 "
              onClick={() => navigate("/my-appointments")}
            >
              {t("My Appointments")}
            </button>
          </div>
        </div>

        <div className=" bg-[#013222] px-2 py-4">
          <div className="w-full flex flex-between rounded-lg bg-[#013222]">
            {categories.map((category) => (
              <button
                key={category}
                className={`py-1 px-2 text-[15px] font-normal whitespace-nowrap mx-auto w-full ${
                  activeCategory === category
                    ? "bg-[#0B8FAC] text-white" // filled style
                    : " text-gray-200 text-xl font-extrabold" // outline style
                } rounded-lg`}
                onClick={() => setActiveCategory(category)}
                title={`Filter by ${category}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <p className="font-extrabold text-gray-200 truncate py-2 ml-2">
          👩‍⚕️ {t("Choose a Specialist")}
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner size="l" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            {filteredSpecialists.length === 0 ? (
              <p className="  flex flex-center justify-center font-sm text-base text-gray-400 px-6 mt-12 ">
                {t(
                  "No specialists are currently available. Please try again later."
                )}
              </p>
            ) : (
              <div className="space-y-3 mx-2">
                {filteredSpecialists.map((doc) => {
                  const fullName = `${doc?.firstName} ${doc?.lastName}`;
                  return (
                    <div
                      key={doc.id}
                      className="p-4 border rounded-lg flex justify-between items-center border-gray-400 bg-gray-300 text-gray-700 cursor-pointer"
                      onClick={() => navigate(`/consultat/${doc.id}`)}
                    >
                      <div className="flex gap-4 items-center">
                        <img
                          src={doc?.avatarUrl || "/doctors/default-avatar.png"}
                          alt={fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <p className="font-bold">{fullName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
