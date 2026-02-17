import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { User, Mic, ArrowLeft } from "lucide-react";
import axios from "axios";
import supabase from "../supabaseClient";

export default function PatientDetails() {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { patient, doctorProfile } = location.state || {};

  // ===================== PATIENT INFO =====================
  const displayId = patient?.patient_id || patientId;
  const displayName = patient?.name || "Unknown Patient";
  const displayAge = patient?.age || "N/A";
  const displayGender = patient?.gender || "N/A";
  const displayContact = patient?.contact || "N/A";

  // ===================== STATE =====================
  const [medHistory, setMedHistory] = useState([]);
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [loadingDiag, setLoadingDiag] = useState(true);
  const [showAllDiagnosis, setShowAllDiagnosis] = useState(false);
  const [showAllMedication, setShowAllMedication] = useState(false);

  // ===================== START LISTENING =====================
  const startListening = () => {
    navigate("/listening", {
      state: {
        from: "patient-details",
        doctor: doctorProfile,
        patient: {
          patient_id: displayId,
          name: displayName,
          age: displayAge,
          gender: displayGender,
          contact: displayContact,
        },
      },
    });
  };

  // ===================== MEDICATION HISTORY (SUPABASE) =====================
  useEffect(() => {
    async function fetchMedicationHistory() {
      setLoadingMeds(true);

      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select("prescription_id, created_at")
        .eq("patient_id", displayId)
        .order("created_at", { ascending: false });

      if (!prescriptions?.length) {
        setMedHistory([]);
        setLoadingMeds(false);
        return;
      }

      const prescriptionIds = prescriptions.map(p => p.prescription_id);

      const { data: pmData } = await supabase
        .from("prescription_medicine")
        .select("prescription_id, medicine_id, dosage, frequency, duration")
        .in("prescription_id", prescriptionIds);

      if (!pmData?.length) {
        setMedHistory([]);
        setLoadingMeds(false);
        return;
      }

      const medicineIds = [...new Set(pmData.map(pm => pm.medicine_id))];

      const { data: medicines } = await supabase
        .from("medicine")
        .select("medicine_id, name")
        .in("medicine_id", medicineIds);

      const medicineMap = {};
      medicines?.forEach(m => (medicineMap[m.medicine_id] = m.name));

      const combined = prescriptions.map(p => ({
        prescription_id: p.prescription_id,
        created_at: p.created_at,
        medicines: pmData
          .filter(pm => pm.prescription_id === p.prescription_id)
          .map(pm => ({
            name: medicineMap[pm.medicine_id] || "Unknown",
            dosage: pm.dosage,
            frequency: pm.frequency,
            duration: pm.duration,
          })),
      }));

      setMedHistory(combined);
      setLoadingMeds(false);
    }

    if (displayId) fetchMedicationHistory();
  }, [displayId]);

  // ===================== DIAGNOSIS HISTORY (BACKEND – FINAL FIX) =====================
  useEffect(() => {
    async function fetchDiagnosisHistory() {
      setLoadingDiag(true);

      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:5000/diagnosis/patient/${displayId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDiagnosisHistory(res.data || []);
      } catch (err) {
        console.error(
          "Diagnosis fetch error:",
          err.response?.data || err.message
        );
        setDiagnosisHistory([]);
      } finally {
        setLoadingDiag(false);
      }
    }

    if (displayId) fetchDiagnosisHistory();
  }, [displayId]);

  // ===================== DIAGNOSIS DISPLAY LOGIC =====================
  const displayedDiagnosis = showAllDiagnosis
    ? diagnosisHistory
    : diagnosisHistory.slice(0, 3);

  const displayedMedication = showAllMedication
    ? medHistory
    : medHistory.slice(0, 3);

  // ===================== UI =====================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ── */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/30">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Patient Details
              </h1>
              <p className="text-sm text-white/80">
                ID: <span className="font-semibold text-white">{displayId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={startListening}
              className="px-4 py-2 bg-white text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Listening
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── PATIENT INFO CARD ── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-800">{displayName}</h2>
              <p className="text-sm text-teal-600">Patient ID: {displayId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Age</p>
              <p className="text-gray-800 font-medium mt-1">{displayAge}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Gender</p>
              <p className="text-gray-800 font-medium mt-1">{displayGender}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Contact</p>
              <p className="text-gray-800 font-medium mt-1">{displayContact}</p>
            </div>
          </div>
        </div>

        {/* ── DIAGNOSIS & MEDICATION HISTORY SIDE BY SIDE ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* DIAGNOSIS HISTORY */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full inline-block"></span>
              Diagnosis History
            </h2>

            {loadingDiag ? (
              <p className="text-gray-400 text-sm">Loading diagnosis...</p>
            ) : diagnosisHistory.length === 0 ? (
              <p className="text-gray-400 text-sm">No diagnosis recorded</p>
            ) : (
              <>
                {displayedDiagnosis.map(d => (
                  <div key={d.diagnosis_id} className="mb-3 border-b border-gray-100 pb-3 last:border-0">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(d.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </p>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold text-teal-700">Diagnosis:</span>{" "}
                      {d.disease_name}
                    </p>
                  </div>
                ))}

                {diagnosisHistory.length > 3 && (
                  <button
                    onClick={() => setShowAllDiagnosis(!showAllDiagnosis)}
                    className="text-teal-600 hover:text-teal-700 text-sm font-semibold hover:underline mt-2 transition-colors"
                  >
                    {showAllDiagnosis
                      ? "Show Less"
                      : `Show More (${diagnosisHistory.length - 3} more)`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* MEDICATION HISTORY */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full inline-block"></span>
              Past Medication History
            </h2>

            {loadingMeds ? (
              <p className="text-gray-400 text-sm">Loading medications...</p>
            ) : medHistory.length === 0 ? (
              <p className="text-gray-400 text-sm">No medications found</p>
            ) : (
              <>
                {displayedMedication.map(h => (
                  <div key={h.prescription_id} className="mb-4 border-b border-gray-100 pb-3 last:border-0">
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(h.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </p>
                    <ul className="space-y-1">
                      {h.medicines.map((m, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          <span>
                            <span className="font-semibold text-teal-700">{m.name}</span>
                            {" "}— {m.dosage}, {m.frequency}, {m.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {medHistory.length > 3 && (
                  <button
                    onClick={() => setShowAllMedication(!showAllMedication)}
                    className="text-teal-600 hover:text-teal-700 text-sm font-semibold hover:underline mt-2 transition-colors"
                  >
                    {showAllMedication
                      ? "Show Less"
                      : `Show More (${medHistory.length - 3} more)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}