import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

function PatientRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodgroup, setBloodgroup] = useState("");
  const [mobile, setMobile] = useState("");
  const [hasInsurance, setHasInsurance] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Calculate Age from DOB
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !dob || !gender || !mobile) {
      setError("Please fill all required fields");
      return;
    }

    // ✅ Format mobile number to +91
    let formattedMobile = mobile;
    if (!mobile.startsWith("+91")) {
      formattedMobile = "+91" + mobile.replace(/\D/g, "");
    }

    const age = calculateAge(dob);

    setLoading(true);

    const { data, error } = await supabase
      .from("patients")
      .insert([
        {
          name: name,
          age: age,
          gender: gender,
          contact: formattedMobile,
          Blood_group: bloodgroup || null,
          DOB: dob,
          insurance_status: hasInsurance === "Yes" ? "Active" : "Inactive",
          insurance_type:
            hasInsurance === "Yes" ? insuranceCompany : null,
        },
      ])
      .select(); // return inserted row

    setLoading(false);

    if (error) {
      console.error("Supabase Error:", error);
      setError(error.message);
      return;
    }

    // Navigate using patient_code if exists else mobile
 // Get inserted patient row
const patient = data[0];

// ✅ Show success popup
alert("Registration Successful ✅");

// ✅ Store patient_id locally (important for dashboard fetch)
localStorage.setItem("patient_id", patient.patient_id);

// ✅ Redirect to patient dashboard
navigate("/patient/dashboard", { state: { patient } });

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
          New Patient Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={bloodgroup}
            onChange={(e) => setBloodgroup(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="">Select Blood Group</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>O+</option>
            <option>O-</option>
            <option>AB+</option>
            <option>AB-</option>
          </select>

          <input
            type="tel"
            placeholder="Mobile Number *"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <select
            value={hasInsurance}
            onChange={(e) => {
              setHasInsurance(e.target.value);
              setInsuranceCompany("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="">Do you have Insurance?</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          {hasInsurance === "Yes" && (
            <select
              value={insuranceCompany}
              onChange={(e) => setInsuranceCompany(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Select Insurance Company</option>
              <option>HDFC ERGO</option>
              <option>Star Health</option>
              <option>SBI Health Insurance</option>
              <option>ICICI Lombard</option>
              <option>New India Assurance</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition mt-4"
          >
            {loading ? "Registering..." : "Register & Continue"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientRegister;
