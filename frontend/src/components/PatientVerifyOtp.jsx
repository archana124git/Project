import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

function PatientVerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 📱 Get mobile & normalize to +91 format
  let mobile = localStorage.getItem("patient_mobile")?.trim();

  if (mobile && !mobile.startsWith("+91")) {
    mobile = "+91" + mobile;
  }

  const storedOtp = localStorage.getItem("patient_otp");

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Mock OTP check
    if (otp !== storedOtp) {
      setError("Invalid OTP");
      return;
    }

    try {
      // 🔍 Check if patient already exists
      const { data, error } = await supabase
        .from("patients")
        .select("patient_id, name, age, gender, contact")
        .eq("contact", mobile)
        .maybeSingle();

      if (error) {
        console.error(error);
        setError("Database error");
        return;
      }

      if (data) {
        // ✅ EXISTING PATIENT → Dashboard + Slot Booking
        navigate("/patient-dashboard", {
          state: {
            patient: {
              patient_id: data.patient_id,
              name: data.name,
              age: data.age,
              gender: data.gender,
              contact: data.contact,
            },
          },
        });
      } else {
        // 🆕 NEW PATIENT → Registration
        navigate("/patient/register");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Secure access to your health records</p>
        </div>

        {/* Verify OTP Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Verify OTP
            </h2>
            <p className="text-sm text-gray-600">
              Enter the code sent to{" "}
              <span className="font-medium text-gray-900">{mobile}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent transition-all text-center text-2xl tracking-[0.5em] font-semibold"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500">Enter the 6-digit code from your SMS</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50
                            border border-red-200 rounded-lg">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium text-white
                       bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Verify & Continue
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate("/patient/login")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Didn't receive code? Try again
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export default PatientVerifyOtp;