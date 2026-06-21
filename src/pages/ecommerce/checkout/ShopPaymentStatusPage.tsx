import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "@/redux/slices/cartSlice";
import api from "@/api/axios";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";

type VerificationState = "loading" | "success" | "failed";

const ShopPaymentStatusPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const query = window.location.hash.split("?")[1] ?? "";
        const params = new URLSearchParams(query);
        const txRef = params.get("tx_ref");

        if (!txRef) {
          setState("failed");
          setMessage(t("We couldn't verify your payment."));
          return;
        }

        const response = await api.post("/chapa/verify", { tx_ref: txRef });
        const paymentStatus =
          response?.data?.data?.status?.toUpperCase?.() ?? "FAILED";

        if (paymentStatus === "SUCCESS" || paymentStatus === "PAID") {
          dispatch(clearCart());
          setPaymentInfo(response.data.data);
          setState("success");
          return;
        }

        setState("failed");
        setMessage(
          paymentStatus === "PENDING"
            ? t("Your payment is still pending confirmation.")
            : t("Your payment was not completed."),
        );
      } catch (error: any) {
        setState("failed");
        setMessage(
          error?.response?.data?.message ||
            error?.message ||
            t("We couldn't verify your payment."),
        );
      }
    };

    void verifyPayment();
  }, [dispatch, t]);

  if (state === "loading") {
    return (
      <Page back>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500">
            {t("Verifying your payment...")}
          </div>
        </div>
      </Page>
    );
  }

  if (state === "failed") {
    return (
      <Page back>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="space-y-6 rounded-[2rem] border border-rose-200 bg-white p-8 text-center">
            <div>
              <h1 className="text-2xl font-black text-rose-600">
                {t("Payment not confirmed")}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {message || t("Please complete the payment and try again.")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => navigate("/checkout/page")}
                className="rounded-[2rem] bg-[#0B1A12] px-6 py-4 text-sm font-black text-white"
              >
                {t("Back to Checkout")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-orders")}
                className="rounded-[2rem] border border-slate-200 px-6 py-4 text-sm font-black text-slate-700"
              >
                {t("View My Orders")}
              </button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page back>
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="space-y-6 rounded-[2rem] border border-emerald-200 bg-white p-8 text-center">
          <div>
            <h1 className="text-2xl font-black text-emerald-700">
              {t("Payment confirmed")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("Your order has been confirmed and is now ready for fulfillment.")}
            </p>
          </div>

          {paymentInfo && (
            <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                {t("Reference")}: {paymentInfo.tx_ref}
              </p>
              <p>
                {t("Amount")}: {paymentInfo.amount} {paymentInfo.currency}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => navigate("/my-orders")}
              className="rounded-[2rem] bg-[#0B1A12] px-6 py-4 text-sm font-black text-white"
            >
              {t("View My Orders")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/ecommerce")}
              className="rounded-[2rem] border border-slate-200 px-6 py-4 text-sm font-black text-slate-700"
            >
              {t("Continue Shopping")}
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ShopPaymentStatusPage;
