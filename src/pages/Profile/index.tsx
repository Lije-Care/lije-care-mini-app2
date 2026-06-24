import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui";
import toast from "react-hot-toast";
import ParentProfile from "@/components/ParentProfile";
import AccountSettings from "@/components/AccountSetting";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { addChild, updateChild, deleteChildById } from "@/redux/slices/childSlice";
import { GlobeIcon, LogOutIcon } from "@/design-system/icons";
import BabyProfileSheet from "./BabyProfileSheet";
import SwitchBabySheet from "./SwitchBabySheet";
import AddChildSheet from "./AddChildSheet";
import AllergenSheet from "./AllergenSheet";
import type { Child } from "@/redux/slices/childSlice";
import type { Gender } from "@/design-system/types";
import { signOutAndCloseApp } from "@/utils/logout";

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

const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l1.5 4"/>
    <path d="M18 2l-1.5 4"/>
    <path d="M3 7h18"/>
    <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/>
    <path d="M9 11v6"/>
    <path d="M15 11v6"/>
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

export default function ProfileScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();

  const [isParentOpen, setIsParentOpen] = useState(false);
  const [isAccountSettingOpen, setIsAccountSettingOpen] = useState(false);
  const [isBabyProfileOpen, setIsBabyProfileOpen] = useState(false);
  const [isSwitchBabyOpen, setIsSwitchBabyOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isAllergenOpen, setIsAllergenOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeChildAllergens, setActiveChildAllergens] = useState<string[]>([]);

  const parentState = useSelector((state: RootState) => state.parent);
  const parent = parentState?.parent as any;
  const childrenState = useSelector((state: RootState) => state.children);
  const children = childrenState?.data || [];

  const [activeChildId, setActiveChildId] = useState<string | null>(
    localStorage.getItem("favorite_child_id")
  );

  const activeChild = children.find((c) => c.id === activeChildId) || children[0] || null;

  useEffect(() => {
    if (activeChild && !activeChildId) {
      setActiveChildId(activeChild.id);
      localStorage.setItem("favorite_child_id", activeChild.id);
    }
  }, [activeChild, activeChildId]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("user-language", lang);
  };

  const handleSwitchChild = (childId: string) => {
    setActiveChildId(childId);
    localStorage.setItem("favorite_child_id", childId);
    setIsSwitchBabyOpen(false);
  };

  const handleSaveBabyProfile = async (data: Partial<Child>) => {
    try {
      await dispatch(updateChild(data)).unwrap();
      toast.success(t("Child profile updated successfully."));
      setIsBabyProfileOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("Failed to update child.");
      toast.error(message);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await dispatch(deleteChildById(childId)).unwrap();
      toast.success(t("Child profile deleted successfully."));
      setIsBabyProfileOpen(false);
      if (activeChildId === childId) {
        const remaining = children.filter((c) => c.id !== childId);
        if (remaining.length > 0) {
          setActiveChildId(remaining[0].id);
          localStorage.setItem("favorite_child_id", remaining[0].id);
        } else {
          setActiveChildId(null);
          localStorage.removeItem("favorite_child_id");
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("Failed to delete child.");
      toast.error(message);
    }
  };

  const handleAddChild = async (childData: {
    name: string;
    gender: Gender;
    birthDate: string;
    weight?: number;
    height?: number;
    muac?: number;
    activityLevel: 'Active' | 'Moderate' | 'Sedentary';
    allergens?: string[];
  }) => {
    try {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const parentId = user?.id;

      if (!parentId) {
        toast.error(t("User ID not found. Please log in again."));
        return;
      }

      const genderMap: Record<string, "Male" | "Female"> = {
        boy: "Male",
        girl: "Female",
      };

      const result = await dispatch(
        addChild({
          name: childData.name,
          date_of_birth: childData.birthDate,
          gender: genderMap[childData.gender] || "Male",
          weight: childData.weight || 0,
          height: childData.height || 0,
          muac: childData.muac || 0,
          activity_level: childData.activityLevel,
          parentId,
        })
      ).unwrap();

      setActiveChildId(result.id);
      localStorage.setItem("favorite_child_id", result.id);
      toast.success(t("Child added successfully."));
      setIsAddChildOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("Failed to add child");
      toast.error(message);
    }
  };

  const handleOpenAllergens = () => {
    setActiveChildAllergens(
      activeChild?.allergies ? activeChild.allergies.split(",").map((a) => a.trim()) : []
    );
    setIsBabyProfileOpen(false);
    setIsAllergenOpen(true);
  };

  const handleSaveAllergens = async () => {
    if (!activeChild) return;
    try {
      await dispatch(
        updateChild({
          id: activeChild.id,
          allergies: activeChildAllergens.join(", "),
        })
      ).unwrap();
      toast.success(t("Allergens updated successfully."));
      setIsAllergenOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("Failed to update allergens.");
      toast.error(message);
    }
  };

  const handleSignOut = () => {
    signOutAndCloseApp(() => {
      navigate("/");
      window.location.reload();
    });
  };

  const activeChildAvatar = activeChild
    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(activeChild.name)}`
    : null;

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
      label: t("Baby Profile"),
      description: activeChild ? activeChild.name : t("Manage your children's profiles"),
      onClick: () => activeChild && setIsBabyProfileOpen(true),
      color: "emerald",
    },
    {
      icon: <ShoppingBagIcon />,
      label: t("My Orders"),
      description: t("Track shop payments and delivery progress"),
      onClick: () => navigate("/my-orders"),
      color: "amber",
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            <BackIcon />
          </button>
          <h1 className="text-xl font-bold text-white">{t("Profile")}</h1>
        </div>

        {/* Profile Info with Active Child */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            {activeChildAvatar ? (
              <img src={activeChildAvatar} alt={activeChild?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {parent?.firstName || t("Parent")} {parent?.lastName || ""}
            </h2>
            <p className="text-sky-100">{parent?.phone || ""}</p>
          </div>
        </div>

        {/* Baby Actions */}
        {activeChild && (
          <div className="flex gap-3 mt-4 relative z-10">
            <button
              onClick={() => setIsBabyProfileOpen(true)}
              className="px-4 py-2 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition-colors"
            >
              {t("Baby Profile")}
            </button>
            <button
              onClick={() => setIsSwitchBabyOpen(true)}
              className="px-4 py-2 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition-colors"
            >
              {t("Switch Baby")}
            </button>
          </div>
        )}
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
                option.color === "amber" ? "bg-amber-100 text-amber-600" :
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
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-5 mb-6">
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

        {/* Sign Out */}
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-5 flex items-center gap-4 text-left mb-6"
        >
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
            <LogOutIcon />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-rose-600">{t("Sign Out")}</h3>
            <p className="text-sm text-slate-500">{t("Sign out of your account")}</p>
          </div>
          <div className="text-slate-300">
            <ChevronRightIcon />
          </div>
        </button>

        {/* Version */}
        <p className="text-center text-slate-400 text-xs font-bold">Lije Care v1.0.0</p>
      </div>

      {/* Sign Out Confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <LogOutIcon size={32} className="text-rose-500" />
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-3">{t("Sign Out")}</h4>
            <p className="text-slate-500 text-sm mb-8">
              {t("Ready to leave? We will keep your progress safe until you return.")}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl active:scale-95 transition-all"
              >
                {t("Sign Out Now")}
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="w-full py-3 text-slate-500 font-bold"
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

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
        isOpen={isBabyProfileOpen}
        onClose={() => setIsBabyProfileOpen(false)}
        title={t("Baby Profile")}
      >
        {activeChild && (
          <BabyProfileSheet
            child={activeChild}
            onSave={handleSaveBabyProfile}
            onDelete={handleDeleteChild}
            onOpenAllergens={handleOpenAllergens}
          />
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={isSwitchBabyOpen}
        onClose={() => setIsSwitchBabyOpen(false)}
        title={t("Switch Baby")}
      >
        <SwitchBabySheet
          children={children}
          activeChildId={activeChildId}
          onSelect={handleSwitchChild}
          onAddChild={() => {
            setIsSwitchBabyOpen(false);
            setIsAddChildOpen(true);
          }}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        title={t("Add Child")}
      >
        <AddChildSheet
          onComplete={handleAddChild}
          onClose={() => setIsAddChildOpen(false)}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={isAllergenOpen}
        onClose={() => setIsAllergenOpen(false)}
        title={t("Manage Allergens")}
      >
        <AllergenSheet
          allergens={activeChildAllergens}
          onChange={setActiveChildAllergens}
          onSave={handleSaveAllergens}
        />
      </BottomSheet>
    </div>
  );
}
