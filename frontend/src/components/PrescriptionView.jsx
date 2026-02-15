import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrescriptionPreview from "./PrescriptionPreview";
import html2pdf from "html2pdf.js";

export default function PrescriptionView() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prescriptionId) return;
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => {
        console.error("Fetch prescription error:", err);
      })
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  if (loading) return <div className="p-4">Loading prescription...</div>;
  if (!data) return (
    <div className="p-6">
      <p className="text-red-600">Prescription not found.</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-3 py-2 bg-gray-200 rounded">Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Prescription</h1>
        <div id="prescription-print">
          <PrescriptionPreview data={data} />
        </div>
      </main>
    </div>
  );
}
