import React, { useEffect, useState } from "react";
import {
  Package,
  AlertCircle,
  ClipboardList,
  LogOut,
} from "lucide-react";
import supabase from "../supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventory");

  // ================= INVENTORY =================
  const [inventory] = useState([]);

  // ================= PRESCRIPTIONS =================
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [searchText, setSearchText] = useState("");

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  // ================= FETCH =================
  useEffect(() => {
    fetchPrescriptions(selectedDate);
  }, [selectedDate]);

  async function fetchPrescriptions(date) {
    setLoading(true);

    try {
      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;

      // 1️⃣ Prescriptions
      const { data: presData, error: presError } = await supabase
        .from("prescriptions")
        .select("prescription_id, patient_id, created_at")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });

      if (presError) throw presError;

      if (!presData || presData.length === 0) {
        setPrescriptions([]);
        setLoading(false);
        return;
      }

      // 2️⃣ Patients insurance - fetch from backend API to bypass RLS restrictions
      const patientIds = [...new Set(presData.map(p => p.patient_id))];
      
      const token = localStorage.getItem("token");
      let patientData = [];
      
      try {
        // Fetch all patients from backend (which uses admin client, no RLS)
        const patientsRes = await axios.get(
          `http://localhost:5000/patients`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const allPatients = patientsRes.data?.patients || [];
        console.log("All patients from backend:", allPatients);
        
        // Filter to only the patients in our prescriptions
        patientData = allPatients.filter(p => patientIds.includes(p.patient_id));
        console.log("Filtered patients with insurance data:", patientData);
      } catch (err) {
        console.error("Failed to fetch patients from backend:", err);
        // Fallback to direct Supabase query
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .in("patient_id", patientIds);
        
        if (error) {
          console.error("Patient fetch error:", error);
          throw error;
        }
        patientData = data || [];
      }

      // ✅ NORMALIZED MAP
        const patientMap = {};
        const patientDataArr = patientData || [];
        // debug: log full patient data to see all columns returned
        console.log("Full patientData (all columns):", patientDataArr);
        if (patientDataArr.length > 0) {
          console.log("Sample patient keys:", Object.keys(patientDataArr[0]));
        }
        patientDataArr.forEach(p => {
          // store under both original and string key to avoid type mismatches
          patientMap[p.patient_id] = p;
          patientMap[String(p.patient_id)] = p;
        });

      // 3️⃣ Prescription medicines
      const prescriptionIds = presData.map(p => p.prescription_id);

      const { data: pmData, error: pmError } = await supabase
        .from("prescription_medicine")
        .select("prescription_id, medicine_id, dosage, frequency")
        .in("prescription_id", prescriptionIds);

      if (pmError) throw pmError;

      // 4️⃣ Medicine names
      const medicineIds = [...new Set(pmData.map(m => m.medicine_id))];

      const { data: medicines } = await supabase
        .from("medicine")
        .select("medicine_id, name")
        .in("medicine_id", medicineIds);

      const medicineMap = {};
      medicines.forEach(m => (medicineMap[m.medicine_id] = m.name));

      // 5️⃣ Diagnosis
      const finalData = await Promise.all(
        presData.map(async p => {
          let diagnosis = "Not Available";
          try {
            const res = await axios.get(
              `http://localhost:5000/diagnosis/patient/${p.patient_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            diagnosis = res.data?.[0]?.disease_name || diagnosis;
          } catch {}

          // Lookup patient entry by the original patient_id (no case transform)
          const patientEntry = patientMap[p.patient_id] || patientMap[String(p.patient_id)];

          // try multiple possible field names as fallbacks
          const rawType =
            patientEntry?.insurance_type ?? patientEntry?.insuranceType ?? patientEntry?.insurance ?? null;
          const rawStatus =
            patientEntry?.insurance_status ?? patientEntry?.insuranceStatus ?? patientEntry?.status ?? null;

            // ✅ NORMALIZE INSURANCE (robust to casing and empty values)
            const hasValidType =
              rawType && String(rawType).trim() !== "" && String(rawType).toUpperCase() !== "NONE";

            const insurance_type = hasValidType ? rawType : null;

            const insurance_status =
              insurance_type && rawStatus
                ? (typeof rawStatus === "string"
                    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
                    : rawStatus)
                : null;

            // debug resolved values per prescription
            console.debug("resolved insurance for patient", p.patient_id, {
              rawType,
              rawStatus,
              insurance_type,
              insurance_status,
            });

          return {
            prescription_id: p.prescription_id,
            patient_id: p.patient_id,
            visited_at: p.created_at,
            diagnosis,
            insurance_type,
            insurance_status,
            patient_raw: patientEntry || null,
            medicines: pmData
              .filter(m => m.prescription_id === p.prescription_id)
              .map(m => ({
                name: medicineMap[m.medicine_id] || "Unknown",
                dosage: m.dosage,
                frequency: m.frequency,
              })),
          };
        })
      );

      setPrescriptions(finalData);
    } catch (err) {
      console.error("Fetch error:", err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredPrescriptions = prescriptions.filter(p =>
    p.patient_id.toString().includes(searchText)
  );

  const patientsCount = prescriptions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <h1 className="text-2xl font-bold text-white">
            Pharmacy Dashboard
          </h1>
          <button onClick={handleLogout} className="flex items-center text-white hover:text-white/90">
            <LogOut size={18} />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
         
        <StatCard title="Patients" value={patientsCount} icon={<ClipboardList />} />
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by Patient ID"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="border px-3 py-2 rounded w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border px-3 py-2 rounded w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full border">
              <thead className="bg-teal-100">
                <tr>
                  <th className="border px-4 py-2">Patient ID</th>
                  <th className="border px-4 py-2">Diagnosis</th>
                  <th className="border px-4 py-2">Insurance Name</th>
                  <th className="border px-4 py-2">Insurance Status</th>
                  <th className="border px-4 py-2">Visited</th>
                  <th className="border px-4 py-2">Medicines</th>
                </tr>
              </thead>

              <tbody>
                {filteredPrescriptions.map(p => (
                  <tr key={p.prescription_id}>
                    <td className="border px-4 py-2">{p.patient_id}</td>
                    <td className="border px-4 py-2">{p.diagnosis}</td>

                    <td className="border px-4 py-2">
                      {p.insurance_type ? (
                        <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-sm font-semibold">
                          {p.insurance_type}
                        </span>
                      ) : (
                        <div>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">No Insurance</span>
                          <div className="text-xs text-gray-400 mt-1">
                            {p.patient_raw?.insurance_type ?? "(missing)"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {p.insurance_status === "Active" && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-semibold">
                          Active
                        </span>
                      )}
                      {p.insurance_status === "Inactive" && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-semibold">
                          Inactive
                        </span>
                      )}
                      {!p.insurance_status && (
                        <div>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">N/A</span>
                          <div className="text-xs text-gray-400 mt-1">
                             {p.patient_raw?.insurance_status ?? "(missing)"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {new Date(p.visited_at).toLocaleString()}
                    </td>

                    <td className="border px-4 py-2">
                      <ul className="list-disc ml-4">
                        {p.medicines.map((m, i) => (
                          <li key={i}>
                            <b>{m.name}</b> — {m.dosage}, {m.frequency}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-5 rounded shadow flex items-center space-x-4">
      <div className="p-3 bg-teal-50 rounded-full text-teal-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold text-teal-700">{value}</p>
      </div>
    </div>
  );
}