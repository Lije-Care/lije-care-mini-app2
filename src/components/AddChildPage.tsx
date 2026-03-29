import { useState } from "react";
import {
  useForm,
  Controller,
  SubmitHandler,
} from "react-hook-form";
import {
  Button,
  Input,
  Select,
  Spinner,
  Headline,
  Section,
} from "@telegram-apps/telegram-ui";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { addChild } from "@/redux/slices/childSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ----------------------
// Types
// ----------------------
interface FormValues {
  name: string;
  date_of_birth: string;
  gender: "Male" | "Female";
  weight: number | string;
  height: number | string;
  muac: number | string;
  activity_level: "Active" | "Moderate" | "Sedentary";
  dietary_restrictions: string;
  allergies: string;
  medications: string;
}

// ----------------------
// Component
// ----------------------
const AddChildPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const telegramUser = JSON.parse(localStorage.getItem("user") || "{}");
  const parentId = telegramUser?.id;

  const { handleSubmit, control, reset } = useForm<FormValues>({
    defaultValues: {
      name: "",
      date_of_birth: "",
      gender: "Male",
      weight: "",
      height: "",
      muac: 0,
      activity_level: "Moderate" as const,
      dietary_restrictions: "",
      allergies: "",
      medications: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setSubmitting(true);

    const childData = {
      ...data,
      parentId: parentId ?? "",
      weight: parseFloat(data.weight.toString()),
      height: parseFloat(data.height.toString()),
      muac: parseFloat(data.muac.toString()),
      activity_level: data.activity_level || ("Moderate" as const),
    };

    try {
      await dispatch(addChild(childData)).unwrap();
      reset();
      navigate("/");
    } catch (error) {
      alert(t("Failed to add child"));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Section>
        <Headline>{t("Add Your Child")}</Headline>
      </Section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-4 max-h-[80vh] overflow-y-auto px-2"
      >
        <Controller
          name="name"
          control={control}
          rules={{ required: t("Name is required") }}
          render={({ field }) => (
            <Input 
              header={t("Name")} 
              placeholder={t("Enter child's name")} 
              {...field} 
            />
          )}
        />

        <Controller
          name="date_of_birth"
          control={control}
          rules={{ required: t("Date of birth is required") }}
          render={({ field }) => (
            <Input 
              header={t("Date of Birth")} 
              type="date" 
              {...field} 
            />
          )}
        />

        <Controller
          name="gender"
          control={control}
          rules={{ required: t("Gender is required") }}
          render={({ field }) => (
            <Select header={t("Gender")} {...field}>
              <option value="Male">{t("Male")}</option>
              <option value="Female">{t("Female")}</option>
            </Select>
          )}
        />

        <Controller
          name="weight"
          control={control}
          rules={{ required: t("Weight is required") }}
          render={({ field }) => (
            <Input 
              header={t("Weight (kg)")} 
              type="number" 
              step="0.1" 
              {...field} 
            />
          )}
        />

        <Controller
          name="height"
          control={control}
          rules={{ required: t("Height is required") }}
          render={({ field }) => (
            <Input 
              header={t("Height (cm)")} 
              type="number" 
              step="0.1" 
              {...field} 
            />
          )}
        />

        <Controller
          name="muac"
          control={control}
          rules={{ required: t("MUAC is required") }}
          render={({ field }) => (
            <Input 
              header={t("MUAC (cm)")} 
              type="number" 
              step="0.1" 
              {...field} 
            />
          )}
        />

        <Controller
          name="dietary_restrictions"
          control={control}
          render={({ field }) => (
            <Input
              header={t("Dietary Restrictions")}
              placeholder={t("e.g., Lactose Intolerance")}
              {...field}
            />
          )}
        />

        <Controller
          name="allergies"
          control={control}
          render={({ field }) => (
            <Input 
              header={t("Allergies")} 
              placeholder={t("e.g., Peanuts")} 
              {...field} 
            />
          )}
        />

        <Controller
          name="medications"
          control={control}
          render={({ field }) => (
            <Input
              header={t("Medications")}
              placeholder={t("e.g., Vitamin D Supplements")}
              {...field}
            />
          )}
        />

        <div className="flex justify-end gap-4 mt-6">
          <Button stretched type="button" onClick={() => navigate("/")}>
            {t("Cancel")}
          </Button>
          <Button stretched type="submit" disabled={submitting}>
            {submitting ? <Spinner size="s" /> : t("Add Child")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddChildPage;