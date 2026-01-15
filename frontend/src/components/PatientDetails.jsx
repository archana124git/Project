import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { User, Mic } from "lucide-react";
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
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">
                Patient Details
              </h1>
              <p className="text-sm text-gray-500">
                ID: <span className="text-blue-600">{displayId}</span>
              </p>
            </div>
          </div>

          <div className="space-x-2">
            <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">
              Back
            </button>
            <button
              onClick={startListening}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              <Mic className="inline w-4 h-4 mr-1" />
              Start Listening
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* PATIENT INFO */}
        <div className="border rounded p-6 shadow">
          <h2 className="text-lg font-bold text-blue-900 mb-3">{displayName}</h2>
          <p><b>Age:</b> {displayAge}</p>
          <p><b>Gender:</b> {displayGender}</p>
          <p><b>Contact:</b> {displayContact}</p>
        </div>

        {/* DIAGNOSIS & MEDICATION HISTORY - SIDE BY SIDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* DIAGNOSIS HISTORY */}
          <div className="border rounded p-6 shadow">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              Diagnosis History
            </h2>

            {loadingDiag ? (
              <p className="text-gray-500">Loading diagnosis...</p>
            ) : diagnosisHistory.length === 0 ? (
              <p className="text-gray-500">No diagnosis recorded</p>
            ) : (
              <>
                {displayedDiagnosis.map(d => (
                  <div key={d.diagnosis_id} className="mb-3 border-b pb-2">
                    <p className="text-sm text-gray-600">
                      Date: {new Date(d.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <b>Diagnosis:</b> {d.disease_name}
                    </p>
                  </div>
                ))}
                
                {diagnosisHistory.length > 3 && (
                  <button
                    onClick={() => setShowAllDiagnosis(!showAllDiagnosis)}
                    className="text-blue-600 text-sm font-medium hover:underline mt-2"
                  >
                    {showAllDiagnosis ? "Show Less" : `Show More (${diagnosisHistory.length - 3} more)`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* MEDICATION HISTORY */}
          <div className="border rounded p-6 shadow">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              Past Medication History
            </h2>

            {loadingMeds ? (
              <p className="text-gray-500">Loading medications...</p>
            ) : medHistory.length === 0 ? (
              <p className="text-gray-500">No medications found</p>
            ) : (
              <>
                {displayedMedication.map(h => (
                  <div key={h.prescription_id} className="mb-4 border-b pb-3">
                    <p className="text-sm text-gray-600">
                      Date: {new Date(h.created_at).toLocaleDateString()}
                    </p>
                    <ul className="list-disc ml-5 text-sm">
                      {h.medicines.map((m, i) => (
                        <li key={i}>
                          <b>{m.name}</b> — {m.dosage}, {m.frequency}, {m.duration}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                {medHistory.length > 3 && (
                  <button
                    onClick={() => setShowAllMedication(!showAllMedication)}
                    className="text-blue-600 text-sm font-medium hover:underline mt-2"
                  >
                    {showAllMedication ? "Show Less" : `Show More (${medHistory.length - 3} more)`}
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