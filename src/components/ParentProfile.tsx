import { useState, useEffect, ChangeEvent, FormEvent } from "react";
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

  const buildFormData = (source?: ParentInfo | null): ParentInfo => ({
    firstName: source?.firstName || "",
    lastName: source?.lastName || "",
    phone: source?.phone || "",
    address: source?.address || "",
    city: source?.city || "",
    telegram_username: source?.telegram_username || "",
    avatarUrl: source?.avatarUrl || "",
  });

  const [formData, setFormData] = useState<ParentInfo>(buildFormData(parent));

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!isEditing) {
      setFormData(buildFormData(parent));
    }
  }, [parent, isEditing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!telegramUser?.id) {
      toast.error(t("User ID not found. Please log in again."));
      return;
    }

    const editableFields: Array<keyof ParentInfo> = [
      "firstName",
      "lastName",
      "address",
      "city",
      "avatarUrl",
    ];

    const changedData: Partial<ParentInfo> = {};
    editableFields.forEach((field) => {
      const currentValue = (formData[field] || "").toString().trim();
      const originalValue = (parent?.[field] || "").toString().trim();
      if (currentValue !== originalValue) {
        changedData[field] = formData[field];
      }
    });

    if (Object.keys(changedData).length === 0) {
      toast(t("No changes to save."));
      return;
    }

    setLoading(true);

    try {
      await dispatch(
        updateParent({
          updatedParent: changedData,
          userID: telegramUser?.id ?? "",
        })
      ).unwrap();
      toast.success(t("Profile updated successfully!"));
      setIsEditing(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("Failed to update profile");
      toast.error(message);
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
