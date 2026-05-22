import { Outlet } from "react-router";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "../components/ui/sonner";

export const RootLayout = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <Outlet />
        <Toaster />
      </div>
    </AuthProvider>
  );
};
