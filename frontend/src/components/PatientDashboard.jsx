import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import PrescriptionPreview from "../components/PrescriptionPreview";
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
  Pill,
  RefreshCw,
  Bell,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Printer,
  ArrowRight,
} from "lucide-react";

export default function PatientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const patientId =
    location.state?.patient?.patient_id || localStorage.getItem("patient_id");

  const [activeTab, setActiveTab] = useState("dashboard");

  const [patient, setPatient] = useState(null);
  const [bloodGroup, setBloodGroup] = useState("N/A");
  const [allDoctors, setAllDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [error, setError] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slotStatus, setSlotStatus] = useState({
  FN: 0,
  AN: 0,
});
const [followupSlotStatus, setFollowupSlotStatus] = useState({});
const [rescheduleSlotStatus, setRescheduleSlotStatus] = useState({
  FN: 0,
  AN: 0,
});
// ── New feature states ──
const [prescriptions, setPrescriptions]       = useState([]);
const [revisits, setRevisits]                 = useState([]);
const [notifications, setNotifications]       = useState([]);
const [expandedRx, setExpandedRx]             = useState(null);
const [showNotifications, setShowNotifications] = useState(false);
const [reschedulingId, setReschedulingId]     = useState(null);
const [newRevisitDate, setNewRevisitDate]     = useState("");
const [rescheduleLoading, setRescheduleLoading] = useState(false);
const [actionMsg, setActionMsg]               = useState("");
const [processingId, setProcessingId] = useState(null);
  const today = new Date();
  
  today.setHours(0, 0, 0, 0);
  const todayString = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentHour = now.getHours();
  const [newSession, setNewSession] = useState("");
  const [rescheduleSession, setRescheduleSession] = useState("");

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

const fetchAppointments = async () => {
  const { data } = await supabase
    .from("appointments")
    .select(`
      appointment_date,
      session,
      token_number,
      users(name, specialization)
    `)
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false });

  setAppointments(data || []);
};

const fetchRevisits = async () => {
  const { data } = await supabase
    .from("revisit_appointments")
    .select(`
    *,
    users(name, specialization)
  `)
    .eq("patient_id", patientId)
    .order("suggested_date", { ascending: false });

  setRevisits(data || []);
};
  
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
        .select("patient_id, name, age, gender, contact, Blood_group")
        .eq("patient_id", patientId)
        .single();
      setPatient(data);
      setBloodGroup(data?.Blood_group || "N/A");
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
  /*--------Date--------*/
useEffect(() => {
  if (selectedDoctor && date) {
    fetchSlotStatus();
  }
}, [selectedDoctor, date]);
  /* ---------------- Appointment History ---------------- */
  useEffect(() => {
    if (patientId) fetchAppointments();
  }, [patientId]);

/* ---------------- Revisits ---------------- */
useEffect(() => {
  if (patientId) fetchRevisits();
}, [patientId]);

/* ---------------- Notifications ---------------- */
useEffect(() => {
  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    setNotifications(data || []);
  }
  if (patientId) fetchNotifications();
}, [patientId]);

/* ---------------- Prescriptions ---------------- */
useEffect(() => {
  async function fetchPrescriptions() {
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        users!prescriptions_doctor_id_fkey(name, specialization),
        prescription_medicine(
          dosage,
          frequency,
          duration,
          medicine(name)
        )
        
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
      console.log("PRESCRIPTIONS DATA:", data);
console.log("PRESCRIPTIONS ERROR:", error);

    if (error) {
      console.error("Prescription fetch error:", error);
      return;
    }

    setPrescriptions(data || []);
  }

  if (patientId) fetchPrescriptions();
}, [patientId]);
  /* ---------------- Booking ---------------- */
  const handleBookSlot = async () => {
    setError("");
    if (!selectedDoctor || !date || !time) {
      setError("Please select date and session");
      return;
    }
    // 🚫 Block Sundays & Holidays
if (isDateDisabled(date)) {
  setError("Hospital is closed on Sundays / Public Holidays");
  return;
}
    const selectedDay = new Date(date).getDay(); // 0 = Sunday

if (selectedDay === 0) {
  setError("Appointments are not available on Sundays.");
  return;
}
    const selectedDate = new Date(date);
const todayDate = new Date();
todayDate.setHours(0, 0, 0, 0);

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
setActionMsg(`Appointment booked! Token No: ${tokenNumber}`);
setTimeout(() => setActionMsg(""), 3000);
// Clear booking states
setDate("");
setTime("");
setSelectedDoctor(null);
setSelectedSpec("");

// Switch back to dashboard view (this hides booking UI)
setActiveTab("dashboard");
};
const handleConfirmRevisit = async (id) => {
  try {
    setProcessingId(id);

    const revisit = revisits.find(r => r.id === id);
    if (!revisit) return;

    const selectedSession = rescheduleSession || "FN";

    // 🔥 Check slot
    const { count } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", revisit.doctor_id)
      .eq("appointment_date", revisit.suggested_date)
      .eq("session", selectedSession);

    if (count >= 10) {
      setActionMsg("Slot full");
      return;
    }

    const token_number = (count || 0) + 1;
    const { data: existing } = await supabase
  .from("appointments")
  .select("*")
  .eq("patient_id", patientId)
  .eq("doctor_id", revisit.doctor_id)
  .eq("appointment_date", revisit.suggested_date)
  .eq("session", newSession || "FN");

if (existing.length > 0) {
  setActionMsg("Already booked for this date");
  return;
}
    // ✅ Insert appointment
    await supabase.from("appointments").insert([{
      patient_id: patientId,
      doctor_id: revisit.doctor_id,
      appointment_date: revisit.suggested_date,
      session: selectedSession,
      token_number,
    }]);

    // ✅ VERY IMPORTANT: update BOTH fields
    const { error: updateError } = await supabase
  .from("revisit_appointments")
  .update({
    status: "confirmed",
    confirmed_date: revisit.suggested_date,
  })
  .eq("id", id)
  .select(); // 🔥 IMPORTANT
    // ✅ delete notification
    await supabase
      .from("notifications")
      .delete()
      .match({ revisit_id: id });

    await fetchAppointments();

    setActionMsg("✅ Confirmed!");
    setTimeout(() => setActionMsg(""), 3000);

  } catch (err) {
    console.error(err);
  } finally {
    setProcessingId(null);
  }
};

const handleChangeDate = async (id) => {
  if (!newRevisitDate) return;

  try {
    setRescheduleLoading(true);

    const revisit = revisits.find(r => r.id === id);
    if (!revisit) return;
const selectedSession = rescheduleSession || "FN";

    // 🚫 Block Sunday / holiday
    if (isDateDisabled(newRevisitDate)) {
      setActionMsg("Hospital closed on this date");
      return;
    }

    // ❗ Prevent duplicate booking
    const { data: existing } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", revisit.doctor_id)
      .eq("appointment_date", newRevisitDate)
      .eq("session", selectedSession);

    if (existing.length > 0) {
      setActionMsg("Already booked for this date");
      setTimeout(() => setActionMsg(""), 1000);
      return;
    }

    // 🔢 Check slot count
    const { count } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", revisit.doctor_id)
      .eq("appointment_date", newRevisitDate)
      .eq("session", selectedSession);

    if (count >= 10) {
      setActionMsg("Slot full");
      return;
    }

    const token_number = (count || 0) + 1;

    // ✅ Create new appointment
    await supabase.from("appointments").insert([{
      patient_id: patientId,
      doctor_id: revisit.doctor_id,
      appointment_date: newRevisitDate,
      session: selectedSession,
      token_number,
      
    }]);

    // ✅ Update revisit
    await supabase
      .from("revisit_appointments")
      .update({
        status: "confirmed",
        confirmed_date: newRevisitDate
      })
      .eq("id", id);

    // ✅ Delete notification
    await supabase
      .from("notifications")
      .delete()
      .eq("revisit_id", id);

    setReschedulingId(null);
    setNewRevisitDate("");

    await fetchRevisits();
    await fetchAppointments();

    setActionMsg("✅ Appointment rescheduled!");
    setTimeout(() => setActionMsg(""), 3000);

  } catch (err) {
    console.error(err);
    setActionMsg("Something went wrong");
  } finally {
    setRescheduleLoading(false);
  }
};
useEffect(() => {
  revisits.forEach(r => {
    if (r.status === "pending") {
      fetchFollowupSlotStatus(
        r.doctor_id,
        r.suggested_date,
        r.id
      );
    }
  });
}, [revisits]);
/* ---------------- Helpers ---------------- */
// 🔥 GLOBAL HELPERS (FIXED POSITION)
const publicHolidays = [
  "2026-01-26",
  "2026-08-15",
  "2026-10-02",
];

const isDateDisabled = (dateStr) => {
  const selected = new Date(dateStr);
  const day = selected.getDay();
  return day === 0 || publicHolidays.includes(dateStr);
};
const getDaysLeft = (dateStr) => {
  // 🔴 Disable Sundays + Holidays
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
const fetchSlotStatus = async () => {
  if (!selectedDoctor || !date) return;

  const { data, error } = await supabase
    .from("appointments")
    .select("session")
    .eq("doctor_id", selectedDoctor.user_id)
    .eq("appointment_date", date);

  if (error) {
    console.error(error);
    return;
  }

  const fnCount = data.filter(a => a.session === "FN").length;
  const anCount = data.filter(a => a.session === "AN").length;

  setSlotStatus({
    FN: fnCount,
    AN: anCount,
  });
};
const fetchFollowupSlotStatus = async (doctorId, appointmentDate, revisitId) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("session")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", appointmentDate);

  if (error) { console.error(error); return; }

  setFollowupSlotStatus(prev => ({
    ...prev,
    [revisitId]: {
      FN: data.filter(a => a.session === "FN").length,
      AN: data.filter(a => a.session === "AN").length,
    },
  }));
};

const fetchRescheduleSlotStatus = async (doctorId, appointmentDate) => {
  if (!appointmentDate) return;

  const { data, error } = await supabase
    .from("appointments")
    .select("session")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", appointmentDate);

  if (error) { console.error(error); return; }

  setRescheduleSlotStatus({
    FN: data.filter(a => a.session === "FN").length,
    AN: data.filter(a => a.session === "AN").length,
  });
};
const unreadCount = notifications.filter(n => !n.is_read).length;
// Only show pending revisits that are not expired (date >= today)
const pendingRevisits = revisits.filter(r => r.status === "pending" && new Date(r.suggested_date) >= today);
const urgentRevisits  = revisits.filter(r =>
  r.status === "confirmed" &&
  getDaysLeft(r.suggested_date) <= 2 &&
  getDaysLeft(r.suggested_date) >= 0
);

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
            onClick={() => setActiveTab("prescriptions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "prescriptions"
                ? "bg-white text-teal-700 shadow"
                : "text-white/90 hover:bg-white/20"
            }`}
          >
            <Pill className="w-4 h-4" />
            Prescriptions
          </button>

          <button
            onClick={() => setActiveTab("revisits")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "revisits"
                ? "bg-white text-teal-700 shadow"
                : "text-white/90 hover:bg-white/20"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Follow-ups
            {pendingRevisits.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {pendingRevisits.length}
              </span>
            )}
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
                  {actionMsg && (
            <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{actionMsg}</span>
            </div>
          )}

        {/* ── DASHBOARD VIEW ── */}
        {activeTab === "dashboard" && (
          <div>
            {/* ── Alert banners ── */}
            {pendingRevisits.length > 0 && (
              <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-yellow-800">
                      {pendingRevisits.length} follow-up appointment{pendingRevisits.length > 1 ? "s" : ""} need your confirmation
                    </p>
                    <p className="text-sm text-yellow-600">Please confirm or reschedule your revisit date</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("revisits")}
                  className="flex items-center gap-1 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-bold hover:bg-yellow-500"
                >
                  View <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {urgentRevisits.map(r => (
              <div key={r.id} className="mb-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
                <Bell className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-700">
                    🔔 Reminder: Follow-up with {r.users?.name} is{" "}
                    {getDaysLeft(r.confirmed_date) === 0 ? "TODAY!" : `in ${getDaysLeft(r.confirmed_date)} day(s)!`}
                  </p>
                  <p className="text-sm text-red-500">
                    {new Date(r.confirmed_date).toDateString()} — {r.reason}
                  </p>
                </div>
              </div>
            ))}
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
                                onChange={(e) => {
                                const selected = new Date(e.target.value);
                                if (isDateDisabled(e.target.value)) {
                                  setError("Hospital closed on this date");
                                  return;
                                }
                                  setError("");
                                  setDate(e.target.value);
                                }}
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
                              disabled={slotStatus.FN >= 10 || (date === todayString && currentHour >= 12)}
                              className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
                                ${
                                  time === "FN"
                                    ? "ring-4 ring-teal-300 scale-105"
                                    : ""
                                }
                                ${
                                  slotStatus.FN >= 10
                                    ? "bg-red-500 cursor-not-allowed"
                                    : slotStatus.FN >= 8
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                                }
                              `}
                            >
                              FN{" "}
                            {date === todayString && currentHour >= 12
                              ? "(Closed)"
                              : slotStatus.FN >= 10
                              ? "(Full)"
                              : `(${10 - slotStatus.FN} left)`}
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
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Blood Group</span>
                      <span className="text-sm font-medium text-teal-700">
                        {bloodGroup}
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
{/* ══ PRESCRIPTIONS TAB ══ */}
{activeTab === "prescriptions" && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-teal-700 flex items-center gap-2">
        <Pill className="w-6 h-6 text-teal-600" />
        My Prescriptions
      </h2>
      <span className="text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
        {prescriptions.length} prescription(s)
      </span>
    </div>

    {prescriptions.length === 0 ? (
      <div className="text-center py-16 text-gray-400">
        <Pill className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No prescriptions found</p>
      </div>
    ) : (
      <div className="space-y-4">
        {prescriptions.map(rx => {
  const previewData = {
    date: new Date(rx.created_at).toLocaleDateString(),
    doctor: {
      name: rx.users?.name || "—",
      specialization: rx.users?.specialization || "—",
      license: rx.license_number || "—"
    },
    patient: {
      id: patient.patient_id,
      name: patient.name,
      age: patient.age
    },
    medicines: (rx.prescription_medicine || []).map(m => ({
      name: m.medicine?.name || "—",
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity
    }))
  };

  return (
    <div key={rx.prescription_id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      
      {/* Card Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-teal-100 p-3 rounded-xl">
            <Pill className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800">Prescription </p>
            <p className="text-sm text-gray-500"> {rx.users?.name} • {rx.users?.specialization}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(rx.created_at).toDateString()}</p>
              
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print button */}
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              printWindow.document.write(`
                <html><head><title>Prescription</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"/>
                </head><body>
                ${document.getElementById("rx-preview-" + rx.prescription_id)?.innerHTML}
                </body></html>
              `);
              printWindow.document.close();
              printWindow.print();
            }}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4 text-gray-600" />
          </button>

          {/* Expand/collapse button */}
          <button
            onClick={() => setExpandedRx(expandedRx === rx.prescription_id ? null : rx.prescription_id)}
            className="flex items-center gap-1 px-3 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 text-sm font-medium"
          >
            {expandedRx === rx.prescription_id
              ? <><ChevronUp className="w-4 h-4" /> Hide</>
              : <><ChevronDown className="w-4 h-4" /> View</>
            }
          </button>
        </div>
      </div>

      {/* Expanded Preview using your existing PrescriptionPreview component */}
      {expandedRx === rx.prescription_id && (
        <div className="border-t border-gray-100 p-4">
          <div id={"rx-preview-" + rx.prescription_id}>
            <PrescriptionPreview data={previewData} />
          </div>
        </div>
      )}

    </div>
  );
})}
      </div>
    )}
  </div>
)}

{/* ══ REVISITS / FOLLOW-UPS TAB ══ */}
{activeTab === "revisits" && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-teal-700 flex items-center gap-2">
        <RefreshCw className="w-6 h-6 text-teal-600" />
        Follow-up Appointments
      </h2>
      <span className="text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
        {revisits.length} follow-up(s)
      </span>
    </div>

    {revisits.length === 0 ? (
      <div className="text-center py-16 text-gray-400">
        <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No follow-up appointments scheduled</p>
      </div>
    ) : (
      <div className="space-y-4">
        {revisits
   .filter(r => r.status !== "completed")
  .map(r => {
          const daysLeft  = getDaysLeft(r.confirmed_date);
          const isUrgent  = daysLeft <= 2 && daysLeft >= 0 && r.status !== "completed";
          const statusColors = {
            pending:              "border-yellow-300 bg-yellow-50",
            confirmed:            "border-green-300 bg-white",
            reschedule_requested: "border-orange-300 bg-orange-50",
            completed:            "border-gray-200 bg-gray-50",
          };
          const statusBadge = {
            pending:              "bg-yellow-100 text-yellow-800 border-yellow-300",
            confirmed:            "bg-green-100 text-green-800 border-green-300",
            reschedule_requested: "bg-orange-100 text-orange-800 border-orange-300",
            completed:            "bg-gray-100 text-gray-600 border-gray-300",
          };
          const statusLabel = {
            pending:              "Pending Confirmation",
            confirmed:            "Confirmed",
            reschedule_requested: "Reschedule Requested",
            completed:            "Completed",
          };

          return (
            <div key={r.id} className={`rounded-xl border-2 overflow-hidden shadow-sm ${statusColors[r.status] || "border-gray-200 bg-white"}`}>

              {/* Urgent banner */}
              {isUrgent && (
                <div className="bg-red-500 text-white px-5 py-2.5 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="font-bold text-sm">
                    {daysLeft === 0
                      ? "⚠️ Your follow-up is TODAY!"
                      : `⏰ Follow-up in ${daysLeft} day(s)!`}
                  </span>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-teal-100 p-3 rounded-xl">
                      <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        Follow-up with  {r.users?.name}
                      </p>
                      <p className="text-sm text-gray-500">{r.users?.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">
                        {new Date(r.status === "confirmed" ? r.confirmed_date : r.suggested_date).toDateString()}
                      </span>
                        {daysLeft >= 0 && r.status !== "completed" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            daysLeft <= 2 ? "bg-red-100 text-red-600" :
                            daysLeft <= 7 ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {daysLeft === 0 ? "Today" : `${daysLeft} days away`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Reason:</span> {r.reason}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap ${statusBadge[r.status]}`}>
                    {statusLabel[r.status]}
                  </span>
                </div>

  {/* PENDING: confirm or reschedule (only if date not over) */}
  {r.status === "pending" && new Date(r.suggested_date) >= today && (
  <div className="space-y-4 mt-3">

    {/* Info banner — unchanged */}
    <p className={`text-sm px-3 py-2 rounded-lg font-medium border ${
      r.status === "pending"
        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
        : "bg-gray-100 text-gray-400 border-gray-300 opacity-70"
    }`}>
      {r.status === "pending"
        ? "📋 Your doctor scheduled a follow-up. Please confirm or request a different date."
        : "✔ Follow-up processed. This action is now inactive."}
    </p>

    {/* ── GREEN BOX: Confirm suggested date ── */}
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-green-700">
        ✅ Confirm on: {new Date(r.suggested_date).toDateString()}
      </p>

      {/* Session buttons — EXACT SAME as before */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Session
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTime("FN")}
            disabled={(followupSlotStatus[r.id]?.FN || 0) >= 10 || (date === todayString && currentHour >= 12)}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
              ${time === "FN" ? "ring-4 ring-teal-300 scale-105" : ""}
              ${followupSlotStatus[r.id]?.FN >= 10 ? "bg-red-500 cursor-not-allowed"
                : followupSlotStatus[r.id]?.FN >= 8 ? "bg-orange-500"
                : "bg-green-500"}
            `}
          >
            FN {date === todayString && currentHour >= 12 ? "(Closed)"
              : followupSlotStatus[r.id]?.FN >= 10 ? "(Full)"
              : `(${10 - (followupSlotStatus[r.id]?.FN || 0)} left)`}
          </button>

          <button
            type="button"
            onClick={() => setTime("AN")}
            disabled={(followupSlotStatus[r.id]?.AN || 0) >= 10 || (date === todayString && currentHour >= 18)}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
              ${time === "AN" ? "ring-4 ring-teal-300 scale-105" : ""}
              ${followupSlotStatus[r.id]?.AN >= 10 ? "bg-red-500 cursor-not-allowed"
                : followupSlotStatus[r.id]?.AN >= 8 ? "bg-orange-500"
                : "bg-green-500"}
            `}
          >
            AN {date === todayString && currentHour >= 18 ? "(Closed)"
              : followupSlotStatus[r.id]?.AN >= 10 ? "(Full)"
              : `(${10 - (followupSlotStatus[r.id]?.AN || 0)} left)`}
          </button>
        </div>

        {followupSlotStatus[r.id]?.FN >= 10 && followupSlotStatus[r.id]?.AN >= 10 && (
          <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mt-3 text-center font-medium">
            Booking Closed for this Date
          </div>
        )}
      </div>

      {/* Confirm button — EXACT SAME logic */}
      <button
        onClick={() => handleConfirmRevisit(r.id)}
        disabled={r.status === "confirmed" || processingId === r.id}
        className={`w-full px-5 py-2.5 rounded-xl font-semibold text-sm transition
          ${r.status === "confirmed" || processingId === r.id
            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
            : "bg-green-500 text-white hover:bg-green-600"}
        `}
      >
        {processingId === r.id ? "Processing..." : (r.status === "confirmed" ? "Confirmed" : "Confirm This Date")}
      </button>
    </div>

    {/* ── ORANGE BOX: Change Date ── */}
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-orange-700">📅 Or pick a different date:</p>

      {/* Change Date toggle button — EXACT SAME logic */}
      <button
        onClick={() => setReschedulingId(reschedulingId === r.id ? null : r.id)}
        disabled={r.status === "confirmed" || processingId === r.id}
        className={`w-full px-5 py-2.5 rounded-xl font-semibold text-sm transition
          ${r.status === "confirmed" || processingId === r.id
            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
            : "bg-orange-400 text-white hover:bg-orange-500"}
        `}
      >
        Change Date
      </button>

      {/* Inline date picker — EXACT SAME as before */}
      {reschedulingId === r.id && (
        <div className="space-y-3">
          <input
            type="date"
            value={newRevisitDate}
            onChange={(e) => {
              const selected = new Date(e.target.value);
              if (selected.getDay() === 0) {
                setError("Sundays are not allowed.");
                return;
              }
              setError("");
              setNewRevisitDate(e.target.value);
              fetchRescheduleSlotStatus(
                r.doctor_id,
                e.target.value
              );
            }}
            min={todayString}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
          />

          {/* Session buttons — EXACT SAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Session
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRescheduleSession("FN")}
                disabled={rescheduleSlotStatus.FN >= 10 || (date === todayString && currentHour >= 12)}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
                  ${rescheduleSession === "FN" ? "ring-4 ring-teal-300 scale-105" : ""}
                  ${rescheduleSlotStatus.FN >= 10 ? "bg-red-500 cursor-not-allowed"
                    : rescheduleSlotStatus.FN >= 8 ? "bg-orange-500"
                    : "bg-green-500"}
                `}
              >
                FN {newRevisitDate === todayString && currentHour >= 12 ? "(Closed)"
                  : rescheduleSlotStatus.FN >= 10 ? "(Full)"
                  : `(${10 - rescheduleSlotStatus.FN} left)`}
              </button>

              <button
                type="button"
                onClick={() => setRescheduleSession("AN")}
                disabled={rescheduleSlotStatus.AN >= 10 || (date === todayString && currentHour >= 18)}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
                  ${rescheduleSession === "AN" ? "ring-4 ring-teal-300 scale-105" : ""}
                  ${rescheduleSlotStatus.AN >= 10 ? "bg-red-500 cursor-not-allowed"
                    : rescheduleSlotStatus.AN >= 8 ? "bg-orange-500"
                    : "bg-green-500"}
                `}
              >
                AN {newRevisitDate === todayString && currentHour >= 18 ? "(Closed)"
                  : rescheduleSlotStatus.AN >= 10 ? "(Full)"
                  : `(${10 - rescheduleSlotStatus.AN} left)`}
              </button>
            </div>

            {rescheduleSlotStatus.FN >= 10 && rescheduleSlotStatus.AN >= 10 && (
              <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mt-3 text-center font-medium">
                Booking Closed for this Date
              </div>
            )}
          </div>

          {/* OK / Cancel — EXACT SAME */}
          <div className="flex gap-2">
            <button
              onClick={() => handleChangeDate(r.id)}
              disabled={!newRevisitDate || rescheduleLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold disabled:opacity-50"
            >
            {rescheduleLoading
              ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              : <CheckCircle className="w-4 h-4" />
            }
            OK
            </button>
            <button
              onClick={() => { setReschedulingId(null); setNewRevisitDate(""); }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
 </div>
 )}
  {/* COMPLETED */}
  {r.status === "completed" && (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500 flex items-center gap-2">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
        Follow-up completed
        </div>
        )}
      </div>
    </div>
    );
  })}
</div>
)}
</div>
)}
</main>
</div>
);
}