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

  const [recommendations, setRecommendations] = useState([]);
  const [editableSummary, setEditableSummary] = useState(summary || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: "",
    severity: "Moderate",
    additionalNotes: ""
  });

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
    const res = await fetch(`http://localhost:5001/recommendations/medicine?` +
      `&age=${patient.age}` +
      `&gender=${patient.gender}` +
      `&diagnosis=${encodeURIComponent(formData.diagnosis)}` +
      `&severity=${formData.severity}` +
      `&patient_id=${patient.patient_id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) throw new Error("Failed to fetch recommendations");

    const data = await res.json();
    setRecommendations(data.recommendations || []);
  } catch (err) {
    console.error("Recommendation fetch error:", err);
    setRecommendations([]);
  } finally {
    setLoadingRecommendations(false);
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
      id: Date.now(),medicine_id: "",name: "",dosage: "",frequency: "",duration: "",quantity: 1,
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

      if (!summaryRes.ok) {
        throw new Error("Failed to save clinical summary");
      }

      const summaryData = await summaryRes.json();
      const summary_id = summaryData.summary_id;



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
      if (!prescriptionRes.ok) {
        throw new Error("Failed to save prescription");
      }

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

      /*setTimeout(() => {
        navigate("/dashboard");
      }, 2000);*/

    } catch (error) {
      console.error("CONSULTATION SAVE ERROR:", error);
      setSaving(false);
      alert("Failed to save consultation data");
    }
  };

  return (
    <div className="min-h-screen bg-white">

      <header className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <h1 className="text-2xl font-bold text-blue-900">Complete Consultation</h1>
        </div>
      </header>

      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">Prescription saved successfully!</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Doctor & Patient */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          <div className="bg-white p-6 border rounded shadow">
            <h2 className="font-bold flex items-center space-x-2 mb-2">
              <User className="w-5 h-5" /> Doctor
            </h2>
            <p>ID: {doctor.user_id}</p>
            <p>Name: {doctor.name}</p>
            <p>Specialization: {doctor.specialization}</p>
            <p>License: {doctor.license_number}</p>
          </div>

          <div className="bg-white p-6 border rounded shadow">
            <h2 className="font-bold flex items-center space-x-2 mb-2">
              <User className="w-5 h-5" /> Patient
            </h2>
            <p>ID: {patient.patient_id}</p>
            <p>Name: {patient.name}</p>
            <p>Consultation #: {convo_number}</p>
            <p>Blood Group: {patient.blood_group}</p>
            <p>Allergies: {patient.allergies?.join(", ") || "None"}</p>
          </div>
        </div>

        {/* Transcript */}
        {editableSummary && (
        <div className="bg-green-50 p-6 border rounded mb-6">
          <h2 className="font-bold flex items-center space-x-2 mb-2">
            <FileText className="w-5 h-5" />  Summarisation (CRT)
          </h2>

          <textarea
            className="w-full p-3 border rounded"
            rows={10}
            value={editableSummary}
            onChange={(e) => setEditableSummary(e.target.value)}
          />
        </div>
      )}


        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-6 border rounded mb-6">

            <h2 className="font-bold flex items-center space-x-2 mb-2">
              Diagnosis
            </h2>

            <textarea
              className="w-full p-2 border rounded"
              required
              rows={4}
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

          {/* Medicines */}
          <div className="bg-white p-6 border rounded mb-6">

            <div className="flex justify-between mb-4">
              <h2 className="font-bold flex items-center space-x-2">
                <Pill className="w-5 h-5" /> Prescription
              </h2>
              <button type="button" onClick={handleAddMedicine}
                className="px-3 py-1 bg-blue-600 text-white rounded">
                Add Medicine
              </button>
            </div>

            {prescribedMedicines.map((med, index) => (
              <div key={med.id} className="border p-4 bg-gray-50 rounded mb-3">

                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Medicine {index + 1}</span>

                  {prescribedMedicines.length > 1 && (
                    <button type="button" onClick={() => handleRemove(med.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  <input
                    type="text"
                    placeholder="Search medicine"
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
                    className="border p-2 rounded"
                    required
                  />

                  {med.name.length >= 2 && searchResults[med.id] && (
                    <div className="mt-2 border rounded p-2 bg-white text-sm max-h-40 overflow-y-auto">

                      {searchResults[med.id].available ? (
                        <>
                          <p className="text-green-600 font-semibold">
                            Available in hospital
                          </p>

                          {Array.isArray(searchResults[med.id]?.medicines) &&
                            searchResults[med.id].medicines.map(m => (
                            <button
                              key={m.medicine_id}
                              type="button"
                              className="block w-full text-left px-2 py-1 hover:bg-blue-50"
                              onClick={() => {
                                setPrescribedMedicines(
                                  prescribedMedicines.map(x =>
                                    x.id === med.id
                                      ? {
                                          ...x,
                                          medicine_id: m.medicine_id,
                                          name: m.name,
                                          availability_status: "available"
                                        }
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
                          <p className="text-red-600 font-semibold">
                            Not available. Alternatives:
                          </p>

                          {Array.isArray(searchResults[med.id]?.alternatives) &&
                            searchResults[med.id].alternatives.map(a => (

                            <button
                              key={a.medicine_id}
                              type="button"
                              className="block w-full text-left px-2 py-1 hover:bg-yellow-50"
                              onClick={() => {
                                setPrescribedMedicines(
                                  prescribedMedicines.map(x =>
                                    x.id === med.id
                                      ? {
                                          ...x,
                                          medicine_id: a.medicine_id,
                                          name: a.name,
                                          availability_status: "substituted"
                                        }
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
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, dosage: e.target.value } : x
                        )
                      )
                    }
                    className="border p-2 rounded"
                    required
                  />
                  <select
                    value={med.frequency}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, frequency: e.target.value } : x
                        )
                      )
                    }
                    className="border p-2 rounded"
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
                  
                  <select
                    value={med.duration}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, duration: e.target.value } : x
                        )
                      )
                    }
                    className="border p-2 rounded"
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

                  <select
                    value={med.quantity}
                    onChange={(e) =>
                      setPrescribedMedicines(
                        prescribedMedicines.map(x =>
                          x.id === med.id ? { ...x, quantity: Number(e.target.value) } : x
                        )
                      )
                    }
                    className="border p-2 rounded"
                    required
                  >
                    <option value="">Qty</option>
                    {[...Array(30)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-200 rounded">
              Cancel
            </button>

            <button type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded">
              {saving ? "Saving..." : "Save Prescription"}
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
        className="px-5 py-2 bg-blue-600 text-white rounded"
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
