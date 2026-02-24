import React from "react";
import { useNavigate } from "react-router-dom";

function PatientAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center 
                          w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md mb-4">
            <span className="text-white font-semibold text-lg">AP</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Patient Access Portal
          </h1>

          <p className="text-sm text-gray-600 mt-1">
            Andhra Pradesh Digital Health System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl 
                        shadow-xl border border-gray-200 p-8 space-y-5">

          <button
            onClick={() => navigate("/patient/login")}
            className="w-full p-5 rounded-xl border border-gray-200 
                       hover:border-teal-500 hover:shadow-md 
                       transition-all text-left"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Registered Patient
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Login using your Patient ID and registered mobile number
            </p>
          </button>

          <button
            onClick={() => navigate("/patient/register")}
            className="w-full p-5 rounded-xl border border-gray-200 
                       hover:border-teal-500 hover:shadow-md 
                       transition-all text-left"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              New Patient
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a new patient profile and generate Patient ID
            </p>
          </button>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Developed as part of an academic project under AP State Health Services.
          </p>
        </div>

      </div>
    </div>
  );
}

export default PatientAccess;