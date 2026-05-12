SIDE_EFFECTS = {
    "diclofenac": ["gastric_irritation"],
    "nimesulide": ["gastric_irritation"],
    "naproxen": ["gastric_irritation"],
    "etoricoxib": ["gastric_irritation"],
    "ibuprofen": ["gastric_irritation"],

    "cefixime": ["nausea", "diarrhea"],
    "cefpodoxime": ["nausea", "diarrhea"],
    "fosfomycin": ["nausea"],
    "amoxicillin": ["nausea"],

    "metformin": ["gas", "bloating"],
    "glimepiride": ["hypoglycemia"],
    "voglibose": ["gas"],
    "vildagliptin": ["nausea"],

    "levothyroxine": ["palpitations"]
}

SUPPORTIVE_MEDICINES = {
    "gastric_irritation": "Pantaprazole",
    "nausea": "Ondansetron",
    "gas": "Simethicone, Pantaprazole",
    "bloating": "Digene",
    "hypoglycemia": "Glucose"
}
def get_supportive_medicine(predicted_medicine):
    medicine = predicted_medicine.lower()

    matched_effects = []

    for keyword, effects in SIDE_EFFECTS.items():
        if keyword in medicine:
            matched_effects.extend(effects)

    result = []

    for effect in set(matched_effects):
        support = SUPPORTIVE_MEDICINES.get(effect)

        if support:
            result.append({
                "medicine": predicted_medicine,
                "effect": effect,
                "support": support
            })

    

    print("Predicted medicine:", predicted_medicine)
    print("Normalized medicine:", predicted_medicine.strip().lower())
    print("Identified side effects:", effects)  
    print("Supportive medicines found:", result)
    return result
 
 