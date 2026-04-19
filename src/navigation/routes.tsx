import { lazy, type ComponentType, type JSX, type LazyExoticComponent } from "react";
import { Navigate } from "react-router-dom";

const BookDoctorsPage = lazy(() =>
  import("@/pages/BookDoctorsPage.tsx").then((module) => ({
    default: module.BookDoctorsPage,
  }))
);
const PaymentScreen = lazy(() => import("@/components/Templates/PaymentScreen"));
const PaymentSuccessScreen = lazy(() => import("@/pages/PaymentSuccessScreen"));
const MealPlanPage = lazy(() => import("@/pages/meal/MealPlanPage"));
const ConsultationBookingPage = lazy(() => import("@/pages/ConsultationBookingPage"));
const ChildProfilePage = lazy(() => import("@/pages/ChildProfilePage"));
const ChildrenListPage = lazy(() => import("@/pages/ChildrenListPage"));
const ProductDetailPage = lazy(() => import("@/pages/ecommerce/products/ProductDetailPage"));
const CheckoutPage = lazy(() => import("@/pages/ecommerce/checkout/CheckoutPage"));
const HomeDashboard = lazy(() => import("@/pages/home/HomeDashboard"));
const AssessmentView = lazy(() => import("@/pages/assessment/AssessmentView"));
const MealsView = lazy(() => import("@/pages/meals/MealsView"));
const ShopView = lazy(() => import("@/pages/shop/ShopView"));
const CallCenterView = lazy(() => import("@/pages/Consultation/CallCenterView"));
const Onboarding = lazy(() => import("@/pages/onboarding"));

interface Route {
  path: string;
  Component:
    | ComponentType
    | LazyExoticComponent<ComponentType<any>>;
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

  // Profile redirects to home (profile is now an overlay)
  {
    path: "/profile",
    Component: () => <Navigate to="/" replace />,
    title: "Profile",
    protected: false,
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
