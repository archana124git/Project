import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";

function PatientLogin() {
  const [patientId, setPatientId] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!patientId.trim()) {
      setError("Please enter your Patient ID");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    // ✅ Format mobile with +91 to match database format
    const formattedMobile = "+91" + mobile;

    // ✅ Fetch patient from Supabase to validate login
    const { data, error: dbError } = await supabase
      .from("patients")
      .select("patient_id, name, age, gender, contact")
      .eq("patient_id", patientId)
      .eq("contact", formattedMobile)
      .single();

    if (dbError || !data) {
      setError("Invalid Patient ID or Mobile Number");
      return;
    }

    // Save patient info in localStorage (optional, helps on page refresh)
    localStorage.setItem("patient_id", data.patient_id);
    localStorage.setItem("contact", data.contact);

    // ✅ Navigate to dashboard and pass patient data in state
    navigate("/patient/dashboard", {
      state: {
        patient: data
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mb-4 shadow-md">
            <span className="text-white font-semibold text-lg">AP</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Patient Access Portal
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Andhra Pradesh Health Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Registered Patient Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter your Patient ID"
                className="w-full px-4 py-3 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className="w-full px-4 py-3 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Must match the mobile number registered during patient registration
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-md font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-md hover:shadow-lg"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors font-medium"
            >
              ← Back to Portal
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This system is developed as part of an academic project under AP State Health Services.
          </p>
        </div>

      </div>
    </div>
  );
}

export default PatientLogin;