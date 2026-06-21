import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "@/api/axios";
import { clearCart } from "@/redux/slices/cartSlice";
import type { RootState } from "@/redux/store";
import type { ShopOrder } from "@/types/order";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

interface CartItem {
  id: string;
  price: number;
  quantity: number;
  name?: string;
  image?: string;
}

type PaymentMode = "CHAPA" | "MANUAL_PROOF" | "CASH";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(
    (state: RootState) => state.cart.items,
  ) as CartItem[];

  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CHAPA");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    city: "",
    deliveryMethod: "PICKUP",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualOrder, setManualOrder] = useState<ShopOrder | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.15;
  const deliveryFee = formData.deliveryMethod === "DELIVERY" ? 50 : 0;
  const paymentFee = paymentMode === "CHAPA" ? 5 : 0;
  const total = subtotal + tax + deliveryFee + paymentFee;

  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 3);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError("");
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.customerName) return t("Name is required.");
    if (!formData.customerPhone) return t("Phone number is required.");
    if (!formData.city) return t("City is required.");
    return "";
  };

  const buildOrderPayload = (paymentMethod: string) => ({
    parentId: telegramUser?.id || undefined,
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    customerEmail: formData.customerEmail || undefined,
    city: formData.city,
    deliveryMethod: formData.deliveryMethod,
    paymentMethod,
    items: cartItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.price,
    })),
    subtotal,
    tax,
    amount: total,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (cartItems.length === 0) {
      setError(t("Your cart is empty."));
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMode === "CHAPA") {
        const orderData = buildOrderPayload("CARD");
        const response = await api.post("/chapa/initialize", orderData);

        if (
          response.data.status === "success" ||
          response.data.status === "created"
        ) {
          window.Telegram?.WebApp?.openLink?.(
            response.data.data.checkout_url,
          );
        } else {
          setError(t("Payment initialization failed."));
        }
        return;
      }

      if (paymentMode === "CASH") {
        const cashResponse = await api.post<ShopOrder>("/product/order", {
          ...buildOrderPayload("CASH"),
          paymentStatus: "PENDING",
        });

        if (!cashResponse.data?.id) {
          setError(t("Failed to create order."));
          return;
        }

        dispatch(clearCart());
        setSuccess(t("Order placed successfully!"));
        navigate("/my-orders");
        return;
      }

      const manualResponse = await api.post<ShopOrder>(
        "/product/order/manual-create",
        {
          ...buildOrderPayload("MANUAL_BANK_TRANSFER"),
          paymentStatus: "PENDING_ADMIN_CONFIRMATION",
        },
      );

      if (!manualResponse.data?.id) {
        setError(t("Failed to create order."));
        return;
      }

      setManualOrder(manualResponse.data);
      setSuccess(
        t(
          "Order created. Upload your payment proof to send it for admin confirmation.",
        ),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("Failed to place order."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProof = async () => {
    if (!manualOrder?.id || !proofFile) {
      setError(t("Please choose a payment screenshot before continuing."));
      return;
    }

    setError("");
    setSuccess("");
    setIsUploadingProof(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("image", proofFile);
      uploadForm.append("type", "PAYMENT_SCREENSHOT");

      const uploadRes = await api.post("/file-upload/upload-image", uploadForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const apiOrigin = new URL(import.meta.env.VITE_API_URL as string).origin;
      const fileName: string = uploadRes.data?.fileName ?? "";
      const paymentScreenshotUrl = fileName
        ? `${apiOrigin}/uploads/images/PAYMENT_SCREENSHOT/${fileName}`
        : (uploadRes.data?.url ?? "");

      const reviewRes = await api.post<ShopOrder>(
        `/product/order/${manualOrder.id}/payment-proof`,
        {
          amountPaid: total,
          paymentScreenshotUrl,
        },
      );

      setManualOrder(reviewRes.data);
      setProofSubmitted(true);
      dispatch(clearCart());
      setSuccess(
        t("Payment proof submitted. Your order is waiting for admin confirmation."),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("Failed to upload payment proof."),
      );
    } finally {
      setIsUploadingProof(false);
    }
  };

  const renderAlert = () => (
    <>
      {error && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
          role="alert"
        >
          <span className="font-medium">{t("Error")}:</span>&nbsp;{error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50"
          role="alert"
        >
          <span className="font-medium">{t("Success")}:</span>&nbsp;{success}
        </div>
      )}
    </>
  );

  const renderProofStep = () => (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">
          {t("Order created")}
        </p>
        <p className="mt-1 text-sm text-amber-800">
          {t("Order ID")}: {manualOrder?.id}
        </p>
        <p className="mt-2 text-sm text-amber-800">
          {t("Upload your bank transfer or payment proof screenshot to complete this backup checkout flow.")}
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            {t("Payment proof screenshot")}*
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
          />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            {t("Payment method")}: {t("Manual payment proof")}
          </p>
          <p>
            {t("Amount to confirm")}: ETB {total.toFixed(2)}
          </p>
          <p>
            {t("Status")}: {manualOrder?.paymentReview?.status ?? "PENDING_ADMIN_CONFIRMATION"}
          </p>
        </div>

        <button
          type="button"
          disabled={isUploadingProof}
          onClick={handleUploadProof}
          className="flex w-full items-center justify-center rounded-[2rem] bg-[#0B1A12] px-6 py-4 text-base font-black text-white shadow-xl active:scale-95 transition-transform disabled:opacity-60"
        >
          {isUploadingProof
            ? t("Uploading proof...")
            : t("Submit Payment Proof")}
        </button>
      </div>
    </div>
  );

  const renderSubmittedState = () => (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-sky-200 bg-sky-50 p-6 text-center">
        <h2 className="text-lg font-black text-sky-900">
          {t("Payment proof received")}
        </h2>
        <p className="mt-2 text-sm text-sky-800">
          {t("Your order is waiting for admin confirmation before fulfillment starts.")}
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 text-sm text-slate-700 space-y-2">
        <p>
          {t("Order ID")}: {manualOrder?.id}
        </p>
        <p>
          {t("Payment status")}: {manualOrder?.paymentStatus}
        </p>
        <p>
          {t("Payment review")}: {manualOrder?.paymentReview?.status}
        </p>
        <p>
          {t("Fulfillment status")}: {manualOrder?.fulfillmentStatus}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/my-orders")}
          className="rounded-[2rem] border border-slate-200 px-6 py-4 text-sm font-black text-slate-700"
        >
          {t("View My Orders")}
        </button>
        <button
          type="button"
          onClick={() => navigate("/ecommerce")}
          className="rounded-[2rem] bg-[#0B1A12] px-6 py-4 text-sm font-black text-white"
        >
          {t("Back to Shop")}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="bg-[#013222] p-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30 transition-colors"
          aria-label={t("Go back")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-white text-3xl font-bold">{t("Products")}</h1>
      </div>

      <section className="antialiased bg-white">
        <div className="mx-auto max-w-screen-xl px-4 pb-10">
          <div className="pt-6 space-y-8">
            {renderAlert()}

            {proofSubmitted ? (
              renderSubmittedState()
            ) : manualOrder ? (
              renderProofStep()
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
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
                          className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                          placeholder={t("Enter your name")}
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
                          className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                          placeholder={t("Enter phone number")}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="customerEmail"
                          className="mb-2 block text-sm font-medium text-slate-800"
                        >
                          {t("Email")}{" "}
                          <span className="text-slate-400 text-xs">
                            ({t("optional")})
                          </span>
                        </label>
                        <input
                          type="email"
                          id="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                          placeholder={t("Enter email")}
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
                          className="block w-full rounded-lg border border-black bg-white p-2.5 text-sm text-gray-900"
                          placeholder={t("Enter city")}
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
                      <label className="rounded-lg border border-gray-300 bg-white p-4 ps-4">
                        <div className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              type="radio"
                              name="paymentMode"
                              value="CHAPA"
                              checked={paymentMode === "CHAPA"}
                              onChange={() => setPaymentMode("CHAPA")}
                              className="h-4 w-4 border-gray-300 bg-white"
                            />
                          </div>
                          <div className="ms-4 text-sm">
                            <p className="font-medium leading-none text-gray-900">
                              {t("Chapa")}
                            </p>
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              {t("Default checkout. Pay instantly with Chapa (+ETB 5 fee).")}
                            </p>
                          </div>
                        </div>
                      </label>
                      <label className="rounded-lg border border-gray-300 bg-white p-4 ps-4">
                        <div className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              type="radio"
                              name="paymentMode"
                              value="MANUAL_PROOF"
                              checked={paymentMode === "MANUAL_PROOF"}
                              onChange={() => setPaymentMode("MANUAL_PROOF")}
                              className="h-4 w-4 border-gray-300 bg-white"
                            />
                          </div>
                          <div className="ms-4 text-sm">
                            <p className="font-medium leading-none text-gray-900">
                              {t("Manual payment proof")}
                            </p>
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              {t("Backup option. Create the order first, then upload your payment screenshot for admin confirmation.")}
                            </p>
                          </div>
                        </div>
                      </label>
                      <label className="rounded-lg border border-gray-300 bg-white p-4 ps-4">
                        <div className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              type="radio"
                              name="paymentMode"
                              value="CASH"
                              checked={paymentMode === "CASH"}
                              onChange={() => setPaymentMode("CASH")}
                              className="h-4 w-4 border-gray-300 bg-white"
                            />
                          </div>
                          <div className="ms-4 text-sm">
                            <p className="font-medium leading-none text-gray-900">
                              {t("Cash")}
                            </p>
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              {t("Place the order now and pay offline or on delivery.")}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {t("Delivery Methods")}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded-lg border border-gray-300 bg-white p-4 ps-4">
                        <div className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id="DELIVERY"
                              type="radio"
                              name="deliveryMethod"
                              value="DELIVERY"
                              checked={formData.deliveryMethod === "DELIVERY"}
                              onChange={handleRadioChange}
                              className="h-4 w-4 border-gray-300 bg-white"
                            />
                          </div>
                          <div className="ms-4 text-sm">
                            <label
                              htmlFor="DELIVERY"
                              className="font-medium leading-none text-gray-900"
                            >
                              {t("ETB 50 - Fast Delivery")}
                            </label>
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              {t("Get it by Tomorrow")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-300 bg-white p-4 ps-4">
                        <div className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id="PICKUP"
                              type="radio"
                              name="deliveryMethod"
                              value="PICKUP"
                              checked={formData.deliveryMethod === "PICKUP"}
                              onChange={handleRadioChange}
                              className="h-4 w-4 border-gray-300 bg-white"
                            />
                          </div>
                          <div className="ms-4 text-sm">
                            <label
                              htmlFor="PICKUP"
                              className="font-medium leading-none text-gray-900"
                            >
                              {t("Free Delivery")}
                            </label>
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              {t("Get it by")}{" "}
                              {pickupDate.toLocaleDateString(
                                i18n.language === "am" ? "am-ET" : "en-US",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
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
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center rounded-[2rem] bg-[#0B1A12] px-6 py-4 text-base font-black text-white shadow-xl active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {isSubmitting
                      ? t("Processing...")
                      : paymentMode === "CHAPA"
                        ? t("Pay with Chapa")
                        : paymentMode === "CASH"
                          ? t("Place Cash Order")
                        : t("Create Order")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckoutPage;
