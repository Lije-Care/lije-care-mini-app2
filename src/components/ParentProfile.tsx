import { useState, ChangeEvent, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Button, Input } from "@/components/ui";
import { updateParent } from "@/redux/slices/itemSlice";
import type { ParentInfo } from "@/types";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

interface ParentProfileProps {
  onClose?: () => void;
}

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const ParentProfile = (_props: ParentProfileProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const parentState = useSelector((state: RootState) => state.parent);
  const parent = parentState?.parent as unknown as ParentInfo;

  const [formData, setFormData] = useState<ParentInfo>({
    firstName: parent?.firstName || "",
    lastName: parent?.lastName || "",
    phone: parent?.phone || "",
    address: parent?.address || "",
    city: parent?.city || "",
    telegram_username: parent?.telegram_username || "",
    email: parent?.email || "",
    avatarUrl: parent?.avatarUrl || "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(
        updateParent({
          updatedParent: formData,
          userID: telegramUser?.id ?? "",
        })
      );
      toast.success(t("Profile updated successfully!"));
      setIsEditing(false);
    } catch (error) {
      toast.error(t("Failed to update profile"));
    } finally {
      setLoading(false);
    }
  };

  const profileFields = [
    { name: "firstName", label: t("First Name"), icon: "👤" },
    { name: "lastName", label: t("Last Name"), icon: "👤" },
    { name: "phone", label: t("Phone Number"), icon: "📱" },
    { name: "address", label: t("Address"), icon: "📍" },
    { name: "city", label: t("City"), icon: "🏙️" },
    { name: "telegram_username", label: t("Telegram Username"), icon: "✈️" },
    { name: "email", label: t("Email"), icon: "📧" },
  ];

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("First Name")}
            name="firstName"
            placeholder={t("Enter first name")}
            value={formData.firstName}
            onChange={handleChange}
          />
          <Input
            label={t("Last Name")}
            name="lastName"
            placeholder={t("Enter last name")}
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <Input
          label={t("Phone Number")}
          name="phone"
          type="tel"
          placeholder={t("Enter phone number")}
          value={formData.phone}
          onChange={handleChange}
        />

        <Input
          label={t("Email")}
          name="email"
          type="email"
          placeholder={t("Enter email")}
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label={t("Address")}
          name="address"
          placeholder={t("Enter address")}
          value={formData.address}
          onChange={handleChange}
        />

        <Input
          label={t("City")}
          name="city"
          placeholder={t("Enter city")}
          value={formData.city}
          onChange={handleChange}
        />

        <Input
          label={t("Telegram Username")}
          name="telegram_username"
          placeholder={t("Enter Telegram username")}
          value={formData.telegram_username}
          onChange={handleChange}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            color="slate"
            fullWidth
            size="lg"
            onClick={() => setIsEditing(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            color="sky"
            fullWidth
            size="lg"
            loading={loading}
            disabled={loading}
          >
            {t("Save")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">👤</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">
            {parent?.firstName || t("Parent")} {parent?.lastName || ""}
          </h3>
          <p className="text-slate-500 text-sm">{parent?.phone || t("No phone")}</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-3 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 transition-colors"
        >
          <EditIcon />
        </button>
      </div>

      {/* Profile Fields */}
      <div className="space-y-3">
        {profileFields.map((field) => (
          <div
            key={field.name}
            className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"
          >
            <span className="text-xl">{field.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">{field.label}</p>
              <p className="text-slate-800 font-semibold">
                {(formData as any)[field.name] || t("Not set")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button
        color="sky"
        fullWidth
        size="lg"
        onClick={() => setIsEditing(true)}
        leftIcon={<EditIcon />}
      >
        {t("Edit Profile")}
      </Button>
    </div>
  );
};

export default ParentProfile;
