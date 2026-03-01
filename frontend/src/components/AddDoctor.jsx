import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AddDoctor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    education: "MBBS",
    license_number: "",
    password: "",
    role: "Doctor",
    specialization: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      console.log("POST /doctors/add HIT");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/doctors/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error);
        return;
      }

      alert("Doctor added successfully");

      // ✅ Log the action to audit_log
      /*await logActivity("ADD_DOCTOR", {
      doctorId: data.doctor.user_id,
      doctorName: data.doctor.name,
      specialization: data.doctor.specialization,
    });*/

      navigate("/manage-doctors");
    } catch (err) {
      console.error("Error adding doctor:", err);
    }
  };


  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#f9f9f9] min-h-screen">
        <Navbar />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-teal-700">Add Doctor</h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-md max-w-2xl mx-auto"
          >
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Name */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Education */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="MBBS"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* License Number */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">License Number</label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                placeholder=""
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a secure password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Specialization */}
            <div className="mb-6">
              <label className="block mb-1 font-medium">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="Neurology"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Role (read-only) */}
            <div className="mb-6">
              <label className="block mb-1 font-medium">Role</label>
              <input
                type="text"
                name="role"
                value="Doctor"
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-lg transition-colors"
            >
              {loading ? "Adding Doctor..." : "Add Doctor"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}