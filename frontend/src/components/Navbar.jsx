import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate(); // React Router hook

  // Logout handler
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("authToken"); // or any key you use for login

    // Redirect to login page and replace history to prevent back navigation
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow">
      <h2 className="text-xl font-semibold text-blue-900">Admin Panel</h2>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-blue-700 hover:bg-blue-900 text-white px-4 py-1 rounded"
      >
        Logout
      </button>
    </div>
  );
}
