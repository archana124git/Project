import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function PatientLogin() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = (e) => {
    e.preventDefault();
    setError("");

    // Basic mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    // Mock OTP flow (NO backend change)
    localStorage.setItem("patient_mobile", mobile);
    localStorage.setItem("patient_otp", "123456");

    navigate("/patient/verify-otp");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Secure access to your health records</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Sign In
            </h2>
            <p className="text-sm text-gray-600">
              Enter your mobile number to receive an OTP
            </p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full pl-14 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">We'll send you a 6-digit verification code</p>
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
              Send OTP
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Staff Login
            </Link>
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

export default PatientLogin;