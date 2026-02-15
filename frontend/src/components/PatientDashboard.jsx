import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

export default function PatientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const patientId = location.state?.patient?.patient_id;

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

  useEffect(() => {
    if (!patientId) navigate("/patient/login");
  }, [patientId, navigate]);

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
          ...new Set(data.map(d => d.specialization).filter(Boolean))
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
      allDoctors.filter(d => d.specialization === selectedSpec)
    );
  }, [selectedSpec, allDoctors]);

  /* ---------------- Appointment History ---------------- */
  useEffect(() => {
    async function fetchAppointments() {
      const { data } = await supabase
        .from("appointments")
        .select(`
          appointment_date,
          session,
          users(name, specialization)
        `)
        .eq("patient_id", patientId)
        .order("appointment_date", { ascending: false });

      setAppointments(data || []);
    }

    if (patientId) fetchAppointments();
  }, [patientId]);

  /* ---------------- Booking ---------------- */
  const handleBookSlot = async () => {
    setError("");

    if (!selectedDoctor || !date || !time) {
      setError("Please select date and session");
      return;
    }

    const payload = {
      patient_id: patient.patient_id,
      doctor_id: selectedDoctor.user_id,
      appointment_date: date,
      session: time,
    };

    const { error } = await supabase
      .from("appointments")
      .insert(payload);

    if (error) {
      if (error.code === "23505") {
        setError("This slot is already booked.");
      } else {
        setError(error.message);
      }
      return;
    }

    alert("Appointment booked successfully");
    setDate("");
    setTime("");
    setSelectedDoctor(null);
  };

  const handleLogout = () => {
    navigate("/");
  };

  if (!patient) return null;

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ================= TOP HEADER BAR ================= */}
      <div className="bg-blue-900 text-white py-2 px-6 text-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              Emergency: 911
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              info@cityhospital.com
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>📍 123 Medical Center Dr, City, State</span>
          </div>
        </div>
      </div>

      {/* ================= MAIN HEADER ================= */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">City Hospital</h1>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Patient Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`px-6 py-2.5 text-sm font-medium rounded-md flex items-center space-x-2 ${
                  activeTab === "dashboard" 
                    ? "text-white bg-blue-600" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                <span>Dashboard</span>
              </button>

              <button 
                onClick={() => setActiveTab("history")}
                className={`px-6 py-2.5 text-sm font-medium rounded-md flex items-center space-x-2 ${
                  activeTab === "history" 
                    ? "text-white bg-blue-600" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Appointments</span>
              </button>

              <button 
                onClick={handleLogout}
                className="ml-6 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md border border-red-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ================= DASHBOARD VIEW ================= */}
        {activeTab === "dashboard" && (
          <div>
            
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {patient.name}</h2>
              <p className="text-gray-600">Here's your health dashboard overview</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                
              {/* Left Sidebar - Patient Info */}
              <div className="lg:col-span-4 space-y-6">
                  
                {/* Patient Profile Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Patient Information
                    </h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                        {getInitials(patient.name)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{patient.name}</h4>
                        <p className="text-sm text-gray-500">Patient ID: #PT-{patient.patient_id}</p>
                      </div>
                    </div>
                      
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Age</span>
                        <span className="text-sm font-semibold text-gray-900">{patient.age} years</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Gender</span>
                        <span className="text-sm font-semibold text-gray-900">{patient.gender}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Contact</span>
                        <span className="text-sm font-semibold text-gray-900">{patient.contact}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
                    <div className="text-xs text-gray-600">Total Visits</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-600">Upcoming</div>
                  </div>
                </div>

              </div>

              {/* Right Content - Booking */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-green-50 to-white">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                      Book New Appointment
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Schedule your consultation with our specialists</p>
                  </div>
                    
                  <div className="px-6 py-6">
                      
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="">-- Choose a department --</option>
                        {specializations.map((spec, i) => (
                          <option key={i} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    {/* Doctor Selection & Booking Grid */}
                    {filteredDoctors.length > 0 && (
                      <div>
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Specialists</h4>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            
                          {/* Doctors List */}
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {filteredDoctors.map(doc => (
                              <div
                                key={doc.user_id}
                                onClick={() => setSelectedDoctor(doc)}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                  selectedDoctor?.user_id === doc.user_id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300 bg-white"
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                                    {getInitials(doc.name)}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900">Dr. {doc.name}</h5>
                                    <p className="text-sm text-gray-600 mb-1">{doc.specialization}</p>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                                      <span className="flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                        </svg>
                                        {doc.license_number}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center">
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                        Available Today
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Appointment Slot Selection */}
                          {selectedDoctor && (
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-blue-200 p-6">
                              <h4 className="font-semibold text-gray-900 mb-1 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Appointment Details
                              </h4>
                              <p className="text-xs text-gray-600 mb-4">Select your preferred date and time</p>

                              <div className="space-y-4">
                                {/* Selected Doctor Info */}
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                  <p className="text-xs text-gray-600 mb-1">Consulting with</p>
                                  <p className="font-semibold text-gray-900">Dr. {selectedDoctor.name}</p>
                                  <p className="text-xs text-gray-600">{selectedDoctor.specialization}</p>
                                </div>

                                {/* Date Selection */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
                                  <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                {/* Time Selection */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Session</label>
                                  <select
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="">Choose a session...</option>
                                    <option value="FN">🌅 Morning (FN)</option>
                                    <option value="AN">🌤️ Afternoon (AN)</option>
                                  </select>
                                </div>

                                {error && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-600 text-sm flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                      {error}
                                    </p>
                                  </div>
                                )}

                                {/* Confirm Button */}
                                <button 
                                  onClick={handleBookSlot}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                  </svg>
                                  <span>Confirm Appointment</span>
                                </button>

                                <p className="text-xs text-gray-500 text-center">You will receive a confirmation email shortly</p>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= HISTORY VIEW ================= */}
        {activeTab === "history" && (
          <div>
            
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Appointment History</h2>
              <p className="text-gray-600">View and manage your past and upcoming appointments</p>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No appointments found
                      </td>
                    </tr>
                  ) : (
                    appointments.map((a, i) => (
                      <tr key={i} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{a.appointment_date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {a.session}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                              {a.users?.name ? getInitials(a.users.name) : "?"}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Dr. {a.users?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{a.users?.specialization}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">City Hospital</h4>
              <p className="text-sm text-gray-400">Providing quality healthcare services since 1985</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Our Doctors</a></li>
                <li><a href="#" className="hover:text-white">Services</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Patient Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">FAQs</a></li>
                <li><a href="#" className="hover:text-white">Insurance</a></li>
                <li><a href="#" className="hover:text-white">Billing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 (555) 123-4567</li>
                <li>📧 info@cityhospital.com</li>
                <li>📍 123 Medical Center Dr</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2026 City Hospital. All rights reserved. | <a href="#" className="hover:text-white">Privacy Policy</a> | <a href="#" className="hover:text-white">Terms of Service</a></p>
          </div>
        </div>
      </footer>

    </div>
  );
}