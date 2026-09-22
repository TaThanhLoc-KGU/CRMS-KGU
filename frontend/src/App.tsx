import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RoomsPage from "./pages/admin/RoomsPage";
import RoomDetailPage from "./pages/admin/RoomDetailPage";
import AdminLayout from "./layouts/AdminLayout";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/rooms" replace />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/admin/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
