import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { LoginPage } from "./pages/LoginPage";
// ✅ RoleSelectionPage eliminado — ya no se usa
import { DashboardPage } from "./pages/DashboardPage";
import { LibraryCatalogPage } from "./pages/LibraryCatalogPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { LoanManagementPage } from "./pages/LoanManagementPage";
import { FinesPage } from "./pages/FinesPage";
import { MyFinesPage } from "./pages/MyFinesPage";
import { RoomReservationPage } from "./pages/RoomReservationPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { SubjectDetailPage } from "./pages/SubjectDetailPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { BookManagementPage } from "./pages/BookManagementPage";
import { ActiveLoansPage } from "./pages/ActiveLoansPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { MyLoansPage } from "./pages/MyLoansPage";
import { RoomsPage } from "./pages/RoomsPage";
import { MyRoomReservationsPage } from "./pages/MyRoomReservationsPage";
import { RoomReservationsManagementPage } from "./pages/RoomReservationsManagementPage";

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
      // ✅ role-selection eliminado
      { path: "dashboard", element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: "library", element: <ProtectedRoute><LibraryCatalogPage /></ProtectedRoute> },
      { path: "library/book/:id", element: <ProtectedRoute><BookDetailPage /></ProtectedRoute> },
      { path: "library/loans", element: <ProtectedRoute><LoanManagementPage /></ProtectedRoute> },
      { path: "fines", element: <ProtectedRoute><FinesPage /></ProtectedRoute> },
      { path: "my-fines", element: <ProtectedRoute><MyFinesPage /></ProtectedRoute> },
      { path: "library/rooms", element: <ProtectedRoute><RoomReservationPage /></ProtectedRoute> },
      { path: "subjects", element: <ProtectedRoute><SubjectsPage /></ProtectedRoute> },
      { path: "subjects/:id", element: <ProtectedRoute><SubjectDetailPage /></ProtectedRoute> },
      { path: "reservations", element: <ProtectedRoute><ReservationsPage /></ProtectedRoute> },
      { path: "users", element: <ProtectedRoute><UserManagementPage /></ProtectedRoute> },
      { path: "book-management", element: <ProtectedRoute><BookManagementPage /></ProtectedRoute> },
      { path: "active-loans", element: <ProtectedRoute><ActiveLoansPage /></ProtectedRoute> },
      { path: "statistics", element: <ProtectedRoute><StatisticsPage /></ProtectedRoute> },
      { path: "my-loans", element: <ProtectedRoute><MyLoansPage /></ProtectedRoute> },
      { path: "rooms", element: <ProtectedRoute><RoomsPage /></ProtectedRoute> },
      { path: "my-room-reservations", element: <ProtectedRoute><MyRoomReservationsPage /></ProtectedRoute> },
      { path: "room-reservations-management", element: <ProtectedRoute><RoomReservationsManagementPage /></ProtectedRoute> },
    ],
  },
]);