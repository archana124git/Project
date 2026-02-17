import { useState,useEffect } from 'react';
import { ArrowLeft, Save, Pill, Plus, Trash2, User, FileText, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrescriptionPreview from "../components/PrescriptionPreview";


export default function ConsultationCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  // get passed items from listening page
  const { convo_id, convo_number, transcript, summary, doctor, patient } = location.state || {};

  if (!doctor || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Missing doctor or patient data.
      </div>
    );
  }

  const [editableSummary, setEditableSummary] = useState(summary || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  //pop up message
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const [formData, setFormData] = useState({
    diagnosis: "",
    additionalNotes: ""
  });
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);

  const searchMedicine = async (query, rowId) => {
    const currentMed = prescribedMedicines.find(m => m.id === rowId);
    if (!query || query.length < 2 || currentMed?.medicine_id) return;
    setSearchLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/diagnosis/search?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.ok) {
        throw new Error("Search API failed");
      }
      const data = await res.json();
      setSearchResults(prev => ({
        ...prev,
        [rowId]: data
      }));
    } catch (err) {
      console.error("MEDICINE SEARCH ERROR:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const [prescribedMedicines, setPrescribedMedicines] = useState([
    {
      id: Date.now(), medicine_id: "", name: "", dosage: "", frequency: "", duration: "", quantity: 1,
      availability_status: "unknown",
      instructions: ""
    }
  ]);

  const handleAddMedicine = () => {
    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        id: Date.now(),
        medicine_id: "",
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: 1,
        instructions: ""
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

    try {
      const summaryRes = await fetch(
        "http://localhost:5000/clinical-summaries",
        {
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
        }
      );

      if (!summaryRes.ok) throw new Error("Failed to save clinical summary");

      const summaryData = await summaryRes.json();
      const summary_id = summaryData.summary_id;

      const diagnosisRes = await fetch(
        "http://localhost:5000/diagnosis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            summary_id,
            diagnosis: formData.diagnosis,
          }),
        }
      );

      if (!diagnosisRes.ok) throw new Error("Failed to save diagnosis");

      const prescriptionRes = await fetch("http://localhost:5000/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: doctor.user_id,
          patient_id: patient.patient_id,
          medicines: prescribedMedicines
        })
      });

      if (!prescriptionRes.ok) throw new Error("Failed to save prescription");

      console.log("Submitting payload:", {
        diagnosis: formData.diagnosis,
        summary: editableSummary,
        medicines: prescribedMedicines,
        patient_id: patient.patient_id,
        doctor_id: doctor.user_id,
        conversation_number: convo_number
      });

      setSaving(false);
      setShowSuccess(true);
      setShowPreview(true);
      console.log("SETTING PREVIEW TRUE");

    } catch (error) {
      console.error("CONSULTATION SAVE ERROR:", error);
      setSaving(false);
      alert("Failed to save consultation data");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/90 hover:text-white bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-2xl font-bold text-white">Complete Consultation</h1>

          <div className="w-24" /> {/* spacer to center title */}
        </div>
      </header>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">Prescription saved successfully!</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Doctor & Patient Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Doctor Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
            <h2 className="font-bold text-teal-700 flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-teal-600" />
              </div>
              Doctor Information
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500 font-medium">ID:</span> <span className="text-gray-800">{doctor.user_id}</span></p>
              <p><span className="text-gray-500 font-medium">Name:</span> <span className="text-gray-800 font-semibold">{doctor.name}</span></p>
              <p><span className="text-gray-500 font-medium">Specialization:</span> <span className="text-gray-800">{doctor.specialization}</span></p>
              <p><span className="text-gray-500 font-medium">License:</span> <span className="text-teal-600 font-medium">{doctor.license_number}</span></p>
            </div>
          </div>

          {/* Patient Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
            <h2 className="font-bold text-teal-700 flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-teal-600" />
              </div>
              Patient Information
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500 font-medium">ID:</span> <span className="text-gray-800">{patient.patient_id}</span></p>
              <p><span className="text-gray-500 font-medium">Name:</span> <span className="text-gray-800 font-semibold">{patient.name}</span></p>
              <p><span className="text-gray-500 font-medium">Consultation #:</span> <span className="text-gray-800">{convo_number}</span></p>
              <p><span className="text-gray-500 font-medium">Blood Group:</span> <span className="text-gray-800">{patient.blood_group}</span></p>
              <p><span className="text-gray-500 font-medium">Allergies:</span> <span className="text-gray-800">{patient.allergies?.join(", ") || "None"}</span></p>
            </div>
          </div>
        </div>

        {/* ── Summary / CRT ── */}
        {editableSummary && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
            <h2 className="font-bold text-teal-700 flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-teal-600" />
              </div>
              Summarisation (CRT)
            </h2>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200 text-gray-800 text-sm leading-relaxed resize-none"
              rows={10}
              value={editableSummary}
              onChange={(e) => setEditableSummary(e.target.value)}
            />
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>

          {/* Diagnosis */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
            <h2 className="font-bold text-teal-700 flex items-center gap-2 mb-4">
              <span className="w-2 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full inline-block"></span>
              Diagnosis
            </h2>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200 text-gray-800 text-sm"
              required
              rows={4}
              placeholder="Enter diagnosis..."
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

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
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            {prescribedMedicines.map((med, index) => (
              <div key={med.id} className="border border-gray-200 bg-gray-50 rounded-lg p-5 mb-4 last:mb-0">

                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-teal-700 text-sm">Medicine {index + 1}</span>
                  {prescribedMedicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(med.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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

          {/* ── Action Buttons ── */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-lg font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              {saving ? "Saving..." : "Save Prescription"}
            </button>
          </div>

        </form>

        {/* ── Prescription Preview ── */}
        {showPreview && (
          <div className="mt-10">

            {/* Print area */}
            <div id="prescription-print">
              <PrescriptionPreview data={prescriptionData} />
            </div>

            {/* Buttons - no-print */}
            <div className="flex justify-end mt-4 gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Print Prescription
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}