router.get("/patient/:patientId", authMiddleware, async (req, res) => {
  const { patientId } = req.params;
  const limit = parseInt(req.query.limit) || 4;

  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      prescription_id,
      created_at,
      prescription_medicine (
        medicine_id,
        medicines (name, composition_1, composition_2),
        dosage,
        frequency,
        duration
      )
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch prescriptions" });
  }

  res.json(data);
});