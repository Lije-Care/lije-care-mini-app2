import { useLaunchParams } from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import {
  Navigate,
  Route,
  Routes,
  HashRouter,
  useLocation,
} from "react-router-dom";

import { routes } from "@/navigation/routes.tsx";
import { Header, BottomNav } from "@/components/layout";
import ProtectedRoute from "./ProtectedRoute";

// Existing pages (keeping for compatibility)
import MealComponent from "@/pages/meal/MealPlan";
import MealPlanSummary from "@/pages/meal/MealPlanSummary";
import EditMealPlan from "@/pages/meal/EditMealPLan";
import VideoCall from "@/pages/Consultation/VideoCall";
import MealDetails from "@/pages/meal/MealView";
import ArticlesPage from "@/pages/knowledgebase/ArticleSlider";
import ArticleDetail from "@/pages/knowledgebase/ArticleDetail";
import AddChildPage from "./AddChildPage";
import DoctorDetailPage from "@/pages/DoctorDetailPage";
import MyAppointments from "@/pages/MyAppointments";
import ChatScreen from "@/pages/Consultation/ChatScreen";
import NotificationsPage from "@/pages/NotificationsPage";
import ChildMealPlanSummery from "@/pages/meal/ChildMealPlanSummery";
import PaymentForm from "./PaymentForm";
import PaymentStatus from "./PaymentStatus";
import BookingCheckout from "./booking/BookingCheckout";
import PackageList from "./booking/PackageList";
import BookingSuccess from "./booking/BookingSuccess";
import ConsultationTab from "@/pages/ConsultationBookingPage";

// New pages
import AssessmentView from "@/pages/assessment/AssessmentView";
import MealsView from "@/pages/meals/MealsView";

import { useState } from "react";

// Paths where navbar and header should be hidden
const HIDE_NAVBAR_PATHS = ["/signin", "/onboarding", "/signup", "/video-call", "/chat"];
const HIDE_HEADER_PATHS = ["/signin", "/onboarding", "/signup", "/video-call", "/chat"];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [, setSelectedChildId] = useState<string | null>(
    localStorage.getItem("favorite_child_id")
  );

  const shouldHideNavbar = HIDE_NAVBAR_PATHS.some(path =>
    location.pathname.startsWith(path) || location.pathname === path
  );

  const shouldHideHeader = HIDE_HEADER_PATHS.some(path =>
    location.pathname.startsWith(path) || location.pathname === path
  );

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-['Quicksand']">
      {!shouldHideHeader && <Header onChildChange={handleChildChange} />}

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {children}
      </main>

      {!shouldHideNavbar && <BottomNav />}
    </div>
  );
};

export function App() {
  const lp = useLaunchParams();

  return (
    <AppRoot
      appearance="light"
      platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
    >
      <HashRouter>
        <Layout>
          <Routes>
            {routes.map(({ path, Component, protected: isProtected }) => {
              const wrapped = isProtected ? (
                <ProtectedRoute>
                  <Component />
                </ProtectedRoute>
              ) : (
                <Component />
              );

              return <Route key={path} path={path} element={wrapped} />;
            })}

            {/* New Routes */}
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <AssessmentView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meals"
              element={
                <ProtectedRoute>
                  <MealsView />
                </ProtectedRoute>
              }
            />

            {/* Existing Routes */}
            <Route path="/add-child" element={<AddChildPage />} />
            <Route
              path="/meal/:id"
              element={
                <ProtectedRoute>
                  <MealComponent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-appointments"
              element={
                <ProtectedRoute>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mealplansummary"
              element={
                <ProtectedRoute>
                  <MealPlanSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mealplansummary/:id"
              element={
                <ProtectedRoute>
                  <ChildMealPlanSummery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meal-plans/edit/:id"
              element={
                <ProtectedRoute>
                  <EditMealPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/detail/:id"
              element={
                <ProtectedRoute>
                  <MealDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:doctorId"
              element={
                <ProtectedRoute>
                  <ChatScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultat"
              element={
                <ProtectedRoute>
                  <ConsultationTab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-call"
              element={
                <ProtectedRoute>
                  <VideoCall />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultat/:doctorId"
              element={
                <ProtectedRoute>
                  <DoctorDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-one"
              element={
                <ProtectedRoute>
                  <PaymentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-status-one"
              element={
                <ProtectedRoute>
                  <PaymentStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/articles"
              element={
                <ProtectedRoute>
                  <ArticlesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/articles/:id"
              element={
                <ProtectedRoute>
                  <ArticleDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/package/list"
              element={
                <ProtectedRoute>
                  <PackageList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/checkout"
              element={
                <ProtectedRoute>
                  <BookingCheckout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/success"
              element={
                <ProtectedRoute>
                  <BookingSuccess />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppRoot>
  );
}
