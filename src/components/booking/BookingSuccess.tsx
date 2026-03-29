import { useEffect, useState } from "react";
import { Page } from "@/components/Page";
import { Text, Button, Spinner } from "@telegram-apps/telegram-ui";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios"; // ✅ Your axios instance with env + token interceptor

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const verifyPayment = async () => {
    try {
      const hash = window.location.hash;
      const queryString = hash.split("?")[1];
      const urlParams = new URLSearchParams(queryString);
      const tx_ref = urlParams.get("tx_ref");

      if (!tx_ref) {
        setStatus("FAILED");
        setLoading(false);
        return;
      }

      // ✅ Axios handles headers automatically; just send data
      const response = await api.post("/booked/verify", { tx_ref });

      const result = response.data;
      // console.log("Payment verification result:", result);

      // ✅ Correct key based on your console data
      if (result?.data?.status?.toLowerCase() === "success") {
        setStatus("SUCCESS");
        setPaymentInfo(result.data);
      } else {
        setStatus("FAILED");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      setStatus("FAILED");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, []);

  if (loading) {
    return (
      <Page back={true}>
        <div className="flex flex-col items-center justify-center h-[100vh] text-center">
          <Spinner size="l" />
          <Text style={{ marginTop: "16px" }}>Verifying your payment...</Text>
        </div>
      </Page>
    );
  }

  if (status === "FAILED") {
    return (
      <Page back={true}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "#E57373",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <Text
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Payment Failed
          </Text>
          <Text style={{ fontSize: "16px", marginBottom: "30px" }}>
            Something went wrong. Please try again.
          </Text>

          <Button
            onClick={() => navigate("/package/list")}
            style={{ width: "80%", backgroundColor: "#E57373" }}
          >
            Try Again
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page back={true}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          textAlign: "center",
        }}
        className="bg-gray-800"
      >
        {/* Success Icon */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "#80C0A8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <Text
          className=" text-white"
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Congratulations
        </Text>
        <Text
          className=" text-white"
          style={{ fontSize: "16px", marginBottom: "10px" }}
        >
          Your payment was successful 🎉
        </Text>

        {/* ✅ Show dynamic payment info */}
        {paymentInfo && (
          <div style={{ marginBottom: "30px" }}>
            <Text className=" text-gray-100" style={{ fontSize: "16px" }}>
              {paymentInfo.customization?.title}
            </Text>
            <br />
            <Text className="text-gray-100" style={{ fontSize: "14px" }}>
              Paid by: {paymentInfo.first_name} {paymentInfo.last_name ?? ""}
            </Text>
            <Text className="text-gray-100" style={{ fontSize: "14px" }}>
              Amount: {paymentInfo.amount} {paymentInfo.currency}
            </Text>
          </div>
        )}

        <Button
          onClick={() => navigate("/consultat")}
          style={{ width: "80%", backgroundColor: "#1DA1F2" }}
        >
          Continue
        </Button>
      </div>
    </Page>
  );
};

export default BookingSuccess;
