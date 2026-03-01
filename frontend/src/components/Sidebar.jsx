import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white text-white min-h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-teal-700">MediScript</h1>
      <nav className="flex flex-col gap-4">
        <Link to="/admin-dashboard" className="hover:bg-teal-100 p-2 rounded text-teal-700">Dashboard</Link>
        <Link to="/manage-doctors" className="hover:bg-teal-100 p-2 rounded text-teal-700">Manage Doctors</Link>
        <Link to="/manage-patients" className="hover:bg-teal-100 p-2 rounded text-teal-700">Manage Patients</Link>
        
      </nav>
    </div>
  );
}