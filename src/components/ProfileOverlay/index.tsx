import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { addChild, updateChild, deleteChildById } from "@/redux/slices/childSlice";
import ParentProfile from "@/components/ParentProfile";
import AccountSettings from "@/components/AccountSetting";
import BabyProfileSheet from "@/pages/Profile/BabyProfileSheet";
import SwitchBabySheet from "@/pages/Profile/SwitchBabySheet";
import AddChildSheet from "@/pages/Profile/AddChildSheet";
import AllergenSheet from "@/pages/Profile/AllergenSheet";
import {
  PlusIcon,
  UserIcon,
  GlobeIcon,
  TrashIcon,
  LogOutIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  ChevronDownIcon,
} from "@/design-system/icons";
import { useProfileOverlay } from "@/context/ProfileOverlayContext";
import type { Child } from "@/redux/slices/childSlice";
import type { Gender } from "@/design-system/types";

type OverlayMode =
  | "main"
  | "babyProfile"
  | "switchBaby"
  | "addChild"
  | "allergens"
  | "userProfile"
  | "language"
  | "accountSettings";

export default function ProfileOverlay() {
  const { isProfileOpen, closeProfile } = useProfileOverlay();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<OverlayMode>("main");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeChildAllergens, setActiveChildAllergens] = useState<string[]>([]);

  const childrenState = useSelector((state: RootState) => state.children);
  const children = childrenState?.data || [];

  const [activeChildId, setActiveChildId] = useState<string | null>(
    localStorage.getItem("favorite_child_id")
  );

  const activeChild = children.find((c) => c.id === activeChildId) || children[0] || null;

  // Sync active child on mount
  useEffect(() => {
    if (activeChild && !activeChildId) {
      setActiveChildId(activeChild.id);
      localStorage.setItem("favorite_child_id", activeChild.id);
    }
  }, [activeChild, activeChildId]);

  // Reset mode when overlay opens
  useEffect(() => {
    if (isProfileOpen) {
      setMode("main");
      // Re-read favorite child from storage in case it changed
      setActiveChildId(localStorage.getItem("favorite_child_id"));
    }
  }, [isProfileOpen]);

  if (!isProfileOpen) return null;

  const activeChildAvatar = activeChild
    ? activeChild.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(activeChild.name)}`
    : null;

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) return `(${years}yr, ${months}mo)`;
    return `(${months}mo)`;
  };

  // --- Handlers (migrated from Profile/index.tsx) ---

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("user-language", lang);
  };

  const handleSwitchChild = (childId: string) => {
    setActiveChildId(childId);
    localStorage.setItem("favorite_child_id", childId);
    setMode("main");
  };

  const handleSaveBabyProfile = async (data: Partial<Child>) => {
    try {
      await dispatch(updateChild(data)).unwrap();
      setMode("main");
    } catch (error) {
      console.error("Failed to update child:", error);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await dispatch(deleteChildById(childId)).unwrap();
      setMode("main");
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
    } catch (error) {
      console.error("Failed to delete child:", error);
    }
  };

  const handleAddChild = async (childData: {
    name: string;
    gender: Gender;
    birthDate: string;
    weight?: number;
    height?: number;
    muac?: number;
    allergens?: string[];
  }) => {
    try {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const parentId = user?.id;
      if (!parentId) return;

      const genderMap: Record<string, "Male" | "Female"> = {
        boy: "Male",
        girl: "Female",
        "prefer-not-to-say": "Male",
      };

      const result = await dispatch(
        addChild({
          name: childData.name,
          date_of_birth: childData.birthDate,
          gender: genderMap[childData.gender] || "Male",
          weight: childData.weight || 0,
          height: childData.height || 0,
          muac: childData.muac || 0,
          parentId,
        })
      ).unwrap();

      setActiveChildId(result.id);
      localStorage.setItem("favorite_child_id", result.id);
      setMode("main");
    } catch (error) {
      console.error("Failed to add child:", error);
    }
  };

  const handleOpenAllergens = () => {
    setActiveChildAllergens(
      activeChild?.allergies ? activeChild.allergies.split(",").map((a) => a.trim()) : []
    );
    setMode("allergens");
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
      setMode("babyProfile");
    } catch (error) {
      console.error("Failed to update allergens:", error);
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    closeProfile();
    navigate("/");
    window.location.reload();
  };

  // --- Sub-view header ---
  const SubViewHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
      <button
        onClick={onBack}
        className="p-3 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-transform"
      >
        <ChevronDownIcon className="rotate-90" />
      </button>
      <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">{title}</h3>
      <div className="w-10" />
    </div>
  );

  // --- Render modes ---

  const renderMain = () => (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      {/* Close button */}
      <div className="px-6 py-4 flex justify-end">
        <button
          onClick={closeProfile}
          className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
        >
          <PlusIcon className="rotate-45 w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 space-y-10 pb-10">
        {/* Child avatar + name + age */}
        <section className="flex flex-col items-center pt-2">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white mb-4 border-4 border-slate-50 shadow-2xl overflow-hidden ring-4 ring-sky-50">
            {activeChildAvatar ? (
              <img src={activeChildAvatar} className="w-full h-full object-cover" alt={activeChild?.name} />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <span className="text-4xl">👶</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
            {activeChild?.name || t("No Child")}{" "}
            {activeChild?.date_of_birth && (
              <span className="text-slate-400 font-bold text-lg">
                {calculateAge(activeChild.date_of_birth)}
              </span>
            )}
          </h2>

          {/* Baby Profile / Switch Baby buttons */}
          <div className="flex gap-3 mt-8 w-full">
            {activeChild && (
              <button
                onClick={() => setMode("babyProfile")}
                className="flex-1 py-4 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-sky-100 active:scale-95 transition-all"
              >
                {t("Baby Profile")}
              </button>
            )}
            <button
              onClick={() => setMode("switchBaby")}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
            >
              {t("Switch Baby")}
            </button>
          </div>
        </section>

        {/* Menu items */}
        <section className="space-y-4">
          <div className="bg-slate-50 rounded-[2.5rem] p-2 space-y-1 border border-slate-100">
            <button
              onClick={() => setMode("userProfile")}
              className="w-full flex items-center gap-4 p-5 hover:bg-white hover:shadow-sm rounded-[2rem] transition-all group active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <UserIcon size={20} />
              </div>
              <span className="font-bold text-slate-700">{t("Your Profile")}</span>
            </button>
            <button
              onClick={() => setMode("language")}
              className="w-full flex items-center gap-4 p-5 hover:bg-white hover:shadow-sm rounded-[2rem] transition-all group active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <GlobeIcon size={20} />
              </div>
              <span className="font-bold text-slate-700">{t("Language")}</span>
            </button>
            <button
              onClick={() => setMode("accountSettings")}
              className="w-full flex items-center gap-4 p-5 hover:bg-rose-50 rounded-[2rem] transition-all text-rose-500 group active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                <TrashIcon size={20} />
              </div>
              <span className="font-bold">{t("Account Settings")}</span>
            </button>
          </div>
        </section>

        {/* Sign Out + social + version */}
        <section className="flex flex-col items-center gap-8 pt-4 pb-6">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-2 text-slate-400 font-bold px-10 py-4 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors active:scale-95"
          >
            <LogOutIcon size={20} /> {t("Sign Out")}
          </button>
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex gap-8 text-slate-300">
              <FacebookIcon className="hover:text-sky-600 transition-colors cursor-pointer w-6 h-6" />
              <InstagramIcon className="hover:text-rose-500 transition-colors cursor-pointer w-6 h-6" />
              <TikTokIcon className="hover:text-slate-900 transition-colors cursor-pointer w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
              Version 1.0.0
            </p>
          </div>
        </section>
      </div>
    </div>
  );

  const renderBabyProfile = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("Baby Profile")} onBack={() => setMode("main")} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar">
        {activeChild && (
          <BabyProfileSheet
            child={activeChild}
            onSave={handleSaveBabyProfile}
            onDelete={handleDeleteChild}
            onOpenAllergens={handleOpenAllergens}
          />
        )}
      </div>
    </div>
  );

  const renderSwitchBaby = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-bottom duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("Switch Baby")} onBack={() => setMode("main")} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar">
        <SwitchBabySheet
          children={children}
          activeChildId={activeChildId}
          onSelect={handleSwitchChild}
          onAddChild={() => setMode("addChild")}
        />
      </div>
    </div>
  );

  const renderAddChild = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("Add Child")} onBack={() => setMode("switchBaby")} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar">
        <AddChildSheet
          onComplete={handleAddChild}
          onClose={() => setMode("switchBaby")}
        />
      </div>
    </div>
  );

  const renderAllergens = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("Manage Allergens")} onBack={() => setMode("babyProfile")} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar">
        <AllergenSheet
          allergens={activeChildAllergens}
          onChange={setActiveChildAllergens}
          onSave={handleSaveAllergens}
        />
      </div>
    </div>
  );

  const renderUserProfile = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("Your Profile")} onBack={() => setMode("main")} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar">
        <ParentProfile onClose={() => setMode("main")} />
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("App Language")} onBack={() => setMode("main")} />
      <div className="flex-1 overflow-y-auto px-6 space-y-4 pt-6 pb-40 hide-scrollbar">
        {[
          { code: "en", label: "English", flag: "🇺🇸" },
          { code: "am", label: "አማርኛ", flag: "🇪🇹" },
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full p-6 flex items-center justify-between rounded-[2rem] border-2 transition-all ${
              i18n.language === lang.code
                ? "bg-emerald-50 border-emerald-500"
                : "bg-white border-slate-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">
                {lang.flag}
              </div>
              <span className="font-bold text-slate-800 text-lg">{lang.label}</span>
            </div>
            {i18n.language === lang.code && (
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-[120]">
        <button
          onClick={() => setMode("main")}
          className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-sm"
        >
          {t("Confirm Language")}
        </button>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <SubViewHeader title={t("Account Settings")} onBack={() => setMode("main")} />
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar">
        <AccountSettings onClose={() => setMode("main")} />
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-white w-full h-full max-w-md mx-auto overflow-hidden shadow-2xl">
        {mode === "main" && renderMain()}
        {mode === "babyProfile" && renderBabyProfile()}
        {mode === "switchBaby" && renderSwitchBaby()}
        {mode === "addChild" && renderAddChild()}
        {mode === "allergens" && renderAllergens()}
        {mode === "userProfile" && renderUserProfile()}
        {mode === "language" && renderLanguage()}
        {mode === "accountSettings" && renderAccountSettings()}
      </div>

      {/* Sign Out Confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-sm w-full shadow-2xl text-center">
            <div className="w-24 h-24 bg-sky-50 text-sky-500 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">
              ❓
            </div>
            <h4 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">
              {t("Sign Out")}
            </h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-10">
              {t("Ready to leave? We will keep your progress safe until you return.")}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full py-5 bg-sky-500 shadow-sky-100 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                {t("Sign Out Now")}
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="w-full py-4 text-slate-400 font-bold active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
