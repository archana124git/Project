import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // clear previous errors
  
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });
  
  
      const data = await res.json();
      console.log("Login response:", data);
  
      if (data.error) {
        setError(data.error);
        return;
      }
  
      const { token, role } = data;
      console.log("Received role:", role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
  
      // Navigate based on user role
      if (role.toLowerCase() === "doctor") {
        navigate("/dashboard", { replace: true });
      } else if (role.toLowerCase() === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      } // fallback
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };
      

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F8F7]">
      {/* Welcome Heading */}
      <h1 className="text-4xl font-bold text-teal-700 mb-8 text-center">
        Welcome to MediScript
      </h1>

      {/* Login Form */}
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Admin Login</h2>

        {/* Username Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
        </div>

        {/* Password Input */}
        <div className="mb-2 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>


        {/* Forgot Password */}
        <div className="text-right mb-6">
          <Link
            to="/forgot-pwd"
            className="text-sm text-teal-600 hover:text-teal-700"
          >
            Forgot password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-lg transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}