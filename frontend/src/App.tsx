import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RoomsPage from "./pages/admin/RoomsPage";
import RoomDetailPage from "./pages/admin/RoomDetailPage";
import BookingsQueuePage from "./pages/admin/BookingsQueuePage";
import BookingDetailPage from "./pages/admin/BookingDetailPage";
import CalendarAdminPage from "./pages/admin/CalendarAdminPage";
import ConfigPage from "./pages/admin/ConfigPage";
import UsersPage from "./pages/admin/UsersPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import LandingPage from "./pages/public/LandingPage";
import RoomsPublicPage from "./pages/public/RoomsPublicPage";
import RoomDetailPublicPage from "./pages/public/RoomDetailPublicPage";
import BookingFormPage from "./pages/public/BookingFormPage";
import BookingLookupPage from "./pages/public/BookingLookupPage";
import CalendarPublicPage from "./pages/public/CalendarPublicPage";
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/rooms" element={<RoomsPublicPage />} />
          <Route path="/rooms/:roomId" element={<RoomDetailPublicPage />} />
          <Route path="/booking/new" element={<BookingFormPage />} />
          <Route path="/lookup" element={<BookingLookupPage />} />
          <Route path="/calendar" element={<CalendarPublicPage />} />
        </Route>

        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="rooms" replace />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="bookings" element={<BookingsQueuePage />} />
          <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="calendar" element={<CalendarAdminPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="config"
            element={
              <RequireRole roles={["ADMIN"]}>
                <ConfigPage />
              </RequireRole>
            }
          />
          <Route
            path="users"
            element={
              <RequireRole roles={["ADMIN"]}>
                <UsersPage />
              </RequireRole>
            }
          />
          <Route
            path="audit-logs"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AuditLogPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
