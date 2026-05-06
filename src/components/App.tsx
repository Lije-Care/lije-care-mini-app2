import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import {
  Navigate,
  Route,
  Routes,
  HashRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import { routes } from "@/navigation/routes.tsx";
import { Header, BottomNav } from "@/components/layout";
import ProtectedRoute from "./ProtectedRoute";
import AuthGate from "./AuthGate";
import { ProfileOverlayProvider } from "@/context/ProfileOverlayContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProfileOverlay from "@/components/ProfileOverlay";

const MealComponent = lazy(() => import("@/pages/meal/MealPlan"));
const MealPlanSummary = lazy(() => import("@/pages/meal/MealPlanSummary"));
const EditMealPlan = lazy(() => import("@/pages/meal/EditMealPLan"));
const VideoCall = lazy(() => import("@/pages/Consultation/VideoCall"));
const MealDetails = lazy(() => import("@/pages/meal/MealView"));
const ArticlesPage = lazy(() => import("@/pages/knowledgebase/ArticleSlider"));
const ArticleDetail = lazy(() => import("@/pages/knowledgebase/ArticleDetail"));
const AddChildPage = lazy(() => import("./AddChildPage"));
const DoctorDetailPage = lazy(() => import("@/pages/DoctorDetailPage"));
const MyAppointments = lazy(() => import("@/pages/MyAppointments"));
const ChatScreen = lazy(() => import("@/pages/Consultation/ChatScreen"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ChildMealPlanSummery = lazy(() => import("@/pages/meal/ChildMealPlanSummery"));
const PaymentForm = lazy(() => import("./PaymentForm"));
const PaymentStatus = lazy(() => import("./PaymentStatus"));
const BookingCheckout = lazy(() => import("./booking/BookingCheckout"));
const PackageList = lazy(() => import("./booking/PackageList"));
const BookingSuccess = lazy(() => import("./booking/BookingSuccess"));
const ConsultationTab = lazy(() => import("@/pages/ConsultationBookingPage"));
const AssessmentView = lazy(() => import("@/pages/assessment/AssessmentView"));
const MealsView = lazy(() => import("@/pages/meals/MealsView"));
const Onboarding = lazy(() => import("@/pages/onboarding"));

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
  const navigate = useNavigate();
  const { isFullyOnboarded } = useAuth();
  const currentPath = normalizePath(location.pathname);
  const isMainTabPath = MAIN_TAB_PATHS.includes(currentPath);

  const shouldHideNavbar = !isFullyOnboarded || !isMainTabPath;

  const shouldHideHeader = !isFullyOnboarded || !isMainTabPath;

  useEffect(() => {
    if (!backButton.isMounted()) {
      return;
    }

    const shouldShowBackButton = !isMainTabPath;

    if (shouldShowBackButton) {
      backButton.show();
    } else {
      backButton.hide();
    }

    const handleBack = () => {
      const backIntent = new CustomEvent("lije:back-intent", {
        cancelable: true,
        detail: {
          pathname: location.pathname,
        },
      });

      window.dispatchEvent(backIntent);

      if (backIntent.defaultPrevented) {
        return;
      }

      navigate(-1);
    };

    if (shouldShowBackButton) {
      backButton.onClick(handleBack);
    }

    return () => {
      backButton.offClick(handleBack);
    };
  }, [isMainTabPath, navigate]);

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
            <Suspense
              fallback={
                <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm font-medium text-slate-500">
                  Loading...
                </div>
              }
            >
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
            </Suspense>
          </Layout>
        </AuthProvider>
      </HashRouter>
    </AppRoot>
  );
}
