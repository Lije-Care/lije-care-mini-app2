import type { ComponentType, JSX } from "react";

// Existing pages
import { BookDoctorsPage } from "@/pages/BookDoctorsPage.tsx";
import SigninPage from "@/pages/auth/SigninPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ProfileScreen from "@/pages/Profile";
import PaymentScreen from "@/components/Templates/PaymentScreen";
import PaymentSuccessScreen from "@/pages/PaymentSuccessScreen";
import MealPlanPage from "@/pages/meal/MealPlanPage";
import ConsultationBookingPage from "@/pages/ConsultationBookingPage";
import ChildProfilePage from "@/pages/ChildProfilePage";
import ChildrenListPage from "@/pages/ChildrenListPage";
import ProductDetailPage from "@/pages/ecommerce/products/ProductDetailPage";
import CheckoutPage from "@/pages/ecommerce/checkout/CheckoutPage";

// New pages with new design
import HomeDashboard from "@/pages/home/HomeDashboard";
import AssessmentView from "@/pages/assessment/AssessmentView";
import MealsView from "@/pages/meals/MealsView";
import ShopView from "@/pages/shop/ShopView";
import CallCenterView from "@/pages/Consultation/CallCenterView";
import Onboarding from "@/pages/onboarding";

interface Route {
  path: string;
  Component: ComponentType;
  protected?: boolean;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  // New design routes (primary navigation)
  { path: "/", Component: HomeDashboard, protected: true },
  { path: "/onboarding", Component: Onboarding, protected: false },
  { path: "/assessment", Component: AssessmentView, protected: true },
  { path: "/meals", Component: MealsView, protected: true },
  { path: "/consultation", Component: CallCenterView, protected: true },

  // E-commerce routes (using new ShopView design)
  {
    path: "/ecommerce",
    Component: ShopView,
    title: "Shop",
    protected: true,
  },
  {
    path: "/product-detail/:id",
    Component: ProductDetailPage,
    title: "Product Detail",
    protected: true,
  },
  {
    path: "/checkout/page",
    Component: CheckoutPage,
    title: "Checkout",
    protected: true,
  },

  // Auth routes
  { path: "/signin", Component: SigninPage, title: "SignIn" },
  { path: "/signup", Component: SignUpPage, title: "SignUp" },

  // Profile & Children routes
  {
    path: "/profile",
    Component: ProfileScreen,
    title: "Profile",
    protected: true,
  },
  {
    path: "/children",
    Component: ChildrenListPage,
    title: "My Children",
    protected: true,
  },
  {
    path: "/child/:childId",
    Component: ChildProfilePage,
    title: "Child Profile",
    protected: true,
  },

  // Legacy routes (keeping for backward compatibility)
  {
    path: "/book",
    Component: BookDoctorsPage,
    title: "Booking Page",
    protected: true,
  },
  {
    path: "/payment",
    Component: PaymentScreen,
    title: "Payment Page",
    protected: true,
  },
  {
    path: "/checkout",
    Component: PaymentSuccessScreen,
    title: "Payment Page",
    protected: true,
  },
  {
    path: "/meal-plans",
    Component: MealPlanPage,
    title: "Meal Plans",
    protected: true,
  },
  {
    path: "/consultation/:doctorId",
    Component: ConsultationBookingPage,
    title: "Book Consultation",
    protected: true,
  },
];
