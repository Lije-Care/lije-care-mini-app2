// import { useEffect } from "react";
import { Page } from "@/components/Page";
import { Text, Button } from "@telegram-apps/telegram-ui";
import { useNavigate } from "react-router-dom";

const PaymentSuccessScreen = () => {
  // const themeParams = window?.Telegram?.WebApp?.themeParams || {}; // Fetch Telegram theme
  const navigate = useNavigate();

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

        {/* Congratulations Message */}
        <Text
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Congratulations
        </Text>
        <Text style={{ fontSize: "16px", marginBottom: "30px" }}>
          Your Payment is Successfully
        </Text>

        {/* Back Button */}
        <Button
          title=""
          onClick={() => {
            navigate("/consultation");
          }}
          style={{ width: "80%", backgroundColor: "#1DA1F2" }}
        >
          Back
        </Button>
      </div>
    </Page>
  );
};

export default PaymentSuccessScreen;
