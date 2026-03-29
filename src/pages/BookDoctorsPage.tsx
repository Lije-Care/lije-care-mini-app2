import { Page } from "@/components/Page";
import { Button, SegmentedControl, Text } from "@telegram-apps/telegram-ui";
import { SegmentedControlItem } from "@telegram-apps/telegram-ui/dist/components/Navigation/SegmentedControl/components/SegmentedControlItem/SegmentedControlItem";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

export const BookDoctorsPage: FC = () => {
  // const themeParams = window?.Telegram?.WebApp?.themeParams || {}; // Fetch Telegram theme
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("11:00 AM");
  const navigate = useNavigate();
  // Available time slots
  const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM"];

  return (
    <Page back={true}>
      <div
        style={{
          padding: "20px",
          // background: themeParams.bg_color || "#001F33",
          // color: themeParams.text_color || "#fff",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        {/* Title */}
        <Text
          className="text-white"
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Select Date And Time
        </Text>

        {/* Date Selection (using input inusestead of DatePicker) */}
        <div
          style={{
            // border: `2px solid ${themeParams.link_color || "#0095FF"}`,
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "15px",
          }}
        >
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              // color: themeParams.text_color || "#fff",
              border: "none",
              outline: "none",
              fontSize: "16px",
              textAlign: "center",
            }}
          />
        </div>

        {/* Time Slot Selection */}
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "15px 0" }}
        >
          Available Time Slot
        </Text>

        <SegmentedControl
        // style={{ background: themeParams.secondary_bg_color || "#002244" }}
        >
          {timeSlots.map((time) => (
            <SegmentedControlItem
              key={time}
              title={time}
              selected={time === selectedTime}
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <Button
          stretched
          style={{ marginTop: "100px" }}
          onClick={() => navigate("/payment")}
        >
          Book
        </Button>
      </div>
    </Page>
  );
};

export default BookDoctorsPage;
