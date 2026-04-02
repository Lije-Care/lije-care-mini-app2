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
import AuthGate from "./AuthGate";
import { ProfileOverlayProvider } from "@/context/ProfileOverlayContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProfileOverlay from "@/components/ProfileOverlay";

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
import Onboarding from "@/pages/onboarding";

// Main tab destinations — only these show the bottom nav and header
const MAIN_TAB_PATHS = [
  "/",
  "/assessment",
  "/meals",
  "/ecommerce",
  "/consultation",
];

const normalizePath = (pathname: string) => {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isFullyOnboarded } = useAuth();
  const currentPath = normalizePath(location.pathname);
  const isMainTabPath = MAIN_TAB_PATHS.includes(currentPath);

  const shouldHideNavbar = !isFullyOnboarded || !isMainTabPath;

  const shouldHideHeader = !isFullyOnboarded || !isMainTabPath;

  return (
    <ProfileOverlayProvider>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-['Quicksand'] text-[var(--ink)]">
        {!shouldHideHeader && <Header />}

        <main className="flex-1 overflow-y-auto hide-scrollbar">
          {children}
        </main>

        {!shouldHideNavbar && <BottomNav />}

        <ProfileOverlay />
      </div>
    </ProfileOverlayProvider>
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
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Onboarding route - outside AuthGate */}
              <Route path="/onboarding" element={<Onboarding />} />

              {/* All other routes - wrapped with AuthGate */}
              {routes
                .filter(({ path }) => path !== "/onboarding")
                .map(({ path, Component, protected: isProtected }) => {
                  const wrapped = isProtected ? (
                    <AuthGate>
                      <ProtectedRoute>
                        <Component />
                      </ProtectedRoute>
                    </AuthGate>
                  ) : (
                    <Component />
                  );

                  return <Route key={path} path={path} element={wrapped} />;
                })}

              {/* New Routes */}
              <Route
                path="/assessment"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <AssessmentView />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/meals"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <MealsView />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />

              {/* Existing Routes */}
              <Route
                path="/add-child"
                element={
                  <AuthGate>
                    <AddChildPage />
                  </AuthGate>
                }
              />
              <Route
                path="/meal/:id"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <MealComponent />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/my-appointments"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <MyAppointments />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/mealplansummary"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <MealPlanSummary />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/mealplansummary/:id"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <ChildMealPlanSummery />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/meal-plans/edit/:id"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <EditMealPlan />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/detail/:id"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <MealDetails />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/chat/:doctorId"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <ChatScreen />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/consultat"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <ConsultationTab />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/video-call"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <VideoCall />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/consultat/:doctorId"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <DoctorDetailPage />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/payment-one"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <PaymentForm />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/payment-status-one"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <PaymentStatus />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/articles"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <ArticlesPage />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/articles/:id"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <ArticleDetail />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/notifications"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/package/list"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <PackageList />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/booking/checkout"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <BookingCheckout />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />
              <Route
                path="/booking/success"
                element={
                  <AuthGate>
                    <ProtectedRoute>
                      <BookingSuccess />
                    </ProtectedRoute>
                  </AuthGate>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </HashRouter>
    </AppRoot>
  );
}
