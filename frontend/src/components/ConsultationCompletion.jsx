import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Pill, Plus, Trash2, User, FileText,  Calendar , CheckCircle, Search, AlertCircle, Activity, Shield, Sparkles, Clock, Package, ChevronRight, Stethoscope, Heart, FlaskConical } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrescriptionPreview from "../components/PrescriptionPreview";
import { extractFieldsFromSummary } from "../../utils/extractFieldsFromSummary";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import supabase from "../supabaseClient"; 


function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded-full w-2/3" />
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-gray-100 rounded-lg" />
            <div className="h-8 bg-gray-100 rounded-lg" />
            <div className="h-8 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

// ─── Stat Chip ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, color = "purple" }) {
  const colors = {
    purple: "bg-violet-50 text-violet-700 border-violet-100",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">{label}</p>
      <p className="font-bold text-sm truncate">{value || 'N/A'}</p>
    </div>
  );
}

export default function ConsultationCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const { convo_id, convo_number, transcript, summary, doctor, patient } = location.state || {};

  if (!doctor || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center max-w-sm mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Missing Information</h2>
          <p className="text-gray-500 text-sm mb-6">Doctor or patient data could not be loaded.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [prescribedMedicines, setPrescribedMedicines] = useState([]);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [editableSummary, setEditableSummary] = useState(summary || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState(null);
  const [formData, setFormData] = useState({ diagnosis: "", severity: "Moderate", additionalNotes: "" });
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sideEffects, setSideEffects] = useState([]);
  const [showMedicineError, setShowMedicineError] = useState(false);
  
  const showAlert = (message) => {
    setErrorMessage(message);
    setShowError(true);
  };
  const [incompleteRows, setIncompleteRows] = useState([]);
  const [supportiveMedicines, setSupportiveMedicines] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);
    // ── Revisit states ──
  const [revisitEnabled, setRevisitEnabled] = useState(false);
  const [revisitDays, setRevisitDays] = useState(5);
  const [revisitReason, setRevisitReason] = useState("");
  const [revisitDate, setRevisitDate] = useState("");
  const [revisitSaved, setRevisitSaved] = useState(false);
  const [revisitError, setRevisitError] = useState("");
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (!editableSummary) return;
    const extracted = extractFieldsFromSummary(editableSummary);
    setFormData(prev => ({
      ...prev,
      diagnosis: extracted.diagnosis || prev.diagnosis,
      severity: extracted.severity || prev.severity
    }));
  }, [editableSummary]);

  
  useEffect(() => {
    const fetchHolidays = async () => {
      const { data, error } = await supabase
        .from("public_holidays")
        .select("date");
  
      if (error) {
        console.error("Holiday fetch error:", error);
      } else {
        const formatted = data.map(h => h.date);
        setHolidays(formatted);
      }
    };
  
    fetchHolidays();
  }, []);

  // Auto-calculate revisit date when days change
  useEffect(() => {
    if (!revisitDays) return;
  
    let date = new Date();
    let daysToAdd = Number(revisitDays);
  
    while (daysToAdd > 0) {
      date.setDate(date.getDate() + 1);
  
      const day = date.getDay();
      const formatted = date.toISOString().split("T")[0];
  
      // Skip Sunday + holidays
      if (day !== 0 && !holidays.includes(formatted)) {
        daysToAdd--;
      }
    }
  
    setRevisitDate(date.toISOString().split("T")[0]);
  }, [revisitDays, holidays]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  useEffect(() => {
    if (!showError) return;
    const timer = setTimeout(() => setShowError(false), 3000);
    return () => clearTimeout(timer);
  }, [showError]);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const weight = Number(patient.weight);
      const safeWeight = isNaN(weight) || weight <= 0 ? 65 : weight;
      const formattedGender = patient.gender ? patient.gender.trim().toLowerCase() : "";
      const res = await fetch("http://localhost:5001/recommendations/medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: Number(patient.age), weight: safeWeight, gender: formattedGender,
          diagnosis: formData.diagnosis?.trim().toLowerCase() || "",
          severity: formData.severity?.trim().toLowerCase() || "",
          patient_id: patient.patient_id
        })
      });
      if (!res.ok) { const errorText = await res.text(); console.error("Backend error:", errorText); throw new Error("Failed to fetch recommendations"); }
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setSupportiveMedicines(data.supportive_medicine || data.side_effects || []);
    } catch (err) {
      console.error("Recommendation fetch error:", err);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };
  const displayWeight =
  patient.weight && Number(patient.weight) > 0
    ? `${patient.weight} kg`
    : "65 kg";

  const deletePrescription = async (prescriptionId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete prescription");
    } catch (error) { console.error("Delete prescription error:", error); }
  };

  const searchMedicine = async (query, rowId) => {
    const currentMed = prescribedMedicines.find(m => m.id === rowId);
    if (!query || query.length < 2 || currentMed?.medicine_id) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/diagnosis/search?query=${query}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Search API failed");
      const data = await res.json();
      setSearchResults(prev => ({ ...prev, [rowId]: data }));
    } catch (err) { console.error("MEDICINE SEARCH ERROR:", err); } finally { setSearchLoading(false); }
  };

  const handleAddMedicine = () => {
    if (prescribedMedicines.length > 0) {
      const last = prescribedMedicines[prescribedMedicines.length - 1];
      if (!last.medicine_id || !last.name || last.name.trim() === "") {
        showAlert("Please select a valid medicine in the last row before adding another.");
        return;
      }
    }
    setPrescribedMedicines([...prescribedMedicines, {
      id: Date.now(), medicine_id: "", name: "", dosage: "500 mg",
      frequency: "1-0-1", duration: "3 days", quantity: 1, before_meal: "after"
    }]);
  };

  const handleRemove = (id) => { setPrescribedMedicines(prescribedMedicines.filter(m => m.id !== id)); };

  const prescriptionData = {
    date: new Date().toLocaleDateString(),
    doctor: { name: doctor.name, specialization: doctor.specialization, license: doctor.license_number },
    patient: { id: patient.patient_id, name: patient.name, age: patient.age },
    medicines: prescribedMedicines.map(m => ({
      name: m.name, dosage: m.dosage, frequency: m.frequency,
      duration: m.duration, quantity: m.quantity, before_meal: m.before_meal
    }))
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cleanedMedicines = prescribedMedicines.filter(
      m => m.medicine_id && m.name && m.name.trim() !== "" && m.dosage && m.frequency && m.duration && m.quantity
    );
    if (cleanedMedicines.length === 0) {
      setShowMedicineError(true);
      setTimeout(() => setShowMedicineError(false), 3000);
      setSaving(false);
      setIncompleteRows(prescribedMedicines.filter(m => !m.medicine_id || !m.name || m.name.trim() === "").map(m => m.id));
      return;
    }
    setIncompleteRows([]);
    try {
      const summaryRes = await fetch("http://localhost:5000/clinical-summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ convo_id, subjective: editableSummary, objective: editableSummary, assessment: editableSummary, plan: editableSummary }),
      });
      if (!summaryRes.ok) throw new Error("Failed to save clinical summary");
      const summaryData = await summaryRes.json();
      const summary_id = summaryData.summary_id;

      const diagnosisRes = await fetch("http://localhost:5000/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ summary_id, diagnosis: formData.diagnosis }),
      });
      if (!diagnosisRes.ok) throw new Error("Failed to save diagnosis");

      const prescriptionRes = await fetch("http://localhost:5000/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          doctor_id: doctor.user_id, patient_id: patient.patient_id,
          medicines: cleanedMedicines.map(m => ({
            medicine_id: m.medicine_id, name: m.name, dosage: m.dosage,
            frequency: m.frequency, duration: m.duration, quantity: m.quantity, before_meal: m.before_meal
          }))
        }),
      });
      if (!prescriptionRes.ok) { const errorData = await prescriptionRes.json().catch(() => ({})); console.error("Prescription API error:", errorData); throw new Error("Failed to save prescription"); }
      const prescriptionData = await prescriptionRes.json();
      setSavedPrescriptionId(prescriptionData.prescription_id);
      await updateAppointmentStatus();
      setShowSuccess(true);
      setShowPreview(true);
    } catch (error) {
      console.error("CONSULTATION SAVE ERROR:", error);
      alert("Failed to save consultation data");
    } finally {
      setSaving(false);
    }
  };

  // Update appointment status after saving prescription
  const updateAppointmentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("doctor_id", doctor.user_id)
        .eq("patient_id", patient.patient_id)
        .select();

      if (error) {
        console.error("Status update failed:", error);
      } else {
        console.log("Status updated successfully:", data);
        setShowSuccess(true);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("CONSULTATION SAVE ERROR:", error);
      alert("Failed to save consultation data");
    }
  };
  
  //Revisit 
  const handleSaveRevisit = async () => {
    
      if (!revisitEnabled) {
      alert("Enable revisit first.");
      return;
    }
  
    if (!revisitDate || !revisitReason.trim()) {
      setRevisitError("Please fill in both revisit date and reason.");
      return;
    }
  
    try {
      const { error } = await supabase
        .from("revisit_appointments")
        .insert([{
          patient_id: patient.patient_id,
          doctor_id: doctor.user_id,
          prescription_id: savedPrescriptionId,
          suggested_date: revisitDate,
          reason: revisitReason.trim(),
          status: "pending"
        }]);
  
      if (error) throw error;
  
      setRevisitSaved(true);
      setShowSuccess(true);
  
    } catch (err) {
      console.error("Revisit save error:", err);
      setRevisitError("Failed to save revisit.");
    }
  };

  
  const lastMed = prescribedMedicines[prescribedMedicines.length - 1];
  const addMedDisabled = prescribedMedicines.length > 0 && (!lastMed?.medicine_id || !lastMed?.name || lastMed?.name.trim() === "");

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #f8faff 50%, #faf5ff 100%)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Toast Notifications ── */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-emerald-200 animate-[slideIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Consultation updated successfully</p>
            {revisitSaved && (
              <p className="text-sm text-green-100 mt-0.5">
                ✓ Revisit scheduled for {new Date(revisitDate).toDateString()}
              </p>
            )}
            <p className="text-xs text-emerald-100">All records updated successfully.</p>
          </div>
        </div>
      )}
      {showDeleteSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-red-500 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-red-200 animate-[slideIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Prescription Deleted</p>
            <p className="text-xs text-red-100">Record removed from system.</p>
          </div>
        </div>
      )}
      {showError && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-red-200 animate-[slideIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Save Failed</p>
            <p className="text-xs text-red-100">{errorMessage}</p>
          </div>
        </div>
      )}
      {showMedicineError && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-amber-500 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-amber-200 animate-[slideIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">No Valid Medicine</p>
            <p className="text-xs text-amber-100">Select at least one medicine to proceed.</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-teal-600 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-200">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Complete Consultation</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">{convo_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Doctor & Patient Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Doctor Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-50" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)' }}>
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Attending Physician</h2>
                <p className="text-xs text-gray-400">Consultation Doctor</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-1">
              <InfoRow label="Doctor ID" value={doctor.user_id} />
              <InfoRow label="Full Name" value={doctor.name} />
              <InfoRow label="Specialization" value={doctor.specialization} />
              <InfoRow label="License No." value={doctor.license_number} />
            </div>
          </div>

          {/* Patient Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-50" style={{ background: 'linear-gradient(135deg, #f0fdf9, #ecfdf5)' }}>
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Patient Profile</h2>
                <p className="text-xs text-gray-400">Consultation {convo_number}</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-1">
              <InfoRow label="Patient ID" value={patient.patient_id} />
              <InfoRow label="Full Name" value={patient.name} />
              <InfoRow label="Blood Group" value={patient.Blood_group} />
              <InfoRow label="Allergies" value={patient.allergies?.join(", ") || "None recorded"} />
            </div>
          </div>
        </div>

        {/* ── Clinical Summary ── */}
        {editableSummary && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-50">
              <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Clinical Summary</h2>
                <p className="text-xs text-gray-400">CRT — Consultation Record Transcript</p>
              </div>
              <span className="ml-auto text-xs bg-violet-50 text-violet-600 font-semibold px-2.5 py-1 rounded-full border border-violet-100">Editable</span>
            </div>
            <div className="p-5">
              <textarea
                className="w-full p-4 text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none placeholder:text-gray-400"
                rows={8}
                value={editableSummary}
                onChange={(e) => setEditableSummary(e.target.value)}
                placeholder="Enter clinical summary..."
              />
            </div>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Diagnosis & Severity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Diagnosis & Severity</h2>
                <p className="text-xs text-gray-400">Primary assessment for this consultation</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Primary Diagnosis</label>
                  <textarea
                    className="w-full p-3.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all resize-none"
                    required rows={1}
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="Describe the primary diagnosis..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Severity Level</label>
                  <select
                    className="w-full p-3.5 text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all appearance-none"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    required
                  >
                    <option value="mild">🟢 Mild</option>
                    <option value="moderate">🟡 Moderate</option>
                    <option value="severe">🔴 Severe</option>
                  </select>
                </div>
              </div>

              {formData.diagnosis && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={fetchRecommendations}
                    disabled={loadingRecommendations}
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    style={{ background: loadingRecommendations ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                  >
                    {loadingRecommendations ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Analyzing Patient Data…</span></>
                    ) : (
                      <><Sparkles className="w-4 h-4" /><span>Get AI Recommendations</span></>
                    )}
                  </button>
                </div>               
              )}                
            </div>
          </div>


          {/* ── AI Recommendations ── */}
          {(loadingRecommendations || recommendations.length > 0) && (
            <div className="rounded-2xl overflow-hidden border border-violet-200 shadow-lg shadow-violet-50">
              {/* Header */}
              <div className="px-6 py-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,rgb(41, 169, 148),rgb(110, 164, 208))' }}>
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">AI-Powered Recommendations</h2>
                  <p className="text-violet-200 text-xs mt-0.5">ML analysis based on age, weight, gender, severity & diagnosis</p>
                </div>
              </div>

              <div className="bg-white p-5 space-y-4">
                {/* Analysis Chips */}
                {!loadingRecommendations && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <StatChip label="Age" value={`${patient.age} yrs`} color="purple" />
                    <StatChip label="Weight" value={displayWeight} color="teal" />
                    <StatChip label="Gender" value={patient.gender} color="blue" />
                    <StatChip label="Severity" value={formData.severity} color="amber" />
                    <StatChip label="Diagnosis" value={formData.diagnosis?.substring(0, 18)} color="rose" />
                  </div>
                )}

                {/* Skeletons */}
                {loadingRecommendations && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                  </div>
                )}

                {/* Recommendation Cards */}
                {!loadingRecommendations && recommendations.map((rec, index) => {
                  const isAdded = prescribedMedicines.some(med => med.name === rec.medicine_name);
                  return (
                    <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-lg bg-violet-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-bold text-gray-900 text-base truncate">{rec.medicine_name}</h3>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`http://localhost:5000/diagnosis/search?query=${rec.medicine_name}`, { headers: { Authorization: `Bearer ${token}` } });
                                    if (!res.ok) throw new Error("Search failed");
                                    const data = await res.json();
                                    let matchedMedicine = null;
                                    if (Array.isArray(data?.medicines) && data.medicines.length > 0) {
                                      matchedMedicine = data.medicines.find(m => m.name.toLowerCase() === rec.medicine_name.toLowerCase()) || data.medicines[0];
                                    }
                                    if (!matchedMedicine && Array.isArray(data?.alternatives) && data.alternatives.length > 0) {
                                      matchedMedicine = data.alternatives[0];
                                    }
                                    if (!matchedMedicine) { showAlert("Medicine not found in hospital pharmacy."); return; }
                                    const alreadyExists = prescribedMedicines.some(med => med.medicine_id === matchedMedicine.medicine_id);
                                    if (alreadyExists) { showAlert("Medicine already added."); return; }
                                    const newMed = {
                                      id: Date.now() + Math.random(), medicine_id: matchedMedicine.medicine_id, name: matchedMedicine.name,
                                      dosage: rec.dosage || "1 tablet", frequency: rec.frequency || "1-0-1", duration: rec.duration || "5 days",
                                      quantity: rec.quantity || 1, before_meal: rec.before_meal || "after"
                                    };
                                    setPrescribedMedicines(prev => [...prev, newMed]);
                                  } catch (err) { console.error("Failed to fetch medicine ID:", err); }
                                }}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                  isAdded
                                    ? 'bg-[#6b7280] text-white border border-gray-500 hover:bg-gray-600'
                                    : 'bg-gradient-to-r from-[#0d9488] to-[#059669] text-white shadow-sm hover:shadow-md'
                                }`}
                              >
                                {isAdded ? <><CheckCircle className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2.5">
                              {rec.frequency && <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"><Clock className="w-3 h-3 text-gray-400" />{rec.frequency}</span>}
                              {rec.duration && <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"><Activity className="w-3 h-3 text-gray-400" />{rec.duration}</span>}
                              {rec.quantity && <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"><Package className="w-3 h-3 text-gray-400" />Qty: {rec.quantity}</span>}
                            </div>

                            {rec.reason && (
                              <p className="text-xs text-gray-500 mt-2.5 italic flex items-start gap-1.5">
                                <span className="text-violet-400 flex-shrink-0 mt-0.5">💡</span>{rec.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Side Effects Alert */}
                      {rec.supportive_medicines?.length > 0 && (
                        <div className="mx-4 mb-4 rounded-xl bg-red-50 border border-red-100 p-3">
                          <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 mb-2">
                            <AlertCircle className="w-3.5 h-3.5" /> Possible Side Effects & Support
                          </p>
                          <div className="space-y-1">
                            {rec.supportive_medicines.map((effect, i) => (
                              <p key={i} className="text-xs text-red-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                May cause <strong>{effect.effect}</strong>
                                <ChevronRight className="w-3 h-3 text-red-300" />
                                Take <strong>{effect.support}</strong>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              

                {/* Supportive Medicines */}
                {!loadingRecommendations && supportiveMedicines.length > 0 && (
                  <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-bold text-teal-800 text-sm">Supportive Medicines</h3>
                      <span className="ml-auto text-[10px] font-semibold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Side-effect Prevention</span>
                    </div>
                    <div className="space-y-1.5">
                      {supportiveMedicines.map((med, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-teal-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                          <span><strong>{med.effect}</strong> → <span className="text-teal-600">{med.support}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Prescription Section ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Pill className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Prescription</h2>
                  <p className="text-xs text-gray-400">{prescribedMedicines.length} medicine{prescribedMedicines.length !== 1 ? 's' : ''} added</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddMedicine}
                disabled={addMedDisabled}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: addMedDisabled ? '#6b7280' : 'linear-gradient(135deg, #0d9488, #059669)' }}
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>

            <div className="p-5 space-y-4">
              {prescribedMedicines.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Pill className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="font-semibold text-sm">No medicines added yet</p>
                  <p className="text-xs mt-1">Click "Add Medicine" or use AI recommendations</p>
                </div>
              )}

              {prescribedMedicines.map((med, index) => (
                <div
                  key={med.id}
                  className={`rounded-2xl border-2 p-5 transition-all ${
                    incompleteRows.includes(med.id)
                      ? 'border-red-300 bg-red-50 shadow-sm shadow-red-100'
                      : 'border-gray-100 bg-gray-50/60 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 bg-teal-600 text-white text-xs font-bold rounded-lg flex items-center justify-center">{index + 1}</span>
                      <span className="text-sm font-bold text-gray-700">
                        {med.name || 'New Medicine'}
                        {med.medicine_id && <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">✓ Selected</span>}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(med.id)}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                    {/* Search */}
                    <div className="sm:col-span-2 lg:col-span-3 relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search medicine by name…"
                          value={med.name || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, name: value, medicine_id: "" } : x));
                            if (value.length < 2) {
                              setSearchResults(prev => { const copy = { ...prev }; delete copy[med.id]; return copy; });
                              return;
                            }
                            searchMedicine(value, med.id);
                          }}
                          className="w-full pl-9 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                          required
                        />
                      </div>

                      {/* Dropdown */}
                      {med.name.length >= 2 && searchResults[med.id] && (
                        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                          {searchResults[med.id].available ? (
                            <>
                              <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Available in Hospital Pharmacy</p>
                              </div>
                              {Array.isArray(searchResults[med.id]?.medicines) && searchResults[med.id].medicines.map(m => (
                                <button key={m.medicine_id} type="button"
                                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-gray-50 last:border-0"
                                  onClick={() => {
                                    setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, medicine_id: m.medicine_id, name: m.name, availability_status: "available" } : x));
                                    setSearchResults(prev => { const copy = { ...prev }; delete copy[med.id]; return copy; });
                                  }}>
                                  <Pill className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />{m.name}
                                </button>
                              ))}
                            </>
                          ) : (
                            <>
                              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                                <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Not available — Showing Alternatives</p>
                              </div>
                              {Array.isArray(searchResults[med.id]?.alternatives) && searchResults[med.id].alternatives.map(a => (
                                <button key={a.medicine_id} type="button"
                                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-gray-50 last:border-0"
                                  onClick={() => {
                                    setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, medicine_id: a.medicine_id, name: a.name, availability_status: "substituted" } : x));
                                    setSearchResults(prev => { const copy = { ...prev }; delete copy[med.id]; return copy; });
                                  }}>
                                  <Pill className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />{a.name}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dosage */}
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={med.dosage}
                      onChange={(e) => setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, dosage: e.target.value } : x))}
                      className="px-3.5 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      required
                    />

                    {/* Frequency */}
                    <select
                      value={med.frequency}
                      onChange={(e) => setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, frequency: e.target.value } : x))}
                      className="appearance-none px-3.5 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Frequency</option>
                      <option value="1-0-0">Morning (1-0-0)</option>
                      <option value="0-1-0">Afternoon (0-1-0)</option>
                      <option value="0-0-1">Night (0-0-1)</option>
                      <option value="1-0-1">Morning & Night (1-0-1)</option>
                      <option value="0-1-1">Afternoon & Night (0-1-1)</option>
                      <option value="1-1-1">3 Times Daily (1-1-1)</option>
                    </select>

                    {/* Duration */}
                    <select
                      value={med.duration}
                      onChange={(e) => setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, duration: e.target.value } : x))}
                      className="appearance-none px-3.5 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Duration</option>
                      <option value="3 days">3 days</option>
                      <option value="5 days">5 days</option>
                      <option value="7 days">7 days</option>
                      <option value="10 days">10 days</option>
                      <option value="14 days">14 days</option>
                      <option value="30 days">30 days</option>
                    </select>

                    {/* Quantity */}
                    <select
                      value={med.quantity}
                      onChange={(e) => setPrescribedMedicines(prescribedMedicines.map(x => x.id === med.id ? { ...x, quantity: Number(e.target.value) } : x))}
                      className="appearance-none px-3.5 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Qty</option>
                      {[...Array(30)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
                    </select>

                    {/* Meal Toggle */}
                    <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Timing:</span>
                      <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white p-0.5 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setPrescribedMedicines(prev => prev.map(x => x.id === med.id ? { ...x, before_meal: "before" } : x))}
                          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${med.before_meal === "before" ? "bg-teal-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                        >Before Food</button>
                        <button
                          type="button"
                          onClick={() => setPrescribedMedicines(prev => prev.map(x => x.id === med.id ? { ...x, before_meal: "after" } : x))}
                          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${med.before_meal === "after" ? "bg-teal-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                        >After Food</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (!savedPrescriptionId) { showAlert("No saved prescription to delete."); return; }
                try {
                  const res = await fetch(`http://localhost:5000/api/prescriptions/${savedPrescriptionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                  if (!res.ok) throw new Error("Failed to delete prescription");
                  setShowDeleteSuccess(true);
                  setTimeout(() => setShowDeleteSuccess(false), 3000);
                  setSavedPrescriptionId(null);
                  setShowPreview(false);
                  setPrescribedMedicines([]);
                } catch (error) { console.error("Delete prescription error:", error); showAlert("Failed to delete prescription"); }
              }}
              className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel & Delete
            </button>

            <button
              type="submit"
              disabled={saving || prescribedMedicines.length === 0}
              className="w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving Prescription…</span></>
              ) : (
                <><Save className="w-4 h-4" /><span>Save Prescription</span></>
              )}
            </button>
          </div>
        </form>
        
       {/* ── REVISIT SCHEDULING SECTION ── */}
       <div className={`rounded-xl shadow-md border-2 p-6 transition-all duration-300 ${
         revisitEnabled ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
       }`}>
       
         {/* Header row with toggle */}
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className={`p-3 rounded-full ${revisitEnabled ? "bg-blue-100" : "bg-gray-100"}`}>
               <Calendar className={`w-5 h-5 ${revisitEnabled ? "text-blue-600" : "text-gray-400"}`} />
             </div>
             <div>
               <h2 className={`font-bold text-lg ${revisitEnabled ? "text-blue-700" : "text-gray-700"}`}>
                 Schedule Follow-up Revisit
               </h2>
               <p className="text-sm text-gray-500">
                 {revisitEnabled
                   ? "Patient will be notified on their dashboard"
                   : "Toggle to schedule a follow-up appointment"}
               </p>
             </div>
           </div>
       
           {/* Toggle switch */}
           <button
             type="button"
             onClick={() => { setRevisitEnabled(!revisitEnabled); setRevisitError(""); }}
             className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
               revisitEnabled ? "bg-blue-600" : "bg-gray-300"
             }`}
           >
             <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
               revisitEnabled ? "translate-x-8" : "translate-x-1"
             }`} />
           </button>
         </div>
       
         {/* Expanded content when enabled */}
         {revisitEnabled && (
           <div className="mt-6 space-y-5">
       
             {/* Days + Date row */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">
                   <Clock className="w-4 h-4 inline mr-1 text-blue-500" />
                   Revisit After
                 </label>
                 <select
                   value={revisitDays}
                   onChange={(e) => setRevisitDays(e.target.value)}
                   className="appearance-none w-full border-2 border-blue-200 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-400 text-sm font-medium"
                 >
                   <option value={3}>3 days</option>
                   <option value={5}>5 days</option>
                   <option value={7}>7 days</option>
                   <option value={10}>10 days</option>
                   <option value={14}>14 days</option>
                   <option value={21}>21 days</option>
                   <option value={30}>30 days</option>
                 </select>
               </div>
       
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">
                   <Calendar className="w-4 h-4 inline mr-1 text-blue-500" />
                   Suggested Date
                   <span className="ml-2 text-xs text-blue-500 font-normal">(auto-calculated, editable)</span>
                 </label>
                 <DatePicker
         selected={revisitDate ? new Date(revisitDate) : null}
         onChange={(date) =>
           setRevisitDate(date.toISOString().split("T")[0])
         }
         minDate={new Date()}
         filterDate={(date) => {
           const day = date.getDay();
       
           // ❌ Disable Sundays
           if (day === 0) return false;
           const formatted = date.toISOString().split("T")[0];
           return !holidays.includes(formatted);
         }}
         placeholderText="Select revisit date"
         className="w-full border-2 border-blue-200 bg-white p-2.5 rounded-lg"
       />
               </div>
             </div>
       
             {/* Reason input */}
             <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">
                 Reason for Revisit <span className="text-red-500">*</span>
               </label>
               <input
                 type="text"
                 value={revisitReason}
                 onChange={(e) => { setRevisitReason(e.target.value); setRevisitError(""); }}
                 placeholder="e.g. Review medication response, Check blood reports..."
                 className={`w-full border-2 p-2.5 rounded-lg focus:ring-2 text-sm ${
                   revisitError
                     ? "border-red-400 focus:ring-red-300 bg-red-50"
                     : "border-blue-200 focus:ring-blue-400 bg-white"
                 }`}
               />
               {revisitError && (
                 <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> {revisitError}
                 </p>
               )}
             </div>
       
             {/* Quick reason chips */}
             <div>
               <p className="text-xs text-gray-500 mb-2">Quick select:</p>
               <div className="flex flex-wrap gap-2">
                 {[
                   "Review medication response",
                   "Check blood reports",
                   "Post-treatment follow-up",
                   "Monitor blood pressure",
                   "Wound dressing change",
                   "Lab results review",
                 ].map((chip) => (
                   <button
                     key={chip}
                     type="button"
                     onClick={() => { setRevisitReason(chip); setRevisitError(""); }}
                     className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                       revisitReason === chip
                         ? "bg-blue-600 text-white border-blue-600"
                         : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                     }`}
                   >
                     {chip}
                   </button>
                 ))}
               </div>
             </div>
       
             {/* Summary preview card */}
             {revisitDate && revisitReason && (
               <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                 <div className="flex items-start gap-3">
                   <div className="bg-blue-600 p-2 rounded-full mt-0.5">
                     <CheckCircle className="w-4 h-4 text-white" />
                   </div>
                   <div>
                     <p className="font-bold text-blue-800 text-sm mb-1">Revisit Summary</p>
                     <div className="space-y-1 text-sm text-gray-700">
                       <p><span className="font-semibold">Patient:</span> {patient.name}</p>
                       <p>
                         <span className="font-semibold">Date:</span>{" "}
                         <span className="text-blue-700 font-bold">{new Date(revisitDate).toDateString()}</span>
                         <span className="ml-2 text-xs text-gray-400">({revisitDays} days from today)</span>
                       </p>
                       <p><span className="font-semibold">Reason:</span> {revisitReason}</p>
                       <p><span className="font-semibold">Doctor:</span> {doctor.name}</p>
                     </div>
                     <p className="mt-2 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded inline-block">
                        Patient will see this on their dashboard and can confirm or reschedule
                     </p>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
       <div className="flex justify-end mt-4">
         <button
           type="button"
           onClick={handleSaveRevisit}
           disabled={!revisitEnabled}
           className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
         >
           Save Revisit
         </button>
       </div>
       {/* ── END REVISIT SECTION ── */}
       

        {/* ── Prescription Preview ── */}
        {showPreview && (
          <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Prescription Preview</h2>
                  <p className="text-xs text-gray-400">Ready to print or share</p>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Prescription
                </button>
              </div>
            </div>
            <div id="prescription-print" className="bg-white">
              <PrescriptionPreview data={prescriptionData} />
            </div>
          </div>
        )}

      </main>

      <div className="h-10" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes slideIn {
          from { transform: translateX(110%) scale(0.95); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }

        @media print {
          .no-print { display: none !important; }
          header { display: none !important; }
          body { background: white !important; }
        }

        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; padding-right: 36px !important; }
      `}</style>
    </div>
  );
}
