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
    <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating Particles */}
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Top Navigation */}
      <div className="absolute top-8 right-8 z-20 flex gap-3">

        <Link
          to="/admin-login"
          className="group relative px-6 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-all duration-300"
        >
          <span className="relative z-10">Admin Login</span>
          <span className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></span>
        </Link>
        <Link
  to="/patient"
  className="group relative px-6 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-all duration-300"
>
  <span className="relative z-10">Patient Login</span>
  <span className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></span>
</Link>

      </div>

      {/* Main Section */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-6xl bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex border border-white/10 login-container">

          {/* Left Branding Panel */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-purple-600/90 text-white p-16 items-center relative overflow-hidden">
            
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="wave-pattern"></div>
              </div>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="brand-title">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center logo-pulse">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h1 className="text-5xl font-bold tracking-tight">
                    MediScript
                  </h1>
                </div>
                <div className="h-1 w-24 bg-gradient-to-r from-white to-transparent rounded-full"></div>
              </div>

              <p className="text-blue-50 text-lg leading-relaxed max-w-md">
                Transform healthcare documentation with AI-powered precision and effortless voice-to-text clinical notes.
              </p>

              <div className="feature-card bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  How It Works
                </h2>
                <ol className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3 feature-item">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                    <span>Capture consultation using voice recognition</span>
                  </li>
                  <li className="flex items-start gap-3 feature-item">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                    <span>AI generates structured medical notes</span>
                  </li>
                  <li className="flex items-start gap-3 feature-item">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                    <span>Create instant digital prescriptions</span>
                  </li>
                </ol>
              </div>

              
            </div>
          </div>

          {/* Right Login Panel */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-10 py-16 bg-slate-900/40 backdrop-blur-xl">
            <div className="w-full max-w-md">

              <div className="text-center mb-10 fade-in">
                <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-slate-400 text-lg">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">

                <div className="form-group">
                  <label className="block text-sm font-semibold text-slate-300 mb-2.5 tracking-wide">
                    User ID
                  </label>
                  <div className="relative input-wrapper">
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="DOC1001"
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                      required
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-semibold text-slate-300 mb-2.5 tracking-wide">
                    Password
                  </label>
                  <div className="relative input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <div className="input-glow"></div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    to="/forgot-pwd"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="group relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:via-blue-400 hover:to-purple-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Login
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="button-shine"></div>
                </button>
              </form>

              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm error-shake">
                  <p className="text-red-400 text-center text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-slate-500 text-sm">
                  Secured by enterprise-grade encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations & Styles */}
      <style>
        {`
          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .bg-grid-pattern {
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
          }

          .particle {
            position: absolute;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
            border-radius: 50%;
            animation: float 20s infinite;
          }

          .particle-1 { width: 4px; height: 4px; top: 20%; left: 10%; animation-delay: 0s; }
          .particle-2 { width: 6px; height: 6px; top: 40%; left: 30%; animation-delay: 2s; }
          .particle-3 { width: 3px; height: 3px; top: 60%; left: 50%; animation-delay: 4s; }
          .particle-4 { width: 5px; height: 5px; top: 30%; left: 70%; animation-delay: 1s; }
          .particle-5 { width: 4px; height: 4px; top: 70%; left: 20%; animation-delay: 3s; }
          .particle-6 { width: 6px; height: 6px; top: 50%; left: 85%; animation-delay: 5s; }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
            50% { transform: translate(30px, -100px) scale(1.5); opacity: 0.6; }
          }

          .login-container {
            animation: slideUp 0.6s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .fade-in {
            animation: fadeIn 0.8s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .brand-title {
            animation: fadeInLeft 0.8s ease-out;
          }

          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .feature-card {
            animation: fadeInLeft 1s ease-out 0.2s both;
          }

          .feature-item {
            animation: fadeInLeft 0.6s ease-out both;
          }

          .feature-item:nth-child(1) { animation-delay: 0.3s; }
          .feature-item:nth-child(2) { animation-delay: 0.4s; }
          .feature-item:nth-child(3) { animation-delay: 0.5s; }

          .stat-badge {
            animation: fadeInLeft 0.8s ease-out 0.6s both;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .logo-pulse {
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          .wave-pattern {
            width: 100%;
            height: 100%;
            background: 
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.03) 10px,
                rgba(255, 255, 255, 0.03) 20px
              );
            animation: wave 20s linear infinite;
          }

          @keyframes wave {
            0% { transform: translateX(0); }
            100% { transform: translateX(40px); }
          }

          .form-group {
            animation: fadeIn 0.8s ease-out both;
          }

          .form-group:nth-child(1) { animation-delay: 0.2s; }
          .form-group:nth-child(2) { animation-delay: 0.3s; }

          .input-wrapper {
            position: relative;
          }

          .input-glow {
            position: absolute;
            inset: -2px;
            border-radius: 16px;
            background: linear-gradient(45deg, #3b82f6, #8b5cf6);
            opacity: 0;
            z-index: -1;
            transition: opacity 0.3s;
            filter: blur(8px);
          }

          .input-wrapper:focus-within .input-glow {
            opacity: 0.5;
          }

          .button-shine {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            transition: left 0.5s;
          }

          button:hover .button-shine {
            left: 100%;
          }

          .error-shake {
            animation: shake 0.5s, fadeIn 0.3s;
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
        `}
      </style>
    </div>
  );
}

export default HomePage;