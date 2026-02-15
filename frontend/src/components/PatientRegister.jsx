import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import supabase from "../supabaseClient"; // ← uncomment when backend is ready

function PatientRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedMobile = localStorage.getItem("patient_mobile");
    if (!storedMobile) {
      navigate("/patient/login");
    } else {
      setMobile(storedMobile);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !age || !gender) {
      setError("Please fill all details");
      return;
    }

    // 🔹 SUPABASE INSERT (enable later)
    /*
    const { error } = await supabase.from("patient").insert([
      {
        name,
        age,
        gender,
        contact: mobile,
      },
    ]);

    if (error) {
      setError("Registration failed");
      return;
    }
    */

    // Temporary success flow
    navigate(`/patient/${mobile}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 text-white">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">

        <h2 className="text-2xl font-bold text-center mb-6">
          Patient Registration
        </h2>

        <p className="text-sm text-slate-400 text-center mb-6">
          Mobile: <span className="text-blue-400">{mobile}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none"
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none text-slate-300"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold"
          >
            Register & Continue
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientRegister;
