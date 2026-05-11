import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { LoginPage } from "./pages/LoginPage";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LoginPage },
      { path: "role-selection", Component: RoleSelectionPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "library", Component: LibraryCatalogPage },
      { path: "library/book/:id", Component: BookDetailPage },
      { path: "library/loans", Component: LoanManagementPage },
      { path: "fines", Component: FinesPage },
      { path: "my-fines", Component: MyFinesPage },
      { path: "library/rooms", Component: RoomReservationPage },
      { path: "subjects", Component: SubjectsPage },
      { path: "subjects/:id", Component: SubjectDetailPage },
      { path: "reservations", Component: ReservationsPage },
      { path: "users", Component: UserManagementPage },
      { path: "book-management", Component: BookManagementPage },
      { path: "active-loans", Component: ActiveLoansPage },
      { path: "statistics", Component: StatisticsPage },
      { path: "my-loans", Component: MyLoansPage },
      { path: "rooms", Component: RoomsPage },
      { path: "my-room-reservations", Component: MyRoomReservationsPage },
      { path: "room-reservations-management", Component: RoomReservationsManagementPage },
    ],
  },
]);
