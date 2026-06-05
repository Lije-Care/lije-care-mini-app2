"use client";

import { useEffect, useState } from "react";
import api from "@/api/axios";
import { Spinner, Button } from "@telegram-apps/telegram-ui";
import { Page } from "@/components/Page";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  compareConsultationSlots,
  isFutureConsultationSlot,
} from "@/utils/consultationTime";
import { FaPlus } from "react-icons/fa";

export default function DoctorDetailPage() {
  const { t } = useTranslation();
  const { doctorId } = useParams();
  const telegramuser = JSON.parse(localStorage.getItem("user") || "{}");
  // const parentId = telegramuser?.id;

  const [doctor, setDoctor] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed] = useState(false);
  const [hasFavoriteChild, setHasFavoriteChild] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctorInfo();
    fetchAvailability();

    const favoriteChildId = localStorage.getItem("favorite_child_id");
    if (!favoriteChildId) {
      setHasFavoriteChild(false);
    }
  }, [doctorId]);

  const fetchDoctorInfo = async () => {
    try {
      const res = await api.get(`/specialists/find-one/${doctorId}`);
      setDoctor(res.data);
    } catch (err) {
      console.error(t("Doctor fetch failed"));
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoadingSlots(true);
      const res = await api.get(`/availability/find-availability/${doctorId}`);
      setAvailability(res.data);
    } catch {
      setAvailability([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ✅ Booking action with payment check
  const bookSlot = async () => {
    const favoriteChildId = localStorage.getItem("favorite_child_id");
    if (!selectedSlot || !favoriteChildId) {
      setErrorMsg(t("Please select a slot and ensure child is added."));
      return;
    }

    try {
      // ✅ Check payment before booking
      // const res = await api.get(`/booked/by-parent/${parentId}`);

      // const allOrders = res.data.data || [];
      // const successOrder = allOrders.find(
      //   (order: any) => order.paymentStatus === "SUCCESS"
      // );

      // if (!successOrder) {
      //   // ⛔ Not paid → redirect to package page
      //   navigate("/package/list");
      //   return;
      // }

      // ✅ Paid → proceed with booking
      await api.post("/booking/create", {
        parentId: telegramuser?.id,
        expertId: doctorId,
        slotId: selectedSlot,
        childId: favoriteChildId,
      });

      navigate(`/consultation/${doctorId}`);
    } catch (err) {
      console.error("Booking or payment check failed:", err);
      setErrorMsg(t("Booking failed. Try again."));
    }
  };

  if (confirmed && doctor) {
    return (
      <Page back={true}>
        <div className="p-6 text-center text-white space-y-4">
          <h2 className="text-2xl font-semibold text-green-400">
            🎉 {t("Consultation Confirmed")}
          </h2>
          <p>
            {t("Session booked with")}{" "}
            <span className="font-bold">
              {doctor?.firstName} {doctor?.lastName}
            </span>
          </p>
          <Button className="bg-indigo-600 text-white mt-4">
            {t("Join Video Call")}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page back={true}>
      <div className=" space-y-4 text-white bg-gray-800 min-h-screen">
        <div className=" bg-[#013222] pl-3 pb-3">
          <h2 className="text-xl  pt-6 pb-5 ml-6    font-bold text-emerald-400">
            {t("Doctor Info")}
          </h2>
          <button
            onClick={() => {
              navigate(-1);
            }}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium pb-2  flex justify-start items-start"
          >
            ← Back
          </button>
        </div>

        {!hasFavoriteChild && (
          <div className="bg-[#0D778F] p-4 rounded border border-gray-300 text-white space-y-2 mx-2 ">
            <p>
              {t(
                "No active child is selected. Please add an active child before booking."
              )}
            </p>
            <button
              className="flex bg-[#013222] hover:bg-[#0ea4c6] px-4 py-2 rounded text-gray-100 w-32"
              onClick={() => navigate("/children")}
            >
              <FaPlus className="text-base mt-1 px-1" />
              <span>{t("Add Child")}</span>
            </button>
          </div>
        )}

        {doctor ? (
          <div className="flex gap-4 items-center mx-2">
            <img
              src={doctor?.avatarUrl || "/doctors/default-avatar.png"}
              alt={`${doctor.firstName} ${doctor.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <p className="text-lg font-bold text-gray-100">
                {doctor.firstName} {doctor.lastName}
              </p>
              <p className=" text-gray-200 text-base">
                {doctor.SpecialistProfile?.specialty}
              </p>
            </div>
          </div>
        ) : (
          <Spinner size="l" />
        )}

        {hasFavoriteChild && (
          <>
            <div className=" mx-2">
              <p className="font-medium mb-2 text-gray-200 mx-2">
                📅 {t("Choose a Slot")}
              </p>
              {loadingSlots ? (
                <Spinner size="l" />
              ) : (
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-gray-500 border border-gray-600 text-white p-2 rounded"
                >
                  <option className="bg-gray-500 text-gray-700" value="">
                    {t("Select a time slot")}
                  </option>
                  {availability
                    .filter((slot) => {
                      if (slot.isBooked || !slot.startTime || !slot.date)
                        return false;
                      return isFutureConsultationSlot(slot);
                    })
                    .sort(compareConsultationSlots)
                    .map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.date.split("T")[0]} - {slot.startTime} to{" "}
                        {slot.endTime}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            {selectedSlot && (
              <Button
                className="w-full mt-4 bg-emerald-600 text-white"
                onClick={bookSlot}
              >
                {t("Confirm Booking")}
              </Button>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
