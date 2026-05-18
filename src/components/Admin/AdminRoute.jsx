import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { session, isAdmin, profileLoading } = UserAuth();

  if (session === undefined || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
