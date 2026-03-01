import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function ManageDoctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch doctors (ADMIN ONLY)
  useEffect(() => {
    const fetchDoctors = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Unauthorized. Please login again.");
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/doctors`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed fetching doctors:", data);
          setDoctors([]);
        } else {
          setDoctors(data.doctors);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [navigate]);

  // Delete doctor
  const handleDeleteDoctor = async (doctorUserId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized. Please login again.");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/doctors/${doctorUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = { error: `Unexpected server response (${res.status})` };
      }

      if (!res.ok) {
        alert("Error deleting doctor: " + (data.error || "Unknown error"));
        return;
      }

      alert("Doctor deleted successfully");
      setDoctors((prev) => prev.filter((d) => d.user_id !== doctorUserId));
    } catch (err) {
      console.error("Delete doctor error:", err);
      alert("Failed to delete doctor.");
    }
  };


  if (loading) return <div className="p-6">Loading doctors...</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#e5e6f0] min-h-screen">
        <Navbar />

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-teal-700">
              Manage Doctors
            </h1>

            <button
              onClick={() => navigate("/add-doctor")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg"
            >
              Add Doctor
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
              <thead>
                <tr className="bg-teal-100 text-left">
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">License No.</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-600">
                      No doctors found
                    </td>
                  </tr>
                ) : (
                  doctors.map((doc) => (
                    <tr key={doc.user_id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-teal-700">{doc.user_id}</td>
                      <td className="p-3 text-teal-700">{doc.name}</td>
                      <td className="p-3 text-teal-700">{doc.specialization || "General"}</td>
                      <td className="p-3 text-teal-700">{doc.license_number || "-"}</td>

                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => navigate(`/doctor-profile/${doc.user_id}`)}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-1 rounded"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDeleteDoctor(doc.user_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}