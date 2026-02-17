import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import DoctorDropdown from "./DropDown";
import DoctorProfile from "./DoctorProfile";

import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  Activity,
  FileText,
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

  // Stats placeholder
  const [stats] = useState({
    total_appointments_today: 8,
    completed_appointments: 0,
    pending_appointments: 0,
    in_progress_appointments: 0,
  });

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

  /* ------------------------------------------------
      3️⃣ Fetch patients list
  --------------------------------------------------*/
  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/patients")
      .then((res) => {
        setPatients(res.data.patients || []);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
      });
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
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPatients = normalizedSearch
    ? patients.filter((p) => {
        const name = (p?.name || "").toLowerCase();
        const id = (p?.patient_id || "").toLowerCase();
        return name.includes(normalizedSearch) || id.includes(normalizedSearch);
      })
    : patients;

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

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Total Patients */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-3xl font-bold text-teal-700 mt-2">
                  {patients.length}
                </p>
              </div>
              <div className="bg-teal-50 p-3 rounded-full">
                <Calendar className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl text-emerald-600 mt-2">
                  {stats.completed_appointments}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-3xl text-cyan-600 mt-2">
                  {stats.in_progress_appointments}
                </p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-full">
                <Activity className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl text-gray-600 mt-2">
                  {stats.pending_appointments}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Patients Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patients List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 p-6">
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
                filteredPatients.map((patient) => (
                  <div
                    key={patient.patient_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-teal-300 transition-all duration-200"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-teal-800 text-lg">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-teal-600">
                          ID: {patient.patient_id}
                        </p>
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
                ))
              )}
            </div>
          </div>

          {/* ── Right Side Profile ── */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-teal-700 flex items-center">
                <User className="w-6 h-6 mr-2 text-teal-600" />
                Your Profile
              </h2>

              <div className="flex items-center mt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-8 h-8 text-white" />
                </div>

                <div className="ml-4">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {doctorProfile.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {doctorProfile.specialization}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="text-sm">
                  <span className="text-gray-500">License:</span>{" "}
                  <span className="font-medium text-teal-600">
                    {doctorProfile.license_number}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-full mt-4 border-2 border-teal-500 text-teal-600 hover:bg-teal-50 py-2 rounded-lg font-medium transition-all duration-200"
              >
                View Full Profile
              </button>
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