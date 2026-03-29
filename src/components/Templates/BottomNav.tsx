import {
  CartIcon,
  ChatIcon,
  HomeIcon,
  PersonIcon,
} from "@100mslive/react-icons";
// import { FaChildren } from "react-icons/fa6";
import { TabsList } from "@telegram-apps/telegram-ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SquareMenu } from "lucide-react"; //TableOfContents

const BottomNav = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("/");

  const tabs = [
    {
      label: <HomeIcon style={{ width: "28px", height: "24px" }} />,
      path: "/",
    },

    {
      label: <ChatIcon style={{ width: "28px", height: "24px" }} />,
      path: "/consultat",
    },
    {
      label: <SquareMenu style={{ width: "28px", height: "24px" }} />,
      path: "/children",
    },
    {
      label: <CartIcon style={{ width: "28px", height: "24px" }} />,
      path: "/ecommerce",
    },
    {
      label: <PersonIcon style={{ width: "28px", height: "24px" }} />,
      path: "/profile",
    },
  ];

  return (
    <TabsList
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        height: "7%",
        width: "100%",
        background: "#013222",
      }}
    >
      {tabs.map(({ path, label }) => (
        <TabsList.Item
          key={path}
          selected={selected === path}
          onClick={() => {
            setSelected(path);
            navigate(path);
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              fontWeight: 800, // Increased font weight
            }}
          >
            {label}
          </div>
        </TabsList.Item>
      ))}
    </TabsList>
  );
};

export default BottomNav;
