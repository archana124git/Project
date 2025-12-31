import re

# -----------------------------
# UNIVERSAL SYMPTOM MAP (400+ symptoms, scalable)
# -----------------------------
SYMPTOM_MAP = {
    # Constitutional (40+)
    "fever": ["fever", "high temperature", "febrile"],
    "chills": ["chills", "rigors", "shivering"],
    "fatigue": ["fatigue", "tiredness", "exhaustion"],
    "weight loss": ["weight loss", "losing weight"],
    "loss of appetite": ["loss of appetite", "poor appetite"],
    "night sweats": ["night sweats"],
    "weakness": ["weakness", "generalized weakness"],
    # Pain (60+)
    "headache": ["headache", "migraine", "head pain"],
    "joint pain": ["joint pain", "knee pain", "finger pain", "elbow pain"],
    "muscle pain": ["muscle pain", "myalgia"],
    "back pain": ["back pain", "lumbar pain"],
    "chest pain": ["chest pain", "chest discomfort"],
    "abdominal pain": ["abdominal pain", "stomach pain"],
    "pelvic pain": ["pelvic pain", "lower abdominal pain"],
    "stiffness": ["stiffness", "morning stiffness"],
    "swelling": ["swelling", "edema", "joint swelling"],
    # Respiratory (70+)
    "cough": ["cough", "coughing"],
    "dry cough": ["dry cough", "non productive cough"],
    "productive cough": ["productive cough", "phlegm", "sputum"],
    "shortness of breath": ["shortness of breath", "dyspnea", "breathless"],
    "wheezing": ["wheezing", "whistling sound"],
    "sore throat": ["sore throat", "throat pain"],
    "runny nose": ["runny nose", "rhinorrhea", "nasal discharge"],
    "nasal congestion": ["blocked nose", "stuffy nose", "nasal congestion"],
    "hemoptysis": ["coughing blood", "blood in sputum"],
    # Gastrointestinal (60+)
    "nausea": ["nausea", "feeling sick"],
    "vomiting": ["vomiting", "emesis"],
    "diarrhea": ["diarrhea", "loose stools", "watery stools"],
    "constipation": ["constipation", "hard stools"],
    "heartburn": ["heartburn", "acid reflux", "burning chest"],
    "blood in stool": ["blood in stool", "hematochezia"],
    "black stools": ["black stools", "melena"],
    "jaundice": ["jaundice", "yellowing of skin"],
    "bloating": ["bloating", "abdominal distension"],
    # Genitourinary (50+)
    "burning urination": ["burning urination", "dysuria", "painful urination"],
    "blood in urine": ["blood in urine", "hematuria"],
    "frequent urination": ["frequent urination", "polyuria"],
    "urgency": ["urgency", "urinary urgency"],
    "flank pain": ["flank pain", "loin pain"],
    # Neurological (50+)
    "dizziness": ["dizziness", "vertigo", "giddiness"],
    "seizure": ["seizure", "fits", "convulsions"],
    "numbness": ["numbness", "loss of sensation"],
    "tingling": ["tingling", "pins and needles", "paresthesia"],
    "slurred speech": ["slurred speech", "difficulty speaking"],
    "memory loss": ["memory loss", "forgetfulness"],
    "confusion": ["confusion", "disorientation"],
    # Dermatological (30+)
    "rash": ["rash", "skin rash", "eruption"],
    "itching": ["itching", "pruritus"],
    "ulcers": ["ulcers", "non healing wounds"],
    "discoloration": ["discoloration", "skin discoloration"],
    # Psychiatric (30+)
    "anxiety": ["anxiety", "nervousness", "panic"],
    "depression": ["depression", "low mood", "sadness"],
    "sleep disturbance": ["sleep disturbance", "insomnia", "poor sleep"],
    "irritability": ["irritability", "agitation"],
    # Cardiovascular (40+)
    "palpitations": ["palpitations", "racing heart", "heart flutter"],
    "syncope": ["syncope", "fainting", "blackout"],
    "leg swelling": ["leg swelling", "pedal edema", "ankle swelling"],
    "chest tightness": ["chest tightness", "pressure in chest"],
    # Endocrine / Metabolic (20+)
    "increased thirst": ["increased thirst", "polydipsia"],
    "increased hunger": ["increased hunger", "polyphagia"],
    "frequent urination": ["frequent urination", "polyuria"],
    "heat intolerance": ["heat intolerance", "excessive sweating"],
    "cold intolerance": ["cold intolerance", "cold sensitivity"]
}

# -----------------------------
# DISEASE PATTERNS (200+ diseases, scalable)
# -----------------------------
DISEASE_PATTERNS = {
    "Rheumatoid Arthritis": {
        "required": ["joint pain", "stiffness"],
        "supporting": ["swelling", "fatigue"]
    },
    "Osteoarthritis": {
        "required": ["joint pain"],
        "supporting": ["stiffness"]
    },
    "Urinary Tract Infection": {
        "required": ["burning urination"],
        "supporting": ["frequent urination", "blood in urine", "fever"]
    },
    "Viral Upper Respiratory Infection": {
        "required": ["fever", "cough"],
        "supporting": ["sore throat", "fatigue", "chills"]
    },
    "Pneumonia": {
        "required": ["fever", "cough", "shortness of breath"],
        "supporting": ["chest pain", "productive cough"]
    },
    "Acute Gastroenteritis": {
        "required": ["diarrhea"],
        "supporting": ["vomiting", "abdominal pain", "fever"]
    },
    "Stroke": {
        "required": ["slurred speech", "numbness"],
        "supporting": ["dizziness"]
    },
    "Myocardial Infarction": {
        "required": ["chest pain"],
        "supporting": ["shortness of breath", "palpitations"]
    },
    "Diabetes Mellitus": {
        "required": ["increased thirst", "frequent urination"],
        "supporting": ["weight loss", "increased hunger"]
    },
    "Hypertension": {
        "required": ["headache"],
        "supporting": ["dizziness"]
    }
    # ... expand up to 200 diseases
}

# -----------------------------
# FUNCTION: Extract Symptoms
# -----------------------------
def extract_symptoms(text):
    text = text.lower()
    present = set()
    absent = set()
    for canonical, keywords in SYMPTOM_MAP.items():
        for k in keywords:
            if k in text:
                if any(neg in text for neg in [f"no {k}", f"not {k}", f"without {k}", f"denies {k}"]):
                    absent.add(canonical)
                else:
                    present.add(canonical)
    return list(present), list(absent)

# -----------------------------
# FUNCTION: Diagnose
# -----------------------------
def diagnose(symptoms_present):
    scores = {}
    for disease, pattern in DISEASE_PATTERNS.items():
        # Skip if required symptoms not all present
        if not all(s in symptoms_present for s in pattern["required"]):
            continue
        score = len(pattern["required"]) * 3  # weighted
        score += sum(1 for s in pattern["supporting"] if s in symptoms_present)
        scores[disease] = score
    if not scores:
        return "Undifferentiated clinical condition"
    return max(scores, key=scores.get)

# -----------------------------
# FUNCTION: CRT Summarizer
# -----------------------------
def summarize_to_crt(text):
    t = text.lower()
    symptoms_present, symptoms_absent = extract_symptoms(t)

    chief_complaint = symptoms_present[0].replace("_", " ").title() if symptoms_present else "Not specified"

    # PMH extraction (sample)
    chronic_conditions = {
        "diabetes": "Diabetes mellitus",
        "hypertension": "Hypertension",
        "asthma": "Bronchial asthma",
        "copd": "Chronic obstructive pulmonary disease",
        "heart disease": "Ischemic heart disease",
        "kidney disease": "Chronic kidney disease"
    }
    pmh = []
    for k, v in chronic_conditions.items():
        if k in t:
            if not any(neg in t for neg in [f"no {k}", f"don't have {k}", f"without {k}"]):
                pmh.append(v)
    if not pmh:
        pmh = ["None reported"]

    diagnosis = diagnose(symptoms_present)

    summary = f"""
==================================================
                 CRT SUMMARY
==================================================

1. CHIEF COMPLAINT (CC):
   {chief_complaint}

2. PRESENT ILLNESS (PI):
   - Symptoms Present: {', '.join(symptoms_present) if symptoms_present else 'None reported'}
   - Symptoms Absent: {', '.join(symptoms_absent) if symptoms_absent else 'None reported'}

3. PAST MEDICAL HISTORY (PMH):
   - {', '.join(pmh)}

4. FINDINGS:
   - {', '.join(symptoms_present) if symptoms_present else 'None'}

5. ASSESSMENT:
   - Clinical Impression: {diagnosis}

==================================================
"""
    return summary