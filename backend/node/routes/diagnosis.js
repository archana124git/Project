//DIAGNOSIS AND MEDICINES ROUTES
import express from "express";
import { supabase } from "../services/supabaseClient.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { encryptDiagnosis, decryptDiagnosis } from "../utils/aes.js";

const router = express.Router();
const getMedicineId = async (medicineName) => {
  if (!medicineName) return null;

  const cleanedName = medicineName
  .trim()
  .replace(/\s+/g, " ")
  .replace(/[–—]/g, "-"); // normalize dashes

  const { data, error } = await supabase
    .from("medicine")
    .select("medicine_id, name")
    .ilike("name", cleanedName)
    .limit(1);

  if (error) {
    console.error("Medicine search error:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log("No match found for:", `"${cleanedName}"`);
    return null;
  }

  return data[0].medicine_id;
};

router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "doctor") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { summary_id, diagnosis } = req.body;

    if (!summary_id || !diagnosis) {
      return res.status(400).json({ error: "summary_id and diagnosis required" });
    }

    const encryptedDiagnosis = encryptDiagnosis(diagnosis);

    const { error } = await supabase.from("diagnosis").insert([
      {
        summary_id,
        disease_name_encrypted: encryptedDiagnosis,
        encryption_key_ref: "v1_master_key",
      },
    ]);

    if (error) {
      console.error("Diagnosis insert error:", error);
      return res.status(500).json({ error: "Failed to save diagnosis" });
    }

    return res.status(201).json({
      message: "Diagnosis stored securely",
    });
  } catch (err) {
    console.error("SAVE DIAGNOSIS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


//search medicines
router.get("/search", authMiddleware, async (req, res) => {
    
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }
    
    // 1️⃣ Check availability anywhere
    const { data: available, error: availError } = await supabase
      .rpc("check_medicine_availability", { search_name: query });

    

    if (availError) throw availError;

    if (available.length > 0) {
      return res.json({
        available: true,
        medicines: available
      });
    }

    // 2️⃣ Find alternatives using composition
    const { data: alternatives, error: altError } = await supabase
      .from("medicine")
      .select("medicine_id, name, composition_1, composition_2")
      .or(
        `composition_1.ilike.%${query}%,composition_2.ilike.%${query}%`
      )
      .limit(5);

    if (altError) throw altError;

    return res.json({
      available: false,
      alternatives
    });

  } catch (err) {
    console.error("MEDICINE SEARCH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET DIAGNOSIS (DECRYPTED)
============================================================================ */
/* ============================================================================
   GET ALL DIAGNOSES FOR A PATIENT (DECRYPTED)
============================================================================ */
router.get("/patient/:patientId", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;

    // 1️⃣ Conversations
    const { data: conversations, error: cErr } = await supabase
      .from("conversations")
      .select("convo_id")
      .eq("patient_id", patientId);

    if (cErr) throw cErr;
    if (!conversations.length) return res.json([]);

    const convoIds = conversations.map(c => c.convo_id);

    // 2️⃣ Clinical summaries
    const { data: summaries, error: sErr } = await supabase
      .from("clinical_summaries")
      .select("summary_id, created_at")
      .in("convo_id", convoIds);

    if (sErr) throw sErr;
    if (!summaries.length) return res.json([]);

    const summaryIds = summaries.map(s => s.summary_id);

    // 3️⃣ Diagnosis
    const { data: diagnoses, error: dErr } = await supabase
      .from("diagnosis")
      .select("diagnosis_id, disease_name_encrypted, created_at, summary_id")
      .in("summary_id", summaryIds)
      .order("created_at", { ascending: false });

    if (dErr) throw dErr;

    // 4️⃣ Decrypt
    const result = diagnoses.map(d => ({
      diagnosis_id: d.diagnosis_id,
      created_at: d.created_at,
      disease_name: decryptDiagnosis(d.disease_name_encrypted),
    }));

    return res.json(result);
  } catch (err) {
    console.error("FETCH PATIENT DIAGNOSES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;    