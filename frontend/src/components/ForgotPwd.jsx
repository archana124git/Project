import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPwd() {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp, 3 = reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  // Step 1: Send OTP
const handleSendOtp = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:5000/auth/forgot-password", { email });
    console.log("Response:", res.data);
    setMessage("OTP sent to your email!"); // show message
    setStep(2); // move to OTP input page
  } catch (err) {
    if (err.response) {
      console.error("[DEBUG] Server responded with error:", err.response.data);
      setMessage(err.response.data.message || "Failed to send OTP.");
    } else if (err.request) {
      console.error("[DEBUG] No response received:", err.request);
      setMessage("No response from server.");
    } else {
      console.error("[DEBUG] Axios error:", err.message);
      setMessage("Error sending OTP.");
    }
  }
};

// Step 2: Verify OTP
const handleVerifyOtp = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:5000/auth/verify-otp", { email, otp });
    console.log("OTP verified:", res.data);
    setMessage("OTP Verified!");
    setStep(3); // move to reset password page
  } catch (error) {
    console.error("OTP verification error:", error.response?.data || error.message);
    setMessage("Invalid OTP!");
  }
};

// Step 3: Reset Password
const handleResetPassword = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:5000/auth/reset-password", { email, new_password:newPassword });
    console.log("Password reset:", res.data);
    setMessage("Password reset successfully!");
    setStep(4); // move to success page
  } catch (error) {
    console.error("Reset password error:", error.response?.data || error.message);
    setMessage("Reset failed.");
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              required
            />
            <button className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              required
            />
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 pr-10 border rounded"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
              Reset Password
            </button>
          </form>
        )}

        {step === 4 && (
          <p className="text-green-600 text-center font-semibold">✅ Password Reset Successful!</p>
        )}

        {message && <p className="text-center text-sm text-gray-700 mt-3">{message}</p>}

        <p className="text-center text-sm mt-4">
          <Link to="/" className="text-blue-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
