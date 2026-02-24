import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  Activity,
  Search,
  LogOut,
  Home,
  Plus,
  ChevronRight,
} from "lucide-react";

export default function PatientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const patientId =
    location.state?.patient?.patient_id || localStorage.getItem("patient_id");

  const [activeTab, setActiveTab] = useState("dashboard");

  const [patient, setPatient] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [error, setError] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slotStatus, setSlotStatus] = useState({
  FN: 0,
  AN: 0,
});

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = new Date().toISOString().split("T")[0];
  const now = new Date();
const currentHour = now.getHours();

  const totalVisits = appointments.filter((appt) => {
    const apptDate = new Date(appt.appointment_date);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate < today;
  });

  const upcomingAppointments = appointments.filter((appt) => {
    const apptDate = new Date(appt.appointment_date);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate >= today;
  });

  useEffect(() => {
    if (!patientId) navigate("/patient/login");
  }, [patientId, navigate]);

  /* ---------------- Live clock ---------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- Patient ---------------- */
  useEffect(() => {
    async function fetchPatient() {
      const { data } = await supabase
        .from("patients")
        .select("patient_id, name, age, gender, contact")
        .eq("patient_id", patientId)
        .single();
      setPatient(data);
    }
    if (patientId) fetchPatient();
  }, [patientId]);

  /* ---------------- Doctors ---------------- */
  useEffect(() => {
    async function fetchDoctors() {
      const { data } = await supabase
        .from("users")
        .select("user_id, name, email, specialization, license_number");
      if (data) {
        setAllDoctors(data);
        const uniqueSpecs = [
          ...new Set(data.map((d) => d.specialization).filter(Boolean)),
        ];
        setSpecializations(uniqueSpecs);
      }
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!selectedSpec) {
      setFilteredDoctors([]);
      return;
    }
    setFilteredDoctors(
      allDoctors.filter((d) => d.specialization === selectedSpec)
    );
  }, [selectedSpec, allDoctors]);

  /* ---------------- Appointment History ---------------- */
  useEffect(() => {
    async function fetchAppointments() {
      const { data } = await supabase
        .from("appointments")
        .select(
          `
          appointment_date,
          session,
          token_number,
          users(name, specialization)
        `
        )
        .eq("patient_id", patientId)
        .order("appointment_date", { ascending: false });
      setAppointments(data || []);
    }
    if (patientId) fetchAppointments();
  }, [patientId]);

  const fetchSlotStatus = async () => {
  if (!selectedDoctor || !date) return;

  const { data, error } = await supabase
    .from("appointments")
    .select("session")
    .eq("doctor_id", selectedDoctor.user_id)
    .eq("appointment_date", date);

  if (error) return;

  const fnCount = data.filter((a) => a.session === "FN").length;
  const anCount = data.filter((a) => a.session === "AN").length;

  setSlotStatus({
    FN: fnCount,
    AN: anCount,
  });
};
useEffect(() => {
  fetchSlotStatus();
}, [selectedDoctor, date]);
  /* ---------------- Booking ---------------- */
  const handleBookSlot = async () => {
    setError("");
    if (!selectedDoctor || !date || !time) {
      setError("Please select date and session");
      return;
    }
    const selectedDate = new Date(date);
const todayDate = new Date();
todayDate.setHours(0, 0, 0, 0);

if (selectedDate < todayDate) {
  setError("Cannot book appointment for past dates.");
  return;
}
if (selectedDate < todayDate) {
  setError("Cannot book appointment for past dates.");
  return;
}

// ⬇️ ADD THIS BLOCK RIGHT HERE
if (date === todayString) {
  if (time === "FN" && currentHour >= 12) {
    setError("FN session is closed for today.");
    return;
  }

  if (time === "AN" && currentHour >= 18) {
    setError("AN session is closed for today.");
    return;
  }
}
    const { count, error: countError } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", selectedDoctor.user_id)
    .eq("appointment_date", date)
    .eq("session", time);
    if (countError) {
    setError(countError.message);
    return;
  }

  const tokenNumber = (count || 0) + 1;
  if (count >= 10) {
  setError("This session is fully booked.");
  return;
}

  // 2️⃣ Insert appointment with token
  const {data, error } = await supabase.from("appointments").insert([
    {
      patient_id: patient.patient_id,
      doctor_id: selectedDoctor.user_id,
      appointment_date: date,
      session: time,
      token_number: tokenNumber,
    },
  ]);

  if (error) {
    setError(error.message);
    return;
  }
await fetchSlotStatus();
  alert(`Appointment booked successfully!\nYour Token Number is ${tokenNumber}`);
    await fetchAppointments();

  setDate("");
  setTime("");
  setSelectedDoctor(null);
};

  const handleLogout = () => {
    navigate("/");
  };

  if (!patient) return null;

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  /* ── filtered doctors for search (appointments tab) ── */
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Patient Portal</h1>
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

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-white text-teal-700 shadow"
                  : "text-white/90 hover:bg-white/20"
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-white text-teal-700 shadow"
                  : "text-white/90 hover:bg-white/20"
              }`}
            >
              <Clock className="w-4 h-4" />
              Appointments
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white/90 hover:bg-white/20 transition-all duration-200 ml-2 border border-white/30"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── DASHBOARD VIEW ── */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

              {/* Total Visits */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Visits</p>
                    <p className="text-3xl font-bold text-teal-700 mt-2">
                      {totalVisits.length}
                    </p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
              </div>

              {/* Upcoming */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                      {upcomingAppointments.length}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-full">
                    <Calendar className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Total Appointments */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">All Appointments</p>
                    <p className="text-3xl font-bold text-cyan-600 mt-2">
                      {appointments.length}
                    </p>
                  </div>
                  <div className="bg-cyan-50 p-3 rounded-full">
                    <Activity className="w-8 h-8 text-cyan-600" />
                  </div>
                </div>
              </div>

              {/* Doctors Available */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Specialists</p>
                    <p className="text-3xl font-bold text-gray-600 mt-2">
                      {allDoctors.length}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-full">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Book Appointment — left 2 cols */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-teal-700 flex items-center">
                      <Plus className="w-6 h-6 mr-2 text-teal-600" />
                      Book New Appointment
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Schedule your consultation with our specialists
                    </p>
                  </div>
                </div>

                {/* Department Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Department / Specialization
                  </label>
                  <select
                    value={selectedSpec}
                    onChange={(e) => {
                      setSelectedSpec(e.target.value);
                      setSelectedDoctor(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors text-gray-900"
                  >
                    <option value="">-- Choose a department --</option>
                    {specializations.map((spec, i) => (
                      <option key={i} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection & Booking Grid */}
                {filteredDoctors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Available Specialists
                    </h4>

                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Doctors List */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {filteredDoctors.map((doc) => (
                          <div
                            key={doc.user_id}
                            onClick={() => setSelectedDoctor(doc)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedDoctor?.user_id === doc.user_id
                                ? "border-teal-500 bg-teal-50"
                                : "border-gray-200 hover:border-teal-300 bg-white"
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0 shadow-sm">
                                {getInitials(doc.name)}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-teal-800">
                                  {doc.name}
                                </h5>
                                <p className="text-sm text-gray-600 mb-1">
                                  {doc.specialization}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Lic: {doc.license_number}
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-2">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                                  Available
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Appointment Slot Selection */}
                      {selectedDoctor && (
                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg border-2 border-teal-200 p-6">
                          <h4 className="font-semibold text-teal-800 mb-1 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                            Appointment Details
                          </h4>
                          <p className="text-xs text-gray-500 mb-4">
                            Select your preferred date and time
                          </p>

                          <div className="space-y-4">
                            {/* Selected Doctor Info */}
                            <div className="bg-white rounded-lg p-3 border border-teal-200">
                              <p className="text-xs text-gray-500 mb-1">
                                Consulting with
                              </p>
                              <p className="font-semibold text-teal-800">
                                {selectedDoctor.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedDoctor.specialization}
                              </p>
                            </div>

                            {/* Date */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Appointment Date
                              </label>
                              <input
                                type="date"
                                value={date}
                                min={todayString}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                              />
                            </div>

                            {/* Session */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Session
                              </label>
                              <div className="flex gap-3">
  {/* FN Button */}
  <button
  type="button"
  onClick={() => setTime("FN")}
  disabled={slotStatus.FN >= 3 || (date === todayString && currentHour >= 12)}
  className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
    ${
      time === "FN"
        ? "ring-4 ring-teal-300 scale-105"
        : ""
    }
    ${
      slotStatus.FN >= 3
        ? "bg-red-500 cursor-not-allowed"
        : slotStatus.FN >= 2
        ? "bg-orange-500"
        : "bg-green-500"
    }
  `}
>
  FN{" "}
{date === todayString && currentHour >= 12
  ? "(Closed)"
  : slotStatus.FN >= 3
  ? "(Full)"
  : `(${3 - slotStatus.FN} left)`}
</button>

  {/* AN Button */}
  <button
  type="button"
  onClick={() => setTime("AN")}
  disabled={slotStatus.AN >= 10 ||
  (date === todayString && currentHour >= 18)}
  className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
    ${
      time === "AN"
        ? "ring-4 ring-teal-300 scale-105"
        : ""
    }
    ${
      slotStatus.AN >= 10
        ? "bg-red-500 cursor-not-allowed"
        : slotStatus.AN >= 8
        ? "bg-orange-500"
        : "bg-green-500"
    }
  `}
>
  AN{" "}
 {date === todayString && currentHour >= 18
  ? "(Closed)"
  : slotStatus.AN >= 10
  ? "(Full)"
  : `(${10 - slotStatus.AN} left)`}
</button>
</div>
                            </div>

                            {slotStatus.FN >= 10 && slotStatus.AN >= 10 && (
  <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mt-3 text-center font-medium">
    Booking Closed for this Date
  </div>
)}

                            {error && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-600 text-sm">{error}</p>
                              </div>
                            )}

                            <button
                              onClick={handleBookSlot}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Confirm Appointment
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                             
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right — Patient Profile */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-teal-700 flex items-center">
                    <User className="w-6 h-6 mr-2 text-teal-600" />
                    Your Profile
                  </h2>

                  <div className="flex items-center mt-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                      {getInitials(patient.name)}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: PT-{patient.patient_id}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Age</span>
                      <span className="text-sm font-medium text-teal-700">
                        {patient.age} years
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Gender</span>
                      <span className="text-sm font-medium text-teal-700">
                        {patient.gender}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Contact</span>
                      <span className="text-sm font-medium text-teal-700">
                        {patient.contact}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("history")}
                    className="w-full mt-4 border-2 border-teal-500 text-teal-600 hover:bg-teal-50 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    View Appointments
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {activeTab === "history" && (
          <div>
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-teal-700 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-teal-600" />
                  Appointment History
                </h2>
                <span className="text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                  {appointments.length} appointments
                </span>
              </div>

              {/* Search */}
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-teal-500" />
                  <input
                    type="text"
                    placeholder="Search by doctor or dept..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-700 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-700 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-700 uppercase tracking-wider">
                      Token Number
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No appointments found
                      </td>
                    </tr>
                  ) : (
                    appointments
                      .filter((a) => {
                        if (!normalizedSearch) return true;
                        const docName = (a.users?.name || "").toLowerCase();
                        const dept = (
                          a.users?.specialization || ""
                        ).toLowerCase();
                        return (
                          docName.includes(normalizedSearch) ||
                          dept.includes(normalizedSearch)
                        );
                      })
                      .map((a, i) => (
                        <tr
                          key={i}
                          className="hover:bg-teal-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {a.appointment_date}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                              {a.session}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2 shadow-sm">
                                {a.users?.name ? getInitials(a.users.name) : "?"}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                 {a.users?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {a.users?.specialization}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-600 text-white shadow">
                              {a.token_number}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}