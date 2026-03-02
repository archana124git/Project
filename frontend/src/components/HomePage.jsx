import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function HomePage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const { token, role } = data;
      localStorage.setItem("token", token);

      if (role.toLowerCase() === "doctor") navigate("/dashboard");
      else if (role.toLowerCase() === "admin") navigate("/admin-dashboard");
      else if (role.toLowerCase() === "pharmacist")
        navigate("/pharmacy-dashboard");
      else navigate("/");
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    
      <div className="h-screen relative flex bg-white overflow-hidden">

      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-12 relative overflow-hidden">

        {/* Grid pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Floating shapes */}
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">MediScript</h1>
          </div>

          {/* Main content */}
          <div className="space-y-8 mt-20">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-medium">
                  Healthcare Innovation
                </span>
              </div>

              <h2 className="text-5xl font-bold text-white leading-tight">
                AI-Powered<br />
                Clinical<br />
                Documentation
              </h2>

              <p className="text-xl text-white/90 leading-relaxed max-w-md">
                Revolutionize your medical practice with intelligent voice transcription and automated prescription generation
              </p>
            </div>

            
            
          </div>

          
          
        </div>
      </div>

      {/* ── Right Login Panel ── */}
      <div className="flex-1 flex flex-col">

        {/* Top nav */}
        <div className="flex justify-between items-center p-6 lg:p-8">
          {/* Mobile logo only */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">MediScript</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-600">Need help?</span>
            <Link
              to="/admin-login"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              Admin
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/patient"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              Patient
            </Link>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            <div className="mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Sign In</h2>
              <p className="text-gray-600 text-lg">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">

              {/* User ID */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="DOC1001"
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-300 font-medium"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-4 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-300 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-teal-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Keep me signed in</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg tracking-wide"
              >
                Sign In
              </button>

              {/* Forgot */}
              <div className="text-center">
                <Link
                  to="/forgot-pwd"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border-2 border-red-200 error-shake">
                <p className="text-red-600 text-center text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Security note */}
            <div className="mt-10 pt-8 border-t-2 border-gray-100">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium">Secured with 256-bit SSL encryption</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Global Styles ── */}
      <style>{`
        .shape {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .shape-1 {
          width: 200px; height: 200px;
          top: 10%; right: 10%;
          animation: float1 15s ease-in-out infinite;
        }

        .shape-2 {
          width: 150px; height: 150px;
          bottom: 20%; left: 15%;
          animation: float2 20s ease-in-out infinite;
        }

        .shape-3 {
          width: 180px; height: 180px;
          top: 50%; right: 20%;
          animation: float3 18s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          }
          50% {
            transform: translate(30px, -30px) rotate(180deg);
            border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          }
          50% {
            transform: translate(-20px, 40px) rotate(-180deg);
            border-radius: 60% 40% 30% 70% / 60% 50% 40% 60%;
          }
        }

        @keyframes float3 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            border-radius: 50% 50% 30% 70% / 50% 30% 70% 50%;
          }
          50% {
            transform: translate(25px, 35px) rotate(180deg);
            border-radius: 50% 50% 70% 30% / 50% 70% 30% 50%;
          }
        }

        .error-shake {
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-10px); }
          75%       { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

export default HomePage;