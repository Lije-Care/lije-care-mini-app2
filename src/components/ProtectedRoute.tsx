// components/ProtectedRoute.tsx

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return null; // AuthGate handles authentication
  }

  return children;
};

export default ProtectedRoute;
