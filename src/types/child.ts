export interface CreateChildDto {
    name: string;
    date_of_birth: string;
    gender: "Male" | "Female";
    weight: number;
    height: number;
    muac: number;
    activity_level: "Active" | "Moderate" | "Sedentary";
    parentId: string;
  }
  
export interface Child {
    id: string;
    parentId: string;
    name: string;
    date_of_birth: string;
    gender: string;
    weight: number;
    height: number;
    muac: number | null;
    dietary_restrictions: string | null;
    allergies: string | null;
    medications: string | null;
    createdAt: string;
    updatedAt: string;
    growthMetrics?: Array<{
      id: string;
      bmi: number;
      weight?: number | null;
      height?: number | null;
      muac?: number | null;
      createdAt: string;
      updatedAt: string;
      childId: string;
      growth_trends?: string | null;
      height_for_age?: number | null;
      weight_for_age?: number | null;
      weight_for_height?: number | null;
    }>;
  }
