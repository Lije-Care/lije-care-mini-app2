import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Page } from "@/components/Page";
import type { ShopOrder } from "@/types/order";
import { useTranslation } from "react-i18next";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Payment",
  PENDING: "Pending Payment",
  PENDING_ADMIN_CONFIRMATION: "Waiting for admin confirmation",
  SUCCESS: "Paid",
  PAID: "Paid",
  FAILED: "Payment Failed",
  CANCELLED: "Payment Cancelled",
  REJECTED: "Payment Rejected",
};

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  READY: "Ready",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING_ADMIN_CONFIRMATION: "Waiting for approval",
  CONFIRMED: "Approved",
  REJECTED: "Rejected",
};

export default function MyOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user?.id) {
      setError(t("User not found"));
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/product/order/my-orders/${user.id}`);
      setOrders(res.data ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          t("Failed to load your orders."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [t]);

  const verifyChapaPayment = async (orderId: string) => {
    setVerifyingOrderId(orderId);
    setError("");

    try {
      await api.post(`/chapa/verify-order/${orderId}`);
      await loadOrders();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("We couldn't verify your payment."),
      );
    } finally {
      setVerifyingOrderId(null);
    }
  };

  return (
    <Page back>
      <div className="min-h-screen bg-slate-50 px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              {t("My Orders")}
            </h1>
            <p className="text-sm text-slate-500">
              {t("Track payment review and fulfillment progress for your shop orders.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/ecommerce")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"
          >
            {t("Back to Shop")}
          </button>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500">
            {t("Loading orders...")}
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
            {t("No orders found")}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t("Order ID")}
                    </p>
                    <p className="text-sm font-bold text-slate-700 break-all">
                      {order.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t("Placed")}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("Payment method")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {order.paymentMethod}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("Total")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      ETB {order.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("Payment status")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {t(PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("Fulfillment status")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {t(
                        FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus] ??
                          order.fulfillmentStatus,
                      )}
                    </p>
                  </div>
                </div>

                {order.paymentMethod === "CARD" &&
                  (order.paymentStatus === "PENDING" ||
                    order.paymentStatus === "pending") && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                      <p className="text-sm text-amber-900">
                        {t("If you already paid with Chapa but this order is still pending, verify it again here.")}
                      </p>
                      <button
                        type="button"
                        onClick={() => verifyChapaPayment(order.id)}
                        disabled={verifyingOrderId === order.id}
                        className="rounded-[2rem] bg-[#0B1A12] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        {verifyingOrderId === order.id
                          ? t("Verifying payment...")
                          : t("Verify Chapa Payment")}
                      </button>
                    </div>
                  )}

                {order.paymentReview && (
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {t("Payment review")}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {t(
                        REVIEW_STATUS_LABELS[order.paymentReview.status] ??
                          order.paymentReview.status,
                      )}
                    </p>
                    {order.paymentReview.rejectionReason && (
                      <p className="text-sm text-rose-600">
                        {order.paymentReview.rejectionReason}
                      </p>
                    )}
                    <a
                      href={order.paymentReview.paymentScreenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-bold text-sky-600 underline"
                    >
                      {t("View payment screenshot")}
                    </a>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {t("Items")}
                  </p>
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {item.productImageSnapshot && (
                          <img
                            src={item.productImageSnapshot}
                            alt={item.productNameSnapshot}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-700">
                            {item.productNameSnapshot}
                          </p>
                          <p className="text-slate-500">
                            {t("Qty")}: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-slate-700">
                        ETB {(item.priceAtPurchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
