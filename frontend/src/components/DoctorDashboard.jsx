import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import DoctorDropdown from "./DropDown";
import DoctorProfile from "./DoctorProfile";
import { getBookedPatients } from '../utils/appointments';
import supabase from "../supabaseClient";

import {
  Calendar,
  User,
  Search,
} from "lucide-react";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [todayPatientIds, setTodayPatientIds] = useState([]);

  // Calculate completed and pending visits for today and this doctor
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  /* ------------------------------------------------
      1️⃣ Attach token to ALL axios requests
  --------------------------------------------------*/
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      navigate("/");
    }
  }, []);

  /* ------------------------------------------------
      2️⃣ Fetch doctor details using /doctors/me
  --------------------------------------------------*/
  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/doctors/me")
      .then((res) => {
        setDoctorProfile(res.data.doctor);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching doctor profile:", err);
        navigate("/");
      });
  }, []);
  /* -----------------------------------------
   Fetch Today's Booked from Supabase
----------------------------------------- */
useEffect(() => {
  if (!doctorProfile) return;

  async function fetchTodaysBooked() {
    const todayISO = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("appointments")
      .select("patient_id,session")
      .eq("doctor_id", doctorProfile.user_id)
      .eq("appointment_date", todayISO);

    if (error) {
      console.error("Error fetching booked appointments:", error);
      return;
    }

    setTodayPatientIds(data || []);
  }

  fetchTodaysBooked();
}, [doctorProfile]);

  // Fetch patients list (reusable)
  const fetchPatients = () => {
    axios
      .get("http://127.0.0.1:5000/patients")
      .then((res) => {
        setPatients(res.data.patients || []);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
      });
  };

  // Initial fetch
  useEffect(() => {
    fetchPatients();
  }, []);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPatients();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  /* ------------------------------------------------
      4️⃣ Update time every second
  --------------------------------------------------*/
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ------------------------------------------------
      5️⃣ Search filter
  --------------------------------------------------*/
  // Session time control
const now = new Date();
const currentHour = now.getHours();

const activeBookings = todayPatientIds.filter((a) => {
  if (a.session === "FN" && currentHour < 12) return true;
  if (a.session === "AN" && currentHour < 18) return true;
  return false;
});
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPatients = (
  normalizedSearch
    ? patients.filter((p) => {
        const name = (p?.name || "").toLowerCase();
        const id = (p?.patient_id || "").toLowerCase();
        return name.includes(normalizedSearch) || id.includes(normalizedSearch);
      })
    : patients
).sort((a, b) => {
  const aBooked = activeBookings.some((p) => p.patient_id === a.patient_id);
  const bBooked = activeBookings.some((p) => p.patient_id === b.patient_id);

  // Booked patients first
  if (aBooked && !bBooked) return -1;
  if (!aBooked && bBooked) return 1;
  return 0;
});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Doctor profile not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              MediScript Dashboard
            </h1>
            <p className="text-sm text-white/80 mt-1">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <DoctorDropdown doctorProfile={doctorProfile} />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Doctor Profile ── */}
        <div className="grid grid-cols-1 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-teal-700 flex items-center">
                  <User className="w-6 h-6 mr-2 text-teal-600" />
                  Doctor Profile
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Quick summary of your profile and contact details.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">{doctorProfile.name}</p>
                  <p className="text-sm text-gray-500">{doctorProfile.specialization || "Specialization not set"}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500">License</p>
                  <p className="font-medium text-teal-600">{doctorProfile.license_number || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-teal-600">{doctorProfile.email || "Not provided"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-teal-600">{doctorProfile.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Doctor ID</p>
                  <p className="font-medium text-teal-600">{doctorProfile.user_id || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Patients Section ── */}
        <div className="grid grid-cols-1 gap-6">

          {/* Patients List */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-teal-700 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-teal-600" />
                  All Patients
                </h2>
                <span className="text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                  {filteredPatients.length} patients
                </span>
              </div>

              {/* Search */}
              <div className="w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-teal-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Patient Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No patients found.
                </p>
              ) : (
                filteredPatients.map((patient) => {
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  const todayStr = `${yyyy}-${mm}-${dd}`;
                  // Check if patient has booked appointment for this doctor today
                 const isBooked = activeBookings.some(
  (p) => p.patient_id === patient.patient_id
);
                  return (
                    <div
                      key={patient.patient_id}
                      className={
                        "border rounded-lg p-4 transition-all duration-200 " +
                        (isBooked
                          ? "border-emerald-300 bg-emerald-50 hover:shadow-md"
                          : "border-gray-200 hover:shadow-md hover:border-teal-300")
                      }
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-teal-800 text-lg">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-teal-600">
                            ID: {patient.patient_id}
                          </p>
                          {isBooked && (
                            <p className="text-xs text-cyan-700 mt-1 font-semibold">Booked</p>
                          )}
                        </div>
                        <div className="space-y-2 text-right">
                          <button
                            onClick={() =>
                              navigate(`/patient/${patient.patient_id}`, {
                                state: { patient, doctorProfile },
                              })
                            }
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md block w-full"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() =>
                              navigate("/listening", {
                                state: {
                                  doctor: doctorProfile,
                                  patient: patient,
                                },
                              })
                            }
                            className="px-3 py-1 border-2 border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg font-medium transition-all duration-200 block w-full"
                          >
                            Start Listening
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>

      <DoctorProfile
        doctorProfile={doctorProfile}
        isOpen={isProfileOpen}  
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}