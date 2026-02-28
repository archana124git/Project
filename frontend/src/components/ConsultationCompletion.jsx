import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Pill, Plus, Trash2, User, FileText, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrescriptionPreview from "../components/PrescriptionPreview";
import { extractFieldsFromSummary } from "../../utils/extractFieldsFromSummary";

export default function ConsultationCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  
  const { convo_id, convo_number, transcript, summary, doctor, patient } = location.state || {};

  if (!doctor || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 font-semibold">Missing doctor or patient data.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
  const [formData, setFormData] = useState({
    diagnosis: "",
    severity: "Moderate",
    additionalNotes: ""
  });
  // State for delete success popup
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  // State for error and highlighting
  const [showMedicineError, setShowMedicineError] = useState(false);
  const [incompleteRows, setIncompleteRows] = useState([]);

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
  if (!showSuccess) return;
  const timer = setTimeout(() => setShowSuccess(false), 3000);
  return () => clearTimeout(timer);
}, [showSuccess]);
  
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);


  

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const weight = Number(patient.weight);
      const safeWeight = isNaN(weight) || weight <= 0 ? 65 : weight;

      // 🔥 FIXED GENDER FORMAT
      const formattedGender = patient.gender
        ? patient.gender.trim().toLowerCase()
        : "";

      const res = await fetch("http://localhost:5001/recommendations/medicine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          age: Number(patient.age),
          weight: safeWeight,
          gender: formattedGender,
          diagnosis: formData.diagnosis?.trim().toLowerCase() || "",
          severity: formData.severity?.trim().toLowerCase() || "",
          patient_id: patient.patient_id
        })
      });

      if (!res.ok) {
        const errorText = await res.text(); // 🔎 helpful for debugging
        console.error("Backend error:", errorText);
        throw new Error("Failed to fetch recommendations");
      }

      const data = await res.json();
      setRecommendations(data.recommendations || []);

    } catch (err) {
      console.error("Recommendation fetch error:", err);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const deletePrescription = async (prescriptionId) => {
      try {
        const res = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to delete prescription");
      } catch (error) {
        console.error("Delete prescription error:", error);
      }
    };





  const searchMedicine = async (query, rowId) => {
    const currentMed = prescribedMedicines.find(m => m.id === rowId);
    if (!query || query.length < 2 || currentMed?.medicine_id) return;
    setSearchLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/diagnosis/search?query=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Search API failed");
      const data = await res.json();
      setSearchResults(prev => ({ ...prev, [rowId]: data }));
    } catch (err) {
      console.error("MEDICINE SEARCH ERROR:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMedicine = () => {
    // Prevent adding if last row is incomplete
    if (prescribedMedicines.length > 0) {
      const last = prescribedMedicines[prescribedMedicines.length - 1];
      if (!last.medicine_id || !last.name || last.name.trim() === "") {
        alert("Please select a valid medicine in the last row before adding another.");
        return;
      }
    }
    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        id: Date.now(),
        medicine_id: "",
        name: "",
        dosage: "1 tablet",
        frequency: "1-0-1",
        duration: "3 days",
        quantity: 1,
      }
    ]);
  };

  const handleRemove = (id) => {
    setPrescribedMedicines(prescribedMedicines.filter(m => m.id !== id));
  };

  const prescriptionData = {
    date: new Date().toLocaleDateString(),
    doctor: {
      name: doctor.name,
      specialization: doctor.specialization,
      license: doctor.license_number
    },
    patient: {
      id: patient.patient_id,
      name: patient.name,
      age: patient.age
    },
    medicines: prescribedMedicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity
    }))
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  console.log("FULL prescribedMedicines:", prescribedMedicines);

  const cleanedMedicines = prescribedMedicines.filter(
    m => m.medicine_id && m.name && m.name.trim() !== "" &&

    m.name.trim() !== "" &&
    m.dosage &&
    m.frequency &&
    m.duration &&
    m.quantity
  );

  if (cleanedMedicines.length === 0) {
    setShowMedicineError(true);
    setTimeout(() => setShowMedicineError(false), 3000);
    setSaving(false);

    setIncompleteRows(
      prescribedMedicines
        .filter(m => !m.medicine_id || !m.name || m.name.trim() === "")
        .map(m => m.id)
    );
    return;
  }

  setIncompleteRows([]);

  try {
    // 1️⃣ Save clinical summary
    const summaryRes = await fetch("http://localhost:5000/clinical-summaries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        convo_id,
        subjective: editableSummary,
        objective: editableSummary,
        assessment: editableSummary,
        plan: editableSummary,
      }),
    });

    if (!summaryRes.ok) throw new Error("Failed to save clinical summary");
    const summaryData = await summaryRes.json();
    const summary_id = summaryData.summary_id;

    // 2️⃣ Save diagnosis
    const diagnosisRes = await fetch("http://localhost:5000/diagnosis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        summary_id,
        diagnosis: formData.diagnosis,
      }),
    });

    if (!diagnosisRes.ok) throw new Error("Failed to save diagnosis");

    // 3️⃣ Save prescription
    const prescriptionRes = await fetch("http://localhost:5000/api/prescriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        doctor_id: doctor.user_id,
        patient_id: patient.patient_id,
        medicines: cleanedMedicines.map(m => ({
          medicine_id: m.medicine_id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: m.quantity
        }))
      }),
    });

    if (!prescriptionRes.ok) {
      const errorData = await prescriptionRes.json().catch(() => ({}));
      console.error("Prescription API error:", errorData);
      throw new Error("Failed to save prescription");
    }

    const prescriptionData = await prescriptionRes.json();
    setSavedPrescriptionId(prescriptionData.prescription_id);

    setShowSuccess(true);
    setShowPreview(true);

  } catch (error) {
    console.error("CONSULTATION SAVE ERROR:", error);
    alert("Failed to save consultation data");
  } finally {
    setSaving(false);
  }
};
  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Complete Consultation</h1>
            <div className="w-40"></div>
         </div>
       </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 animate-slide-in z-50">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">Prescription saved successfully!</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Doctor & Patient Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Doctor Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Doctor Information</h2>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">ID:</span> {doctor.user_id}</p>
              <p><span className="font-semibold">Name:</span> {doctor.name}</p>
              <p><span className="font-semibold">Specialization:</span> {doctor.specialization}</p>
              <p><span className="font-semibold">License:</span> {doctor.license_number}</p>
            </div>
          </div>

          {/* Patient Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Patient Information</h2>
            </div>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">ID:</span> {patient.patient_id}</p>
              <p><span className="font-semibold">Name:</span> {patient.name}</p>
              <p><span className="font-semibold">Consultation #:</span> {convo_number}</p>
              <p><span className="font-semibold">Blood Group:</span> {patient.blood_group}</p>
              <p><span className="font-semibold">Allergies:</span> {patient.allergies?.join(", ") || "None"}</p>
            </div>
            </div>
         </div>

        {/* Clinical Summary */}
        {editableSummary && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Clinical Summary (CRT)</h2>
            </div>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={10}
              value={editableSummary}
              onChange={(e) => setEditableSummary(e.target.value)}
              placeholder="Enter clinical summary..."
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Diagnosis Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Diagnosis & Severity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <textarea
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  rows={1}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Enter diagnosis..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>
            {/* Get Recommendations Button */}
            {formData.diagnosis && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={fetchRecommendations}
                  disabled={loadingRecommendations}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {loadingRecommendations ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Get AI Recommendations</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* AI Medicine Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-md border-2 border-purple-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-600 p-3 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">AI-Powered Medicine Recommendations</h2>
                  <p className="text-sm text-gray-600">Based on patient profile and diagnosis</p>
                </div>
              </div>

              {/* Patient Features Summary */}
              <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                <h3 className="font-semibold text-gray-700 mb-2">ML Model Analysis Factors:</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Age</p>
                    <p className="font-bold text-purple-700">{patient.age || 'N/A'}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Weight</p>
                    <p className="font-bold text-purple-700">{patient.weight || 'N/A'} kg</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Gender</p>
                    <p className="font-bold text-purple-700">{patient.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Severity</p>
                    <p className="font-bold text-purple-700">{formData.severity}</p>

                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Diagnosis</p>
                    <p className="font-bold text-purple-700 text-xs">{formData.diagnosis.substring(0, 20) || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Recommended Medicines */}
              <div className="space-y-3">
                {recommendations.map((rec, index) => {
                  console.log("Recommendation object:", rec);
                 const isAdded = prescribedMedicines.some(
                          med => med.name === rec.medicine_name
                        );
                  
                  return (
                    <div key={index} className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                              {index + 1}
                            </span>
                            <h3 className="font-bold text-lg text-gray-800">{rec.medicine_name}</h3>
                            
                            
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">

                            <div>
                              <span className="text-gray-600">Frequency:</span>
                              <span className="ml-1 font-semibold">{rec.frequency || '1-0-1'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <span className="ml-1 font-semibold">{rec.duration || '7 days'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <span className="ml-1 font-semibold">{rec.quantity || '5'}</span>
                            </div>
                          </div>

                          {rec.reason && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              💡 {rec.reason}
                            </p>
                          )}
                        </div>

                        
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `http://localhost:5000/diagnosis/search?query=${rec.medicine_name}`,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );

                                if (!res.ok) throw new Error("Search failed");
                                
                                
                                const data = await res.json();
                                console.log("SEARCH RESPONSE:", data);

                                let matchedMedicine = null;

                                if (data.available && Array.isArray(data.medicines)) {
                                  matchedMedicine =
                                    data.medicines.find(
                                      m => m.name.toLowerCase() === rec.medicine_name.toLowerCase()
                                    ) || data.medicines[0];
                                } else if (Array.isArray(data.alternatives)) {
                                  matchedMedicine = data.alternatives[0];
                                }

                                if (!matchedMedicine) {
                                  alert("Medicine not found in hospital pharmacy.");
                                  return;
                                }

                                const newMed = {
                                  id: Date.now() + index,
                                  medicine_id: matchedMedicine.medicine_id,
                                  name: matchedMedicine.name,
                                  dosage: "1 tablet",
                                  frequency: "1-0-1",
                                  duration: "5 days",
                                  quantity: 1,
                                };

                                setPrescribedMedicines(prev => [...prev, newMed]);

                              } catch (err) {
                                console.error("Failed to fetch medicine ID:", err);
                              }
                            }}
                            className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium ${
                              isAdded
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "bg-purple-600 hover:bg-purple-700 text-white"
                            }`}
                          >
                            {isAdded ? "Add" : "Add"}
                          </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> These are AI-generated recommendations based on age, weight, gender, severity, and disease.
                </p>
              </div>
            </div>
          )}

          {/* ── Medicines ── */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-teal-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Pill className="w-4 h-4 text-teal-600" />
                </div>
                Prescription
              </h2>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm"
                disabled={prescribedMedicines.length > 0 && (!prescribedMedicines[prescribedMedicines.length - 1].medicine_id || !prescribedMedicines[prescribedMedicines.length - 1].name || prescribedMedicines[prescribedMedicines.length - 1].name.trim() === "")}
                style={prescribedMedicines.length > 0 && (!prescribedMedicines[prescribedMedicines.length - 1].medicine_id || !prescribedMedicines[prescribedMedicines.length - 1].name || prescribedMedicines[prescribedMedicines.length - 1].name.trim() === "") ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            {prescribedMedicines.map((med, index) => (
              <div key={med.id} className={`border rounded-lg p-5 mb-4 last:mb-0 ${incompleteRows.includes(med.id) ? 'border-red-400 bg-red-50 animate-pulse' : 'border-gray-200 bg-gray-50'}`}> 
        {/* Error message for no valid medicine */}
        {showMedicineError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-semibold animate-pulse">
            Please select at least one valid medicine before saving the prescription.
          </div>
        )}

                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-teal-700 text-sm">Medicine {index + 1}</span>
                  
                    <button
                      type="button"
                      onClick={() => handleRemove(med.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* Medicine Search */}
                  <input
                    type="text"
                    placeholder="Search medicine..."
                    value={med.name || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, name: value, medicine_id: "" } : x
                        )
                      );
                      if (value.length < 2) {
                        setSearchResults(prev => {
                          const copy = { ...prev };
                          delete copy[med.id];
                          return copy;
                        });
                        return;
                      }
                      searchMedicine(value, med.id);
                    }}
                    className="border border-gray-200 p-2.5 rounded-lg bg-white focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    required
                  />

                  {/* Search Dropdown */}
                  {med.name.length >= 2 && searchResults[med.id] && (
                    <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-md text-sm max-h-40 overflow-y-auto col-span-2">
                      {searchResults[med.id].available ? (
                        <>
                          <p className="text-emerald-600 font-semibold px-3 py-2 border-b border-gray-100">
                            ✓ Available in hospital
                          </p>
                          {Array.isArray(searchResults[med.id]?.medicines) &&
                            searchResults[med.id].medicines.map(m => (
                              <button
                                key={m.medicine_id}
                                type="button"
                                className="block w-full text-left px-3 py-2 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                                onClick={() => {
                                  setPrescribedMedicines(
                                    prescribedMedicines.map(x =>
                                      x.id === med.id
                                        ? { ...x, medicine_id: m.medicine_id, name: m.name, availability_status: "available" }
                                        : x
                                    )
                                  );
                                  setSearchResults(prev => {
                                    const copy = { ...prev };
                                    delete copy[med.id];
                                    return copy;
                                  });
                                }}
                              >
                                {m.name}
                              </button>
                            ))}
                        </>
                      ) : (
                        <>
                          <p className="text-red-500 font-semibold px-3 py-2 border-b border-gray-100">
                            ✗ Not available. Alternatives:
                          </p>
                          {Array.isArray(searchResults[med.id]?.alternatives) &&
                            searchResults[med.id].alternatives.map(a => (
                              <button
                                key={a.medicine_id}
                                type="button"
                                className="block w-full text-left px-3 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                onClick={() => {
                                  setPrescribedMedicines(
                                    prescribedMedicines.map(x =>
                                      x.id === med.id
                                        ? { ...x, medicine_id: a.medicine_id, name: a.name, availability_status: "substituted" }
                                        : x
                                    )
                                  );
                                  setSearchResults(prev => {
                                    const copy = { ...prev };
                                    delete copy[med.id];
                                    return copy;
                                  });
                                }}
                              >
                                {a.name}
                              </button>
                            ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Dosage */}
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={med.dosage}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, dosage: e.target.value } : x
                        )
                      )
                    }
                    className="border border-gray-200 p-2.5 rounded-lg bg-white focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    required
                  />

                  {/* Frequency */}
                  <select
                    value={med.frequency}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, frequency: e.target.value } : x
                        )
                      )
                    }
                    className="border border-gray-200 p-2.5 rounded-lg bg-white focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    required
                  >
                    <option value="">Select Frequency</option>
                    <option value="1-0-0">Morning (1-0-0)</option>
                    <option value="0-1-0">Afternoon (0-1-0)</option>
                    <option value="0-0-1">Night (0-0-1)</option>
                    <option value="1-0-1">Morning & Night (1-0-1)</option>
                    <option value="0-1-1">Afternoon & Night (0-1-1)</option>
                    <option value="1-1-1">Morning, Afternoon & Night (1-1-1)</option>
                  </select>

                  {/* Duration */}
                  <select
                    value={med.duration}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, duration: e.target.value } : x
                        )
                      )
                    }
                    className="border border-gray-200 p-2.5 rounded-lg bg-white focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    required
                  >
                    <option value="">Select Duration</option>
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
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, quantity: Number(e.target.value) } : x
                        )
                      )
                    }
                    className="border border-gray-200 p-2.5 rounded-lg bg-white focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    required
                  >
                    <option value="">Qty</option>
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>



          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button 
              type="button" 
              onClick={async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/diagnosis/search?query=${encodeURIComponent(rec.medicine_name)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) throw new Error("Search failed");

    const data = await res.json();

    if (data.available && data.medicines.length > 0) {
      const found = data.medicines[0];

      const newMed = {
        id: Date.now(),
        medicine_id: found.medicine_id,   // ✅ REAL ID FROM DB
        name: found.name,
        dosage: rec.dosage || "1 tablet",
        frequency: rec.frequency || "1-0-1",
        duration: rec.duration || "5 days",
        quantity: rec.quantity || 1,
      };

      setPrescribedMedicines(prev => [...prev, newMed]);

    } else {
      alert("Medicine not found in hospital database.");
    }

  } catch (err) {
    console.error("Failed to fetch medicine ID:", err);
  }
}}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>

      {/* Delete success popup */}
      {showDeleteSuccess && (
        <div className="fixed top-24 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 animate-slide-in z-50">
          <Trash2 className="w-6 h-6" />
          <span className="font-medium">Prescription deleted successfully.</span>
        </div>
      )}

            <button 
              type="submit"
              disabled={saving || prescribedMedicines.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Prescription</span>
                </>
              )}
            </button>
          </div>
          
        </form>
        

        {/* Prescription Preview */}
        {showPreview && (
         <div className="mt-10">

          {/* PRINT AREA */}
          <div id="prescription-print">
            <PrescriptionPreview data={prescriptionData} />
          </div>

          {/* Buttons - should NOT print */}
          <div className="flex justify-end mt-4 space-x-3 no-print">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-green-600 text-white rounded"
            >
 
                Print Prescription
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

      
  </main>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
  </div>
   );   
  } 

