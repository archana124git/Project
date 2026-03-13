import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, AlertCircle, ArrowRight } from 'lucide-react';

export default function ListeningPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { doctor, patient } = location.state || {};

  const [transcript, setTranscript] = useState("");

  const summarizeTranscript = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5001/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Summarization failed");
      }

      setSummary(data.summary);

    } catch (err) {
      console.error(err);
      setError("Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const saveConversationAndNavigate = async () => {
    const token = localStorage.getItem("token");

    // 1️⃣ Create conversation
    const convoRes = await fetch("http://localhost:5000/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        patient_id: patient.patient_id,
      }),
    });

    const convoData = await convoRes.json();
    const { convo_id, convo_number } = convoData;

    // 2️⃣ Save transcript
    await fetch("http://localhost:5000/transcripts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        convo_id,
        text: transcript,
        confidence: 0.95,
      }),
    });

    // 3️⃣ Navigate to completion page
    navigate("/consultation", {
      state: {
        convo_id,
        convo_number,
        transcript,
        summary,
        doctor,
        patient,
      },
    });
  };

  /*const goToConsultation = () => {
  navigate("/consultation", {
    state: {
      transcript,
      summary,   // ✅ PASS SUMMARY
      doctor,
      patient
    }
  });
};*/

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">

          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/30">
              <Mic className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">
                Voice Typing Mode 
              </h1>

              {patient && (
                <p className="text-sm text-white/80 mt-1">
                  Patient:{" "}
                  <span className="font-semibold text-white">
                    {patient.name} ({patient.patient_id})
                  </span>
                </p>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-4 py-8">

       

        {/* Transcript Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full inline-block"></span>
            <h2 className="text-base font-bold text-teal-700">Transcript</h2>
          </div>
          <textarea
            className="w-full min-h-[280px] bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200 resize-none text-sm leading-relaxed"
            placeholder="Click here, then press Win + H to start dictation..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">

          {/* Generate Summary Button */}
          <button
            onClick={summarizeTranscript}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </button>

          {/* Go to Consultation Button */}
          {transcript.trim().length > 0 && (
            <button
              onClick={saveConversationAndNavigate}
              disabled={!summary || loading}
              className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 ${
                !summary
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 shadow-sm hover:shadow-md"
              }`}
            >
              Go to Consultation
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Summary Preview */}
        {summary && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full inline-block"></span>
              <h2 className="text-base font-bold text-teal-700">Generated Summary</h2>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
        )}

      </main>
    </div>
  );
}