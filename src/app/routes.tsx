import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LibraryCatalogPage } from "./pages/LibraryCatalogPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { FinesPage } from "./pages/FinesPage";
import { MyFinesPage } from "./pages/MyFinesPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { SubjectDetailPage } from "./pages/SubjectDetailPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { BookManagementPage } from "./pages/BookManagementPage";
import { ActiveLoansPage } from "./pages/ActiveLoansPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { MyLoansPage } from "./pages/MyLoansPage";
import { RoomsPage } from "./pages/RoomsPage";
import { MyRoomReservationsPage } from "./pages/MyRoomReservationsPage";
import { RoomsManagementPage } from "./pages/RoomsManagementPage";
import { AdminReservationsPage } from "./pages/AdminReservationsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("accessToken");
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "dashboard", element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: "library", element: <ProtectedRoute><LibraryCatalogPage /></ProtectedRoute> },
      { path: "library/book/:id", element: <ProtectedRoute><BookDetailPage /></ProtectedRoute> },
      { path: "fines", element: <ProtectedRoute><FinesPage /></ProtectedRoute> },
      { path: "my-fines", element: <ProtectedRoute><MyFinesPage /></ProtectedRoute> },
      { path: "subjects", element: <ProtectedRoute><SubjectsPage /></ProtectedRoute> },
      { path: "subjects/:id", element: <ProtectedRoute><SubjectDetailPage /></ProtectedRoute> },
      { path: "reservations", element: <ProtectedRoute><AdminReservationsPage /></ProtectedRoute> },
      { path: "users", element: <ProtectedRoute><UserManagementPage /></ProtectedRoute> },
      { path: "book-management", element: <ProtectedRoute><BookManagementPage /></ProtectedRoute> },
      { path: "active-loans", element: <ProtectedRoute><ActiveLoansPage /></ProtectedRoute> },
      { path: "statistics", element: <ProtectedRoute><StatisticsPage /></ProtectedRoute> },
      { path: "my-loans", element: <ProtectedRoute><MyLoansPage /></ProtectedRoute> },
      { path: "rooms", element: <ProtectedRoute><RoomsPage /></ProtectedRoute> },
      { path: "my-room-reservations", element: <ProtectedRoute><MyRoomReservationsPage /></ProtectedRoute> },
      { path: "rooms-management", element: <ProtectedRoute><RoomsManagementPage /></ProtectedRoute> },
      { path: "reports", element: <ProtectedRoute><ReportsPage /></ProtectedRoute> },
      { path: "settings", element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
    ],
  },
]);
