import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { BottomSheet } from "@/components/ui";
import toast from "react-hot-toast";
import api from "@/api/axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Telegram?: any;
  }
}

interface AccountSettingsProps {
  onClose?: () => void;
}

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const AccountSettings = (_props: AccountSettingsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [changeData, setChangeData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [userId, setUserId] = useState("");

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUserId(localUser?.id ?? "");
  }, []);

  const handleChangePasswordChange = (field: string, value: string) => {
    setChangeData((prev) => ({ ...prev, [field]: value }));
    setChangeError(null);
  };

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = changeData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setChangeError(t("Please fill in all password fields."));
      return;
    }

    if (newPassword.length < 6) {
      setChangeError(t("Password must be at least 6 characters."));
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError(t("New password and confirm password don't match."));
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/auth/change-password`, {
        oldPassword,
        newPassword,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(t("Password changed successfully!"));
        setShowChange(false);
        setChangeData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setChangeError(null);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes("old password")) {
        setChangeError(t("The old password is incorrect."));
      } else {
        setChangeError(errorMessage || t("Failed to change password."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    try {
      window.Telegram?.WebApp?.close();
    } catch (e) {}
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      toast.error(t("User ID not found. Please log in again."));
      return;
    }

    try {
      const res = await api.delete(`/users/delete/${userId}`);

      if (res.status === 200) {
        toast.success(t("Account deleted successfully."));
        setIsDeleting(false);
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("Failed to delete account."));
    }
  };

  const settingsOptions = [
    {
      icon: <LogOutIcon />,
      label: t("Log out"),
      description: t("Sign out of your account"),
      onClick: handleLogout,
      color: "slate",
      danger: false,
    },
    {
      icon: <KeyIcon />,
      label: t("Change Password"),
      description: t("Update your password"),
      onClick: () => setShowChange(true),
      color: "sky",
      danger: false,
    },
    {
      icon: <TrashIcon />,
      label: t("Delete Account"),
      description: t("Permanently delete your account"),
      onClick: () => setIsDeleting(true),
      color: "rose",
      danger: true,
    },
  ];

  return (
    <div className="space-y-3">
      {settingsOptions.map((option) => (
        <button
          key={option.label}
          onClick={option.onClick}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
            option.danger
              ? "border-rose-100 bg-rose-50 hover:border-rose-200"
              : "border-slate-100 bg-slate-50 hover:border-slate-200"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            option.danger
              ? "bg-rose-100 text-rose-600"
              : option.color === "sky"
              ? "bg-sky-100 text-sky-600"
              : "bg-slate-200 text-slate-600"
          }`}>
            {option.icon}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${option.danger ? "text-rose-600" : "text-slate-800"}`}>
              {option.label}
            </h3>
            <p className="text-sm text-slate-500">{option.description}</p>
          </div>
        </button>
      ))}

      {/* Change Password Sheet */}
      <BottomSheet
        isOpen={showChange}
        onClose={() => setShowChange(false)}
        title={t("Change Password")}
      >
        <div className="space-y-4">
          {changeError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
              <p className="text-rose-600 text-sm font-medium">{changeError}</p>
            </div>
          )}

          <Input
            label={t("Current Password")}
            type="password"
            placeholder={t("Enter current password")}
            value={changeData.oldPassword}
            onChange={(e) => handleChangePasswordChange("oldPassword", e.target.value)}
          />

          <Input
            label={t("New Password")}
            type="password"
            placeholder={t("Enter new password")}
            value={changeData.newPassword}
            onChange={(e) => handleChangePasswordChange("newPassword", e.target.value)}
          />

          <Input
            label={t("Confirm New Password")}
            type="password"
            placeholder={t("Confirm new password")}
            value={changeData.confirmPassword}
            onChange={(e) => handleChangePasswordChange("confirmPassword", e.target.value)}
          />

          <Button
            color="sky"
            fullWidth
            size="lg"
            onClick={handleChangePassword}
            loading={loading}
            disabled={loading}
          >
            {t("Update Password")}
          </Button>
        </div>
      </BottomSheet>

      {/* Delete Account Confirmation Sheet */}
      <BottomSheet
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title={t("Delete Account")}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {t("Are you sure?")}
            </h3>
            <p className="text-slate-500 text-sm">
              {t("This action cannot be undone. All your data will be permanently deleted.")}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              color="coral"
              fullWidth
              size="lg"
              onClick={handleDeleteAccount}
            >
              {t("Yes, Delete My Account")}
            </Button>
            <Button
              variant="secondary"
              color="slate"
              fullWidth
              size="lg"
              onClick={() => setIsDeleting(false)}
            >
              {t("Cancel")}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default AccountSettings;
