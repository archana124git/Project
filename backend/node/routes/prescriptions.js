import express from "express";
import { supabase } from "../services/supabaseClient.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================================
   SAVE PRESCRIPTION + MEDICINES
============================================================================ */
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "doctor") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { doctor_id, patient_id, medicines } = req.body;

    if (!doctor_id || !patient_id || !medicines?.length) {
      return res.status(400).json({ error: "Missing data" });
    }
    
    // Validate that all medicines have required fields
    const invalidMedicines = medicines.filter(m => !m.medicine_id || !m.dosage || !m.frequency || !m.duration);
    if (invalidMedicines.length > 0) {
      return res.status(400).json({ error: "All medicines must have medicine_id, dosage, frequency, and duration" });
    }

    const { data: prescription, error: presError } = await supabase
      .from("prescriptions")
      .insert([
        { doctor_id, patient_id, status: "final" }
      ])
      .select()
      .single();

    if (presError) {
      console.error(presError);
      return res.status(500).json({ error: "Failed to create prescription" });
    }

    const rows = medicines.map(m => ({
      prescription_id: prescription.prescription_id,
      medicine_id: m.medicine_id,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      availability_status: m.availability_status
    }));

    const { error: medError } = await supabase
      .from("prescription_medicine")
      .insert(rows);

    if (medError) {
      console.error(medError);
      return res.status(500).json({ error: "Failed to save medicines" });
    }

    res.status(201).json({ prescription_id: prescription.prescription_id });

  } catch (err) {
    console.error("PRESCRIPTION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET PRESCRIPTIONS BY PATIENT ID
============================================================================ */
router.get("/patient/:patientId", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const limit = Number(req.query.limit) || 4;

    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        prescription_id,
        created_at,
        status,
        doctor_id
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("FETCH PRESCRIPTIONS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ============================================================================
   GET PRESCRIPTION BY ID
============================================================================ */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: prescription, error: presError } = await supabase
      .from("prescriptions")
      .select(`*, prescription_medicine(*)`)
      .eq("prescription_id", id)
      .single();

    if (presError) {
      console.error(presError);
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json(prescription);
  } catch (err) {
    console.error("FETCH PRESCRIPTION BY ID ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   DELETE PRESCRIPTION
============================================================================ */
router.delete("/:prescriptionId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "doctor") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { prescriptionId } = req.params;

    // First delete prescription_medicine records
    const { error: medError } = await supabase
      .from("prescription_medicine")
      .delete()
      .eq("prescription_id", prescriptionId);

    if (medError) {
      console.error(medError);
      return res.status(500).json({ error: "Failed to delete prescription medicines" });
    }

    // Then delete the prescription
    const { error: presError } = await supabase
      .from("prescriptions")
      .delete()
      .eq("prescription_id", prescriptionId);

    if (presError) {
      console.error(presError);
      return res.status(500).json({ error: "Failed to delete prescription" });
    }

    res.status(200).json({ message: "Prescription deleted successfully" });

  } catch (err) {
    console.error("DELETE PRESCRIPTION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   DISPATCH PRESCRIPTION + DEDUCT MEDICINE STOCK
============================================================================ */
router.put("/:id/dispatch", authMiddleware, async (req, res) => {
  try {

    // Only pharmacist allowed
    if (req.user.role.toLowerCase() !== "pharmacist") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;

    // Get prescription medicines
    const { data: prescriptionMeds, error: medFetchError } = await supabase
      .from("prescription_medicine")
      .select(`
        medicine_id,
        duration,
        medicine (
          medicine_id,
          name,
          quantity
        )
      `)
      .eq("prescription_id", id);

    if (medFetchError) {
      console.error(medFetchError);
      return res.status(500).json({ error: "Failed to fetch medicines" });
    }

    if (!prescriptionMeds || prescriptionMeds.length === 0) {
      return res.status(404).json({ error: "No medicines found" });
    }

    // Deduct stock
    for (const item of prescriptionMeds) {

      const med = item.medicine;

      // Example deduction logic
      // 1 day duration = 1 quantity deduction
      const deductQty = parseInt(item.duration) || 1;

      const currentQty = med.quantity || 0;

      if (currentQty < deductQty) {
        return res.status(400).json({
          error: `${med.name} does not have enough stock`
        });
      }

      const newQty = currentQty - deductQty;

      const { error: updateError } = await supabase
        .from("medicine")
        .update({
          quantity: newQty
        })
        .eq("medicine_id", med.medicine_id);

      if (updateError) {
        console.error(updateError);
        return res.status(500).json({
          error: `Failed to update stock for ${med.name}`
        });
      }
    }

    // Update prescription dispatch status
    const { error: dispatchError } = await supabase
      .from("prescriptions")
      .update({
        dispatch_status: "dispatched",
        dispatched_at: new Date().toISOString()
      })
      .eq("prescription_id", id);

    if (dispatchError) {
      console.error(dispatchError);
      return res.status(500).json({
        error: "Failed to update dispatch status"
      });
    }

    res.json({
      message: "Prescription dispatched successfully"
    });

  } catch (err) {
    console.error("DISPATCH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;   // ✅ ALWAYS LAST