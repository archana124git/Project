import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axios from "axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    medicines: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/doctors/dashboard-stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStats(res.data);
      } catch (error) {
        console.error("Dashboard stats fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#e5e6f0] min-h-screen">
        <Navbar />

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-teal-700">
            Dashboard
          </h1>

          {loading ? (
            <p className="text-teal-700">Loading dashboard data...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Doctors" value={stats.doctors} />
              <StatCard title="Patients" value={stats.patients} />
              <StatCard title="Medicines" value={stats.medicines} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded shadow text-teal-700">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}