import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";
import { Page } from "./Page";
import { Text } from "@telegram-apps/telegram-ui";

// ✅ Translations dictionary
const translations: Record<string, { en: string; am: string }> = {
  title: { en: "Create your account", am: "እባክወ አካወንት ይክፈቱ" },
  name: { en: "Name", am: "ስም" },
  namePlaceholder: { en: "Full name", am: "ሙሉ ስም ያስገቡ" },
  phone: { en: "Phone number", am: "ስልክ ቁጥር" },
  phonePlaceholder: { en: "+2519XXXXXXXX", am: "+2519XXXXXXXX" },
  password: { en: "Password", am: "የይለፍ ቃል" },
  passwordPlaceholder: { en: "At least 6 characters", am: "ቢያንስ 6 አሃዝ ያስገቡ" },
  signup: { en: "Sign Up", am: "ተመዝገብ" },
  signingUp: { en: "Signing up...", am: "በመመዝገብ ላይ..." },
  signin: { en: "Sign In", am: "ግባ" },
};

const UserOnboardingForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    password: "",
    role: "PARENT",
    telegramId: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lang, setLang] = useState<"en" | "am">("am"); // default Amharic
  const navigate = useNavigate();

  // ✅ Translation function
  const t = (key: keyof typeof translations) => translations[key][lang];

  // ✅ Extract Telegram ID from Telegram Web App
  useEffect(() => {
    const tgUserId = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
      ?.id;
    if (tgUserId) {
      setFormData((prev) => ({ ...prev, telegramId: tgUserId.toString() }));
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneFromBot = urlParams.get("phone");

    if (phoneFromBot) {
      setFormData((prev) => ({
        ...prev,
        phone: "+" + phoneFromBot,
      }));
    }
  }, []);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim())
      newErrors.firstName = lang === "en" ? "Name is required" : "ስም ያስፈልጋል";

    // ✅ Accept +2519... OR +2517... (Ethio Telecom & Safaricom)
    // if (!/^\+251(9|7)\d{8}$/.test(formData.phone))
    //   newErrors.phone =
    //     lang === "en"
    //       ? "Use format +2519XXXXXXXX or +2517XXXXXXXX"
    //       : "በመልክ +2519XXXXXXXX ወይም +2517XXXXXXXX ያስገቡ";

    // ✅ Password validation: at least 6 characters + strong pattern
    if (formData.password.length < 6) {
      newErrors.password =
        lang === "en"
          ? "Password must be at least 6 characters long."
          : "የይለፍ ቃል ቢያንስ 6 ቁምፊ ያስፈልጋል።";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)
    ) {
      newErrors.password =
        lang === "en"
          ? "Use a stronger password (include uppercase, lowercase, number, and special character)."
          : "አስቸጋሪ የይለፍ ቃል ይጠቀሙ። (ቢያንስ አንድ ትልቅ፣ አንድ ትንሽ ፊደል፣ ቁጥር፣ እና ልዩ ቁምፊ ይዟል።)";
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      await api.post("users/create", formData);
      localStorage.setItem("onboarding_complete", "true");
      navigate("/");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page back={true}>
      <div className="p-2 bg-gray-800 min-h-screen">
        <div className="max-w-md mx-auto mt-10 rounded-2xl shadow-xl p-2 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-center text-white">
            👋 {t("title")}
          </h2>

          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "en" | "am")}
              className="py-2 px-4 bg-gray-300 border-gray-200 rounded-lg text-sm text-black"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="text-red-500 text-sm text-center">
                {submitError}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="firstName"
                className=" text-white block font-medium mb-1"
              >
                {t("name")}
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder={t("namePlaceholder")}
                className={`w-full px-4 py-2 rounded-lg border  text-white ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className=" text-white block font-medium mb-1"
              >
                {t("phone")}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                disabled={!!formData.phone}
                className="w-full px-4 py-2 rounded-lg border text-gray-400 bg-gray-700"
                value={formData.phone}
                readOnly
              />

              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className=" text-white block font-medium mb-1"
              >
                {t("password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                className={`w-full px-4 py-2 rounded-lg border text-white ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Hidden Telegram ID */}
            {formData.telegramId && (
              <div className="text-xs text-gray-400 text-center">
                Telegram ID: {formData.telegramId}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? t("signingUp") : t("signup")}
            </button>
            <div className="flex justify-end">
              <Text
                onClick={() => navigate("/signin")}
                className="forgot-password text-3xl font-bold"
                style={{
                  marginTop: "10px",
                  cursor: "pointer",
                  padding: 6,
                  fontSize: 20,
                }}
              >
                {t("signin")}
              </Text>
            </div>
          </form>
        </div>
        <div
          className="p-4 mt-2 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
          role="alert"
        >
          <span className="font-semibold">Remember!,</span> When registering,
          remember to click "/start" in the Bot.
        </div>
      </div>
    </Page>
  );
};

export default UserOnboardingForm;
