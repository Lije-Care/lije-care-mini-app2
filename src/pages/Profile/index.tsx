import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BottomSheet } from "@/components/ui";
import ParentProfile from "@/components/ParentProfile";
import ChildProfile from "@/components/ChildProfile";
import AccountSettings from "@/components/AccountSetting";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ChildIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5"/>
    <path d="M20 21a8 8 0 0 0-16 0"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [isParentOpen, setIsParentOpen] = useState(false);
  const [isAccountSettingOpen, setIsAccountSettingOpen] = useState(false);
  const [isChildOpen, setIsChildOpen] = useState(false);

  const parentState = useSelector((state: RootState) => state.parent);
  const parent = parentState?.parent as any;

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("user-language", lang);
  };

  const profileOptions = [
    {
      icon: <UserIcon />,
      label: t("Parent Profile"),
      description: t("View and edit your profile"),
      onClick: () => setIsParentOpen(true),
      color: "sky",
    },
    {
      icon: <ChildIcon />,
      label: t("Child Profile"),
      description: t("Manage your children's profiles"),
      onClick: () => navigate("/children"),
      color: "emerald",
    },
    {
      icon: <SettingsIcon />,
      label: t("Account Settings"),
      description: t("Password, logout, delete account"),
      onClick: () => setIsAccountSettingOpen(true),
      color: "purple",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-['Quicksand']">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-500 to-sky-600 pt-6 pb-20 px-6 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            <BackIcon />
          </button>
          <h1 className="text-xl font-bold text-white">{t("Profile")}</h1>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">👤</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {parent?.firstName || "Parent"} {parent?.lastName || ""}
            </h2>
            <p className="text-sky-100">{parent?.phone || ""}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-12 relative z-20 pb-32">
        {/* Profile Options Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 overflow-hidden mb-6">
          {profileOptions.map((option, index) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className={`w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left ${
                index !== profileOptions.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                option.color === "sky" ? "bg-sky-100 text-sky-600" :
                option.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                "bg-purple-100 text-purple-600"
              }`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{option.label}</h3>
                <p className="text-sm text-slate-500">{option.description}</p>
              </div>
              <div className="text-slate-300">
                <ChevronRightIcon />
              </div>
            </button>
          ))}
        </div>

        {/* Language Switcher */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <GlobeIcon />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{t("Language")}</h3>
              <p className="text-sm text-slate-500">{t("Choose your preferred language")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { code: "en", label: "English", flag: "🇺🇸" },
              { code: "am", label: "አማርኛ", flag: "🇪🇹" },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`py-4 px-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  i18n.language === lang.code
                    ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200"
                    : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sheets */}
      <BottomSheet
        isOpen={isParentOpen}
        onClose={() => setIsParentOpen(false)}
        title={t("Parent Profile")}
      >
        <ParentProfile onClose={() => setIsParentOpen(false)} />
      </BottomSheet>

      <BottomSheet
        isOpen={isAccountSettingOpen}
        onClose={() => setIsAccountSettingOpen(false)}
        title={t("Account Settings")}
      >
        <AccountSettings onClose={() => setIsAccountSettingOpen(false)} />
      </BottomSheet>

      <BottomSheet
        isOpen={isChildOpen}
        onClose={() => setIsChildOpen(false)}
        title={t("Child Profile")}
      >
        <ChildProfile />
      </BottomSheet>
    </div>
  );
}
