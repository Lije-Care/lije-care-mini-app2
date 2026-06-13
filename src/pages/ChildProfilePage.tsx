"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  // Input,
  Spinner,
  Text,
  Divider,
} from "@telegram-apps/telegram-ui";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { updateChild, Child } from "@/redux/slices/childSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import GrowthTracker from "./Profile/GrowthTracker";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";
import ChatBox from "@/components/ai/ChatBox";
import { calculateNutrients } from "@/utils/calculateNutrients";

type ChildFormData = {
  name: string;
  date_of_birth: string;
  gender: string;
  weight: number;
  height: number;
  muac: number;
  dietary_restrictions: string;
  allergies: string;
  activity_level: "Active" | "Moderate" | "Sedentary";
  medications: string;
};

const ChildProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { childId } = useParams<{ childId: string }>();
  const child = useSelector((state: RootState) =>
    state.children?.data?.find((c: Child) => c.id === childId)
  );
  // console.log(child?.activity_level);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChatBox, setIsChatBox] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const { register, handleSubmit, reset, watch } = useForm<ChildFormData>({
    defaultValues: {
      name: "",
      date_of_birth: "",
      gender: "Male",
      weight: 0,
      height: 0,
      muac: 0,
      dietary_restrictions: "",
      allergies: "",
      medications: "",
      activity_level: "Moderate",
    },
  });
  const formatDateToYYYYMMDD = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };
  useEffect(() => {
    if (child) {
      reset({
        ...child,
        date_of_birth: formatDateToYYYYMMDD(child.date_of_birth),
        muac: child.muac ?? 0,
        dietary_restrictions: child.dietary_restrictions ?? "",
        allergies: child.allergies ?? "",
        medications: child.medications ?? "",
      });
      setLoadingPage(false);
    }
  }, [child, reset]);
  const weight = watch("weight");
  const height = watch("height");
  const gender = watch("gender");
  const date_of_birth = watch("date_of_birth");
  const activity_level =
    watch("activity_level") || child?.activity_level || "Moderate";
  useEffect(() => {
    if (gender && date_of_birth) {
      const weightNum = Number(weight);
      const heightNum = Number(height);
      const newResult = calculateNutrients(
        weightNum,
        heightNum,
        gender,
        date_of_birth,
        activity_level
      );
      setResult(newResult);
    } else {
      setResult(null);
    }
  }, [weight, height, gender, date_of_birth, activity_level]);
  useEffect(() => {
    if (result) {
      // console.log("Child Profile:", result);
    }
  }, [result]);
  // Load nutrient result from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`nutrient_${childId}`);
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, [childId]);
  // Save nutrient result whenever it changes
  useEffect(() => {
    if (result) {
      localStorage.setItem(`nutrient_${childId}`, JSON.stringify(result));
    }
  }, [result, childId]);
  const onSubmit = async (data: any) => {
    setSubmitting(true);
    const updatedData = {
      ...data,
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
      muac: parseFloat(data.muac),
    };
    try {
      await dispatch(updateChild({ id: childId, ...updatedData })).unwrap();
      setIsEditing(false);
      setIsChatBox(false);
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  if (loadingPage) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="l" />
      </div>
    );
  }
  return (
    <Page back={true}>
      <div className="max-w-4xl mx-auto p-4 bg-gray-800 ">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-400">
            {t("Child Profile")}
          </h1>
          <div className=" flex space-x-4">
            <button
              onClick={() => setIsChatBox(!isChatBox)}
              className="bg-[#0B8FAC] hover:bg-[#0ea4c6] px-4 py-2 rounded text-gray-100 "
            >
              {isChatBox ? t("Cancel") : t("Ask Ai")}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#0B8FAC] hover:bg-[#0ea4c6] px-4 py-2 rounded text-gray-100 "
            >
              {isEditing ? t("Cancel") : t("Edit")}
            </button>
          </div>
        </div>
        {!isChatBox && (
          <h2 className=" ml-6 text-gray-500 font-semibold text-xl">
            Anthropometric Assessment
          </h2>
        )}
        {isChatBox && (
          <div className="h-full mb-6 px-2 mt-4">
            <h1 className="text-2xl font-bold mb-4">Your Child Assistant</h1>
            <ChatBox
              userId={child?.parentId as string}
              childId={childId as string}
              backendUrl={import.meta.env.VITE_API_URL}
            />
          </div>
        )}
        {isEditing && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 mb-6 px-2 mt-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0B364F] p-3 rounded-lg"
            >
              <Text className="text-lg font-semibold text-gray-300">
                {t("Basic Information")}
              </Text>
              {/* Name */}
              <div className="mt-4 ">
                <label
                  htmlFor="name"
                  className="block mb-1 text-[#FFFFFF] font-[600]"
                >
                  {t("Name")}
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder={t("Enter your name")}
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none font-[400]"
                  {...register("name")}
                />
              </div>
              {/* Date of Birth */}
              <div className="mt-4">
                <label
                  htmlFor="date_of_birth"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Date of Birth")}
                </label>
                <input
                  id="date_of_birth"
                  type="date"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("date_of_birth")}
                />
              </div>
              {/* Gender */}
              {/* Gender */}
              <div className="mt-4">
                <label
                  htmlFor="gender"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Gender")}
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] focus:outline-none text-white custom-select"
                >
                  <option value="Male" className="bg-[#0B364F] text-white">
                    {t("Male")}
                  </option>
                  <option value="Female" className=" bg-[#0B364F] text-white">
                    {t("Female")}
                  </option>
                </select>
              </div>
              {/* Weight */}
              <div className="mt-4">
                <label
                  htmlFor="weight"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Weight (kg)")}
                </label>
                <input
                  id="weight"
                  type="number"
                  placeholder="e.g. 70"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("weight")}
                />
              </div>
              {/* Height */}
              <div className="mt-4">
                <label
                  htmlFor="height"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Height (cm)")}
                </label>
                <input
                  id="height"
                  type="number"
                  placeholder="e.g. 175"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("height")}
                />
              </div>
              {/* Activity Level */}
              <div className="mt-4">
                <label
                  htmlFor="activity_level"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Activity Level")}
                </label>
                <select
                  id="activity_level"
                  {...register("activity_level")}
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] focus:outline-none text-white"
                >
                  <option value="Active" className="bg-[#0B364F]">
                    {t("Active")}
                  </option>
                  <option value="Moderate" className="bg-[#0B364F]">
                    {t("Moderate")}
                  </option>
                  <option value="Sedentary" className="bg-[#0B364F]">
                    {t("Sedentary")}
                  </option>
                </select>
              </div>
              {/* MUAC */}
              <div className="mt-4">
                <label
                  htmlFor="muac"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("MUAC (cm)")}
                </label>
                <input
                  id="muac"
                  type="number"
                  placeholder="e.g. 23"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("muac")}
                />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="allergies"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Allergies")}
                </label>
                <input
                  id="allergies"
                  type="text"
                  placeholder="allergies"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("allergies")}
                />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="medications"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Medication")}
                </label>
                <input
                  id="medications"
                  type="text"
                  placeholder="medications"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("medications")}
                />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="dietary_restrictions"
                  className="block font-medium mb-1 text-[#FFFFFF]"
                >
                  {t("Dietary Restrictions")}
                </label>
                <input
                  id="dietary_restrictions"
                  type="text"
                  placeholder="dietary_restrictions"
                  className="w-full px-4 py-2 rounded-lg border bg-[#D9D9D94D] text-[#FFFFFF] focus:outline-none"
                  {...register("dietary_restrictions")}
                />
              </div>
              <div className="flex justify-end mt-4 p-4">
                <Button type="submit" stretched disabled={submitting}>
                  {submitting ? <Spinner size="s" /> : t("Save Changes")}
                </Button>
              </div>
            </motion.div>
          </form>
        )}
        {!isEditing && !isChatBox && (
          <div>
            <GrowthTracker childProfile={child} />
            <div className=" border border-gray-700 rounded-xl mt-4 p-5 space-y-2 mb-5 bg-[#0B8FAC]">
              <h3 className="text-lg font-semibold text-center text-gray-300 mb-2">
                👶 General Profile
              </h3>
              <div className="text-sm text-white space-y-1 ">
                {child?.name && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Name:</span>
                    <span>{child?.name}</span>
                  </div>
                )}
                {child?.gender && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Gender:</span>
                    <span>{child.gender}</span>
                  </div>
                )}
                {child?.activity_level && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Active Level:</span>
                    <span>{child.activity_level}</span>
                  </div>
                )}
                {child?.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Date of Birth:</span>
                    <span>
                      {new Date(child.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {child?.height && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Height (cm):</span>
                    <span>{child.height}</span>
                  </div>
                )}
                {child?.weight && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Weight (kg):</span>
                    <span>{child.weight}</span>
                  </div>
                )}
                {child?.muac && (
                  <div className="flex justify-between">
                    <span className="font-semibold">MUAC (cm):</span>
                    <span>{child.muac}</span>
                  </div>
                )}
                <Divider />
                {child?.dietary_restrictions && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Dietary Restrictions:</span>
                    <span>{child.dietary_restrictions || "-"}</span>
                  </div>
                )}
                {child?.allergies && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Allergies:</span>
                    <span>{child.allergies || "-"}</span>
                  </div>
                )}
                {child?.medications && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Medications:</span>
                    <span>{child.medications || "-"}</span>
                  </div>
                )}
              </div>
            </div>
            {result && (
              <div className="border border-gray-700 rounded-xl mt-4 p-5 space-y-2 mb-5 bg-[#0B8FAC]">
                <h3 className="text-lg font-semibold text-center text-gray-300 mb-2">
                  📊 Daily Nutrient Requirements
                </h3>
                <div className="text-sm text-white space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">Calories:</span>
                    <span>{result.calories} kcal/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Protein:</span>
                    <span>{result.protein} g/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Fat:</span>
                    <span>{result.fat} g/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Carbohydrates:</span>
                    <span>{result.carbs} g/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Iron:</span>
                    <span>{result.iron} mg/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Calcium:</span>
                    <span>{result.calcium} mg/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Vitamin A:</span>
                    <span>{result.vitaminA} mcg/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Water:</span>
                    <span>{result.water} ml/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Zinc:</span>
                    <span>{result.zinc} mg/day</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
};
export default ChildProfilePage;
