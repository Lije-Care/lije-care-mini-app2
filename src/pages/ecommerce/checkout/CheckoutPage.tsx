import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { clearCart } from "@/redux/slices/cartSlice";
import api from "@/api/axios";
import { useTranslation } from "react-i18next";
// import axios from "axios";
// import { ChapaInitializeResponse } from "@/types/chapa";

interface CartItem {
  id: string;
  price: number;
  quantity: number;
  name?: string;
  image?: string;
  color?: string;
}

const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  ) as CartItem[];

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    city: "",
    paymentMethod: "CASH",
    deliveryMethod: "PICKUP",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.15; // Example: 15% tax
  const deliveryFee = formData.deliveryMethod === "DELIVERY" ? 50 : 0;
  const paymentFee = formData.paymentMethod === "CARD" ? 5 : 0;
  const total = subtotal + tax + deliveryFee + paymentFee;

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError(""); // Clear error on input change
    const validationError = validateForm();
    if (validationError) setError(validationError);
  };

  // Handle radio button changes
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.customerName) return t("Name is required.");
    if (
      !formData.customerEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)
    ) {
      return t("Valid email is required.");
    }
    if (!formData.customerPhone) return t("Phone number is required.");
    if (!formData.city) return t("City is required.");
    return "";
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // Validate cart & form
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      setIsSubmitting(false);
      return;
    }

    try {
      const orderData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        city: formData.city,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })),
        amount: total,
      };

      if (formData.paymentMethod === "CARD") {
        // 1️⃣ Initialize Chapa
        const response = await api.post("/chapa/initialize", orderData);

        if (
          response.data.status === "success" ||
          response.data.status === "created"
        ) {
          dispatch(clearCart());
          window.Telegram.WebApp.openLink(response.data.data.checkout_url);
        } else {
          setError("Payment initialization failed");
        }
      } else {
        // 2️⃣ Cash payment: directly create order
        const cashResponse = await api.post("/product/order", {
          ...orderData,
          paymentStatus: "pending",
        });

        if (cashResponse.data.id) {
          dispatch(clearCart());
          setSuccess("Order placed successfully!");
        } else {
          setError("Failed to save order");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate dynamic pickup date
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 3);
  const formattedPickupDate = pickupDate.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <div className="bg-[#013222] p-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30 transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-white text-3xl font-bold">{t("Products")}</h1>
      </div>
      <section className="antialiased bg-white">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-screen-xl px-4 pb-10"
        >
          <div className="pt-6 space-y-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  {t("Delivery Details")}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      {t("Your name")}*
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 "
                      placeholder="Bonnie Green"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      {t("Your email")}*
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 "
                      placeholder="test@lijecare.com"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      {t("Your Phone")}*
                    </label>
                    <input
                      type="text"
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 "
                      placeholder="+251961197371"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      {t("City")}*
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Addis Ababa"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  {t("Payment")}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg border border-gray-300 bg-white p-4 ps-4  ">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="credit-card"
                          aria-describedby="credit-card-text"
                          type="radio"
                          name="paymentMethod"
                          value="CARD"
                          checked={formData.paymentMethod === "CARD"}
                          onChange={handleRadioChange}
                          className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600   "
                        />
                      </div>
                      <div className="ms-4 text-sm">
                        <label
                          htmlFor="credit-card"
                          className="font-medium leading-none text-gray-900 "
                        >
                          {t("Chapa")}
                        </label>
                        <p
                          id="credit-card-text"
                          className="mt-1 text-xs font-normal text-gray-500 "
                        >
                          {t("Pay with your Chapa account (+ETB 5 fee)")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-300 bg-white p-4 ps-4  ">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="pay-on-delivery"
                          aria-describedby="pay-on-delivery-text"
                          type="radio"
                          name="paymentMethod"
                          value="CASH"
                          checked={formData.paymentMethod === "CASH"}
                          onChange={handleRadioChange}
                          className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600   "
                        />
                      </div>
                      <div className="ms-4 text-sm">
                        <label
                          htmlFor="pay-on-delivery"
                          className="font-medium leading-none text-gray-900 "
                        >
                          {t("CASH")}
                        </label>
                        <p
                          id="pay-on-delivery-text"
                          className="mt-1 text-xs font-normal text-gray-500 "
                        >
                          {t("No payment processing fee")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  {t("Delivery Methods")}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg border border-gray-300 bg-white p-4 ps-4  ">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="DELIVERY"
                          aria-describedby="delivery-text"
                          type="radio"
                          name="deliveryMethod"
                          value="DELIVERY"
                          checked={formData.deliveryMethod === "DELIVERY"}
                          onChange={handleRadioChange}
                          className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600   "
                        />
                      </div>
                      <div className="ms-4 text-sm">
                        <label
                          htmlFor="DELIVERY"
                          className="font-medium leading-none text-gray-900 "
                        >
                          {t("ETB 50 - Fast Delivery")}
                        </label>
                        <p
                          id="delivery-text"
                          className="mt-1 text-xs font-normal text-gray-500 "
                        >
                          {t("Get it by Tomorrow")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-300 bg-white p-4 ps-4  ">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="fedex"
                          aria-describedby="fedex-text"
                          type="radio"
                          name="deliveryMethod"
                          value="PICKUP"
                          checked={formData.deliveryMethod === "PICKUP"}
                          onChange={handleRadioChange}
                          className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600   "
                        />
                      </div>
                      <div className="ms-4 text-sm">
                        <label
                          htmlFor="fedex"
                          className="font-medium leading-none text-gray-900 "
                        >
                          {t("Free Delivery")}
                        </label>
                        <p
                          id="fedex-text"
                          className="mt-1 text-xs font-normal text-gray-500 "
                        >
                          {t("Get it by")} {formattedPickupDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 border-t border-slate-200 pt-6">
              <div className="flow-root">
                <div className="-my-3 divide-y divide-slate-200">
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-normal text-slate-600">
                      {t("Subtotal")}
                    </dt>
                    <dd className="text-base font-medium text-slate-800">
                      ETB {subtotal.toFixed(2)}
                    </dd>
                  </dl>
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-normal text-slate-600">
                      {t("Tax")}
                    </dt>
                    <dd className="text-base font-medium text-slate-800">
                      ETB {tax.toFixed(2)}
                    </dd>
                  </dl>
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-normal text-slate-600">
                      {t("Delivery Fee")}
                    </dt>
                    <dd className="text-base font-medium text-slate-800">
                      ETB {deliveryFee.toFixed(2)}
                    </dd>
                  </dl>
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-normal text-slate-600">
                      {t("Payment Fee")}
                    </dt>
                    <dd className="text-base font-medium text-slate-800">
                      ETB {paymentFee.toFixed(2)}
                    </dd>
                  </dl>
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-bold text-slate-800">
                      {t("Total")}
                    </dt>
                    <dd className="text-base font-bold text-slate-800">
                      ETB {total.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="space-y-3 pb-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-[2rem] bg-[#0B1A12] px-6 py-4 text-base font-black text-white shadow-xl active:scale-95 transition-transform"
                >
                  {isSubmitting ? t("Processing...") : t("Order Now")}
                </button>
              </div>
            </div>
          </div>
          {error && (
            <div
              className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 "
              role="alert"
            >
              <svg
                className="shrink-0 inline w-4 h-4 me-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">Danger alert!</span> {error}
              </div>
            </div>
          )}
          {success && (
            <div
              className="flex items-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 "
              role="alert"
            >
              <svg
                className="shrink-0 inline w-4 h-4 me-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">Success alert!</span> {success}
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

export default CheckoutPage;
