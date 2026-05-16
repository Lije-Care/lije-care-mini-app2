import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/axios";

const BookingCheckout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const parentId = telegramUser?.id;

  const pkg = location.state?.pkg; // <-- package data from previous page

  // If user comes directly (no package selected)
  if (!pkg) {
    navigate("/packages"); // or your package list route
    return null;
  }

  // 🧩 States
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    city: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tax = 0;
  const total = pkg.price + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.customerName) return t("Name is required.");
    if (
      !formData.customerEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)
    )
      return t("Valid email is required.");
    if (!formData.customerPhone) return t("Phone number is required.");
    if (!formData.city) return t("City is required.");
    return "";
  };

  // 💳 Chapa payment only
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const bookingData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        parentId: parentId,
        paymentMethod: "chapa",
        amount: total,
        city: formData.city,
        packageId: pkg.id,
        packageTitle: pkg.title,
      };

      const response = await api.post("booked/chapa/initialize", bookingData);

      if (
        response.data.status === "success" ||
        response.data.status === "created"
      ) {
        window.Telegram.WebApp.openLink(response.data.data.checkout_url);
      } else {
        setError(t("Payment initialization failed."));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Failed to place booking.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="bg-[#013222] p-4">
        <h1 className="text-white text-3xl font-bold mb-1">
          {t("Booking Checkout")}
        </h1>
      </div>

      <section className="bg-gray-800 py-1  md:py-16">
        <form onSubmit={handleSubmit} className="mx-auto px-4 2xl:px-0">
          {/* Package Details */}
          <div className="bg-gray-600  p-4 rounded-lg mb-6 border border-gray-300 ">
            <h2 className="text-lg font-bold text-gray-200 ">{pkg.title}</h2>
            <p className="text-sm text-gray-200 ">{pkg.description}</p>
            <p className="mt-2 text-gray-200 ">
              <strong>Sessions:</strong> {pkg.sessionsAllowed} |{" "}
              <strong>Validity:</strong> {pkg.validityDays} days
            </p>
            <p className="mt-2 text-lg font-semibold text-[#0B8FAC]">
              ETB {pkg.price.toFixed(2)}
            </p>
          </div>

          {/* Customer Info + Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-200 ">
                {t("Your name")}*
              </label>
              <input
                type="text"
                id="customerName"
                value={formData.customerName}
                placeholder="Enter you name"
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 ">
                {t("Your email")}*
              </label>
              <input
                type="email"
                id="customerEmail"
                value={formData.customerEmail}
                placeholder="Enter your email"
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 ">
                {t("Your Phone")}*
              </label>
              <input
                type="text"
                id="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 ">
                {t("City")}*
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                placeholder="Enter address"
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                required
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="mt-8 p-4 bg-gray-600 rounded-lg border border-gray-300 ">
            <div className="flex justify-between text-gray-200 ">
              <span>{t("Tax")}:</span>
              <span>ETB {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-200  font-semibold mt-2">
              <span>{t("Total")}:</span>
              <span>ETB {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-6 flex w-full items-center justify-center rounded-md border border-transparent bg-[#0B8FAC] px-6 py-3 text-base font-medium text-white shadow-xs ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#0ea4c6]"
            }`}
          >
            {isSubmitting ? t("Processing...") : t("Pay with Chapa")}
          </button>

          {/* Alerts */}
          {error && (
            <div className="mt-4 text-red-500 bg-red-50 p-3 rounded">
              {t("Error")}: {error}
            </div>
          )}
          {success && (
            <div className="mt-4 text-green-600 bg-green-50 p-3 rounded">
              {t("Success")}: {success}
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

export default BookingCheckout;
