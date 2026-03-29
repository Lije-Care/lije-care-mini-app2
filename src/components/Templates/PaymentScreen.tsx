import { useState } from "react";
import { 
  SegmentedControl, 
   
  Text, 
  Button, 
  Input, 
  Headline
} from "@telegram-apps/telegram-ui";
import { SegmentedControlItem } from "@telegram-apps/telegram-ui/dist/components/Navigation/SegmentedControl/components/SegmentedControlItem/SegmentedControlItem";
import { useNavigate } from "react-router-dom";
import { Page } from "../Page";

const PaymentScreen = () => {
  // const themeParams = window?.Telegram?.WebApp?.themeParams || {}; // Fetch Telegram theme
  const [paymentMethod, setPaymentMethod] = useState("TeleBirr");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const navigate = useNavigate();
  // useEffect(() => {
  //   document.body.style.background = themeParams.bg_color || "#001F33";
  // }, [themeParams]);

  return (
     <Page back={true}>
    <div style={{
      padding: "20px",
      // background: themeParams.bg_color || "#001F33",
      // color: themeParams.text_color || "#fff",
      borderRadius: "10px",
      textAlign: "center"
    }}>
      {/* Header Section */}
      <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
        Payment For One Month
      </Text>
      <Headline style={{ fontSize: "32px", fontWeight: "bold", marginTop: "40px",marginBottom: "20px" }}>
        $120.00
      </Headline>

      {/* Payment Method Selection */}
      <Text style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
        Lije Care Chanaling Payment Method
      </Text>
      <SegmentedControl style={{ marginBottom: "15px" }}>
        <SegmentedControlItem
          title="TeleBirr"
          selected={paymentMethod === "TeleBirr"}
          onClick={() => setPaymentMethod("TeleBirr")}
        >TeleBirr
            </SegmentedControlItem>
        <SegmentedControlItem
          title="CBE Birr"
          selected={paymentMethod === "CBE Birr"}
          onClick={() => setPaymentMethod("CBE Birr")}
        >CBE Birr
            </SegmentedControlItem>
      </SegmentedControl>

      {/* Input Fields */}
      <Text style={{ fontSize: "14px", fontWeight: "bold", textAlign: "left" }}>
        Full Name
      </Text>
      <Input 
        placeholder="Enter Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        style={{ marginBottom: "10px" }}
      />

      <Text style={{ fontSize: "14px", fontWeight: "bold", textAlign: "left" }}>
        {paymentMethod} Mobile No
      </Text>
      <Input 
        placeholder={`Enter ${paymentMethod} Mobile No`}
        value={mobileNumber}
        onChange={(e) => setMobileNumber(e.target.value)}
        style={{ marginBottom: "20px" }}
      />

      {/* Pay Now Button */}
      <Button 

        onClick={() => navigate("/checkout")}
       
      >Pay now</Button>

    </div>
    </Page>
  );
};

export default PaymentScreen;
