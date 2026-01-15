import re
from collections import defaultdict

# -----------------------------
# ENHANCED SYMPTOM MAP
# -----------------------------
SYMPTOM_MAP = {
    "fever": ["fever", "high temperature", "febrile", "pyrexia"],
    "chills": ["chills", "rigors", "shivering"],
    "fatigue": ["fatigue", "tiredness", "exhaustion", "weakness", "tired all the time", "always tired", "extremely tired"],
    "weight_loss": ["weight loss", "losing weight", "unintentional weight loss", "lost weight", "lost 15 pounds", "lost 10 pounds", "lost 20 pounds"],
    "weight_gain": ["weight gain", "gaining weight"],
    "loss_of_appetite": ["loss of appetite", "poor appetite", "anorexia"],
    "night_sweats": ["night sweats"],
    "malaise": ["malaise", "feeling unwell", "generally unwell"],
    
    # Pain
    "headache": ["headache", "migraine", "head pain", "cephalalgia"],
    "severe_headache": ["severe headache", "worst headache", "thunderclap headache"],
    "joint_pain": ["joint pain", "knee pain", "finger pain", "elbow pain", "arthralgia", "joints hurt", "pain in joints", "pain in my hands", "pain in my knees", "pain and swelling in my hands"],
    "muscle_pain": ["muscle pain", "myalgia"],
    "back_pain": ["back pain", "lumbar pain"],
    "chest_pain": ["chest pain", "chest discomfort"],
    "abdominal_pain": ["abdominal pain", "stomach pain", "belly pain"],
    "right_upper_quadrant_pain": ["right upper quadrant pain", "ruq pain", "right upper stomach pain"],
    "epigastric_pain": ["epigastric pain", "upper stomach pain", "pain below ribs"],
    "pelvic_pain": ["pelvic pain", "lower abdominal pain"],
    "bone_pain": ["bone pain"],
    "tooth_pain": ["tooth pain", "dental pain", "toothache"],
    "ear_pain": ["ear pain", "earache", "otalgia"],
    "retro_orbital_pain": ["pain behind eyes", "retro orbital pain", "eye socket pain"],
    "painful_menstruation": ["painful periods", "dysmenorrhea", "menstrual cramps", "period pain"],
    "painful_intercourse": ["painful intercourse", "dyspareunia", "pain during sex"],
    
    # Stiffness & Movement
    "stiffness": ["stiffness", "joint stiffness", "joints feel stiff", "feel stiff"],
    "morning_stiffness": ["morning stiffness", "stiffness in morning", "stiff in the morning", "stiff after i wake up", "stiffness after waking"],
    "limited_range_of_motion": ["restricted movement", "limited movement", "reduced mobility"],
    "gait_instability": ["difficulty walking", "unsteady gait", "balance problems"],
    
    # Swelling
    "swelling": ["swelling", "edema", "swollen"],
    "joint_swelling": ["joint swelling", "swollen joints", "swelling in my hands", "swelling in my knees"],
    "leg_swelling": ["leg swelling", "pedal edema", "ankle swelling"],
    "facial_swelling": ["facial swelling", "swollen face"],
    "neck_swelling": ["neck swelling", "enlarged neck", "goiter"],
    "breast_lump": ["breast lump", "breast mass"],
    "lump": ["lump", "mass", "nodule"],
    "painless_lymph_node_swelling": ["painless lymph node swelling", "swollen lymph nodes without pain"],
    "lymph_node_swelling": ["swollen lymph nodes", "enlarged lymph nodes"],
    "ascites": ["ascites", "abdominal swelling", "fluid in abdomen"],
    
    # Respiratory
    "cough": ["cough", "coughing"],
    "dry_cough": ["dry cough", "non productive cough"],
    "productive_cough": ["productive cough", "phlegm", "sputum", "mucus"],
    "chronic_cough": ["chronic cough", "cough for months", "cough for weeks", "persistent cough"],
    "shortness_of_breath": ["shortness of breath", "dyspnea", "breathless", "difficulty breathing"],
    "wheezing": ["wheezing", "whistling sound"],
    "sore_throat": ["sore throat", "throat pain", "pharyngitis"],
    "runny_nose": ["runny nose", "rhinorrhea", "nasal discharge"],
    "nasal_congestion": ["blocked nose", "stuffy nose", "nasal congestion"],
    "hemoptysis": ["coughing blood", "blood in sputum", "hemoptysis"],
    "orthopnea": ["orthopnea", "breathlessness lying down", "difficulty breathing while lying down"],
    "paroxysmal_nocturnal_dyspnea": ["pnd", "breathless at night", "sudden breathlessness at night"],
    "chest_tightness": ["chest tightness", "pressure in chest"],
    
    # Gastrointestinal
    "nausea": ["nausea", "feeling sick"],
    "vomiting": ["vomiting", "emesis", "throwing up"],
    "diarrhea": ["diarrhea", "loose stools", "watery stools"],
    "bloody_diarrhea": ["bloody diarrhea", "blood in diarrhea"],
    "chronic_diarrhea": ["chronic diarrhea", "diarrhea for months"],
    "constipation": ["constipation", "hard stools", "difficulty passing stools", "infrequent bowel movements"],
    "heartburn": ["heartburn", "acid reflux", "burning chest", "gerd"],
    "blood_in_stool": ["blood in stool", "hematochezia", "bloody stool"],
    "black_stools": ["black stools", "melena", "tarry stools"],
    "jaundice": ["jaundice", "yellowing of skin", "yellow eyes"],
    "bloating": ["bloating", "abdominal distension", "abdominal bloating"],
    "straining": ["straining", "straining during defecation"],
    "incomplete_evacuation": ["feeling of incomplete evacuation", "incomplete bowel emptying"],
    "difficulty_swallowing": ["difficulty swallowing", "dysphagia"],
    "rectal_bleeding": ["rectal bleeding", "bleeding from rectum"],
    
    # Genitourinary
    "burning_urination": ["burning urination", "dysuria", "painful urination", "pain when urinating", "burning when urinating", "pain while urinating"],
    "blood_in_urine": ["blood in urine", "hematuria"],
    "frequent_urination": ["frequent urination", "polyuria", "urinating frequently", "need to urinate often"],
    "urgency": ["urgency", "urinary urgency", "urgent need to urinate", "need to go urgently"],
    "flank_pain": ["flank pain", "loin pain"],
    "weak_urine_stream": ["weak urine stream", "poor flow"],
    "difficulty_urinating": ["difficulty urinating", "straining to urinate"],
    "frequent_night_urination": ["frequent night urination", "nocturia"],
    "decreased_urine": ["decreased urine", "oliguria", "reduced urine output"],
    "foamy_urine": ["foamy urine", "frothy urine", "bubbles in urine"],
    "tea_colored_urine": ["tea colored urine", "dark urine", "cola colored urine"],
    
    # Neurological
    "dizziness": ["dizziness", "vertigo", "giddiness", "lightheaded"],
    "seizure": ["seizure", "fits", "convulsions"],
    "numbness": ["numbness", "loss of sensation", "numb", "numbness on right side", "numbness on left side", "right side numb", "left side numb"],
    "tingling": ["tingling", "pins and needles", "paresthesia"],
    "slurred_speech": ["slurred speech", "difficulty speaking", "speech difficulty", "can't speak properly"],
    "memory_loss": ["memory loss", "forgetfulness"],
    "confusion": ["confusion", "disorientation"],
    "loss_of_consciousness": ["loss of consciousness", "fainting", "blackout"],
    "vision_loss": ["loss of vision", "vision loss", "blind"],
    "tremors": ["tremors", "shaking", "hand shaking"],
    "facial_deviation": ["facial deviation", "face drooping", "facial droop", "drooping face", "side of face drooping", "facial drooping"],
    "weakness_one_side": ["one sided weakness", "weakness on one side", "hemiparesis", "arm weakness", "right arm weakness", "left arm weakness", "right side weak", "left side weak", "weakness right side", "weakness left side"],
    "drowsiness": ["drowsiness", "sleepiness", "lethargy"],
    "slow_speech": ["slow speech"],
    "rigidity": ["rigidity", "muscle stiffness"],
    "hallucinations": ["hallucinations", "seeing things", "hearing voices"],
    "delusions": ["delusions", "false beliefs", "paranoia"],
    "disorganized_thinking": ["disorganized thinking", "confused thoughts", "racing thoughts"],
    
    # Other symptoms from disease patterns
    "breathing_difficulty": ["difficulty breathing", "breathless", "shortness of breath"],
}

# -----------------------------
# DISEASE PATTERNS (FIXED - Removed Duplicates)
# -----------------------------
DISEASE_PATTERNS = {
    # ==================== INFECTIOUS DISEASES ====================
    "COVID-19": {
        "required": ["fever", "cough"],
        "highly_specific": ["loss_of_smell", "loss_of_taste"],
        "supporting": ["fatigue", "sore_throat", "shortness_of_breath"],
        "excludes": ["productive_cough"]
    },
     "Viral Fever": {
        "required": ["fever", "headache","cough"],
        "highly_specific": [ "loss_of_taste"],
        "supporting": ["fatigue", "sore_throat"],
        "excludes": ["productive_cough"]
    },
    
    "Viral Upper Respiratory Infection": {
        "required": ["fever", "cough"],
        "supporting": ["sore_throat", "fatigue", "chills", "runny_nose", "nasal_congestion"],
        "excludes": ["loss_of_smell", "loss_of_taste", "shortness_of_breath"]
    },
    
    "Pneumonia": {
        "required": ["fever", "cough"],
        "highly_specific": ["productive_cough", "chest_pain"],
        "supporting": ["shortness_of_breath", "fatigue"],
        "excludes": []
    },
    
    "Tuberculosis": {
        "required": ["chronic_cough"],
        "highly_specific": ["hemoptysis", "night_sweats"],
        "supporting": ["weight_loss", "fever", "fatigue"],
        "excludes": []
    },
    
    "Meningitis": {
        "required": ["fever", "neck_stiffness"],
        "highly_specific": ["photophobia"],
        "supporting": ["headache", "confusion", "vomiting"],
        "excludes": []
    },
    
    "Urinary Tract Infection": {
        "required": ["burning_urination"],
        "highly_specific": ["frequent_urination", "urgency"],
        "supporting": ["blood_in_urine", "fever", "flank_pain"],
        "excludes": []
    },
    
    "Acute Gastroenteritis": {
        "required": ["diarrhea"],
        "supporting": ["vomiting", "abdominal_pain", "fever", "nausea"],
        "excludes": ["blood_in_stool", "black_stools"]
    },
    
    "Malaria": {
        "required": ["cyclical_fever"],
        "highly_specific": ["rigors", "splenomegaly"],
        "supporting": ["headache", "chills", "sweating", "fatigue"],
        "excludes": []
    },
    
    "Dengue Fever": {
        "required": ["fever", "severe_headache"],
        "highly_specific": ["retro_orbital_pain", "joint_pain"],
        "supporting": ["muscle_pain", "rash", "bleeding"],
        "excludes": []
    },
    
    "Hepatitis": {
        "required": ["jaundice"],
        "highly_specific": ["right_upper_quadrant_pain"],
        "supporting": ["fatigue", "nausea", "loss_of_appetite", "fever"],
        "excludes": []
    },
    
    # ==================== CARDIOVASCULAR ====================
    "Myocardial Infarction": {
        "required": ["chest_pain"],
        "highly_specific": ["sweating"],
        "supporting": ["shortness_of_breath", "palpitations", "nausea"],
        "excludes": []
    },
    
    "Congestive Heart Failure": {
        "required": ["shortness_of_breath"],
        "highly_specific": ["orthopnea", "paroxysmal_nocturnal_dyspnea"],
        "supporting": ["leg_swelling", "fatigue", "reduced_exercise_tolerance"],
        "excludes": []
    },
    
    "Arrhythmia": {
        "required": ["palpitations"],
        "supporting": ["dizziness", "syncope", "chest_pain"],
        "excludes": []
    },
    
    "Hypertension": {
        "required": ["headache"],
        "supporting": ["dizziness", "fatigue"],
        "excludes": []
    },
    
    # ==================== NEUROLOGICAL ====================
    "Stroke": {
        "required": ["slurred_speech"],
        "highly_specific": ["facial_deviation", "weakness_one_side"],
        "supporting": ["numbness", "dizziness", "confusion", "headache"],
        "excludes": []
    },
    
    "Epilepsy": {
        "required": ["seizure"],
        "supporting": ["loss_of_consciousness", "confusion"],
        "excludes": []
    },
    
    "Parkinsons Disease": {
        "required": ["tremors"],
        "highly_specific": ["rigidity", "gait_instability"],
        "supporting": ["slow_speech"],
        "excludes": []
    },
    
    "Alzheimers Disease": {
        "required": ["memory_loss"],
        "supporting": ["confusion", "gait_instability"],
        "excludes": []
    },
    
    # ==================== ENDOCRINE ====================
    "Diabetes Mellitus": {
        "required": ["increased_thirst", "frequent_urination"],
        "highly_specific": ["increased_hunger"],
        "supporting": ["weight_loss", "fatigue", "blurred_vision"],
        "excludes": []
    },
    
    "Hypothyroidism": {
        "required": ["cold_intolerance"],
        "highly_specific": ["weight_gain", "dry_skin"],
        "supporting": ["fatigue", "hair_loss", "constipation"],
        "excludes": ["heat_intolerance"]
    },
    
    "Hyperthyroidism": {
        "required": ["heat_intolerance"],
        "highly_specific": ["weight_loss", "tremors"],
        "supporting": ["palpitations", "anxiety", "increased_hunger"],
        "excludes": ["cold_intolerance"]
    },
    
    "Goitre": {
        "required": ["neck_swelling"],
        "supporting": ["difficulty_swallowing", "hoarseness"],
        "excludes": []
    },
    
    # ==================== RHEUMATOLOGICAL ====================
    "Rheumatoid Arthritis": {
        "required": ["joint_pain"],
        "highly_specific": ["morning_stiffness", "joint_swelling"],
        "supporting": ["fatigue", "stiffness"],
        "excludes": []
    },
    
    "Osteoarthritis": {
        "required": ["joint_pain"],
        "supporting": ["stiffness", "limited_range_of_motion"],
        "excludes": ["morning_stiffness"]
    },
    
    "Osteoporosis": {
        "required": ["bone_pain"],
        "supporting": ["fracture", "age"],
        "excludes": []
    },
    
    "Ankylosing Spondylitis": {
        "required": ["back_pain"],
        "highly_specific": ["morning_stiffness"],
        "supporting": ["limited_range_of_motion"],
        "excludes": []
    },
    
    "Fracture": {
        "required": ["history_of_trauma"],
        "highly_specific": ["deformity", "inability_to_move"],
        "supporting": ["swelling", "joint_pain"],
        "excludes": []
    },
    
    # ==================== RESPIRATORY ====================
    "Asthma": {
        "required": ["wheezing"],
        "supporting": ["shortness_of_breath", "cough", "chest_tightness"],
        "excludes": ["fever"]
    },
    
  "Bronchiectasis": {
    "required": ["chronic_cough", "productive_cough"],
    "highly_specific": ["recurrent_infections", "hemoptysis"],
    "supporting": ["clubbing", "shortness_of_breath"],
    "excludes": ["acute_fever"]
  },

  "Chronic Kidney Disease": {
    "required": ["fatigue"],
    "supporting": ["leg_swelling", "blood_in_urine", "decreased_urine"],
    "excludes": ["acute_dehydration"]
  },

  "Depression": {
    "required": ["persistent_low_mood"],
    "supporting": ["sleep_disturbance", "fatigue", "loss_of_interest"],
    "excludes": ["mania"]
  },

  "Anxiety Disorder": {
    "required": ["anxiety"],
    "supporting": ["palpitations", "sleep_disturbance"],
    "excludes": ["hyperthyroidism"]
  },

  "Breast Cancer": {
    "required": ["breast_lump"],
    "supporting": ["weight_loss", "persistent_pain"],
    "excludes": ["breast_infection"]
  },

  "Lung Cancer": {
    "required": ["chronic_cough"],
    "highly_specific": ["hemoptysis"],
    "supporting": ["weight_loss", "shortness_of_breath", "chest_pain"],
    "excludes": ["acute_respiratory_infection"]
  },

  "Colorectal Cancer": {
    "required": ["blood_in_stool"],
    "supporting": ["weight_loss", "abdominal_pain", "constipation"],
    "excludes": ["hemorrhoids"]
  },

  "PCOS": {
    "required": ["irregular_menstrual_cycles", "hyperandrogenism"],
    "highly_specific": ["polycystic_ovaries_on_ultrasound"],
    "supporting": ["weight_gain", "acne", "hirsutism", "infertility"],
    "excludes": ["pregnancy", "thyroid_disorder", "hyperprolactinemia"]
  },

  "Type 2 Diabetes Mellitus": {
    "required": ["polyuria", "polydipsia"],
    "supporting": ["weight_loss", "fatigue", "blurred_vision"],
    "excludes": ["acute_fever"]
  },

  "Hypothyroidism": {
    "required": ["fatigue", "weight_gain"],
    "supporting": ["cold_intolerance", "dry_skin", "constipation"],
    "excludes": ["weight_loss", "palpitations"]
  },

  "Hyperthyroidism": {
    "required": ["weight_loss", "palpitations"],
    "supporting": ["heat_intolerance", "tremors", "anxiety"],
    "excludes": ["weight_gain", "cold_intolerance"]
  },

  "Hypertension": {
    "required": ["elevated_blood_pressure"],
    "supporting": ["headache", "dizziness"],
    "excludes": ["hypotension"]
  },

  "Coronary Artery Disease": {
    "required": ["chest_pain"],
    "highly_specific": ["pain_radiating_to_left_arm"],
    "supporting": ["shortness_of_breath", "sweating"],
    "excludes": ["musculoskeletal_pain"]
  },

  "Asthma": {
    "required": ["wheezing", "shortness_of_breath"],
    "supporting": ["chest_tightness", "cough"],
    "excludes": ["hemoptysis"]
  },

  "COPD": {
    "required": ["chronic_cough", "shortness_of_breath"],
    "supporting": ["smoking_history", "wheezing"],
    "excludes": ["acute_onset"]
  },

  "Stroke": {
    "required": ["sudden_weakness", "speech_difficulty"],
    "supporting": ["facial_droop", "vision_loss"],
    "excludes": ["gradual_onset"]
  },

  "Migraine": {
    "required": ["headache"],
    "highly_specific": ["photophobia"],
    "supporting": ["nausea", "vomiting"],
    "excludes": ["head_injury"]
  },

  "Anemia": {
    "required": ["fatigue", "pallor"],
    "supporting": ["shortness_of_breath", "dizziness"],
    "excludes": ["acute_bleeding"]
  },

  "Pregnancy": {
    "required": ["missed_period"],
    "supporting": ["nausea", "breast_tenderness"],
    "excludes": ["negative_pregnancy_test"]
  }
}

    
   


# -----------------------------
# FUNCTION: Extract Symptoms with Improved Detection
# -----------------------------
def extract_symptoms(text):
    """Extract symptoms with improved negation detection"""
    text = text.lower()
    present = set()
    absent = set()
    
    # Negation patterns
    negation_patterns = [
        r"no\s+{keyword}",
        r"not\s+{keyword}",
        r"without\s+{keyword}",
        r"denies\s+{keyword}",
        r"absent\s+{keyword}",
        r"doesn't\s+have\s+{keyword}",
        r"don't\s+have\s+{keyword}",
        r"never\s+had\s+{keyword}",
        r"no\s+history\s+of\s+{keyword}",
    ]
    
    for canonical, keywords in SYMPTOM_MAP.items():
        found = False
        is_negated = False
        
        # Sort keywords by length (longest first) to match more specific phrases first
        sorted_keywords = sorted(keywords, key=len, reverse=True)
        
        for keyword in sorted_keywords:
            # Check if keyword exists in text
            if keyword in text:
                found = True
                
                # Check for negation
                for neg_pattern in negation_patterns:
                    pattern = neg_pattern.format(keyword=re.escape(keyword))
                    if re.search(pattern, text):
                        is_negated = True
                        break
                
                if is_negated:
                    break
                # Once found without negation, stop checking other keywords for this symptom
                if found and not is_negated:
                    break
        
        if found:
            if is_negated:
                absent.add(canonical)
            else:
                present.add(canonical)
    
    return list(present), list(absent)

# -----------------------------
# FUNCTION: Enhanced Diagnosis
# -----------------------------
def diagnose_differential(symptoms_present, symptoms_absent):
    """Enhanced diagnosis with differential diagnosis approach"""
    scores = {}
    
    for disease, pattern in DISEASE_PATTERNS.items():
        # Check if any excluded symptoms are present
        if "excludes" in pattern and pattern["excludes"]:
            if any(s in symptoms_present for s in pattern["excludes"]):
                continue
        
        # Check required symptoms
        required_present = all(s in symptoms_present for s in pattern["required"])
        if not required_present:
            continue
        
        # Calculate score
        score = 0
        
        # Required symptoms (highest weight)
        score += len(pattern["required"]) * 5
        
        # Highly specific symptoms (very high weight)
        if "highly_specific" in pattern:
            specific_count = sum(1 for s in pattern["highly_specific"] if s in symptoms_present)
            score += specific_count * 4
        
        # Supporting symptoms (moderate weight)
        if "supporting" in pattern:
            supporting_count = sum(1 for s in pattern["supporting"] if s in symptoms_present)
            score += supporting_count * 2
        
        # Penalty for missing supporting symptoms
        if "supporting" in pattern:
            missing_supporting = sum(1 for s in pattern["supporting"] if s not in symptoms_present)
            score -= missing_supporting * 0.3
        
        # Bonus for not having excluded symptoms
        if "excludes" in pattern and pattern["excludes"]:
            excluded_absent = sum(1 for s in pattern["excludes"] if s in symptoms_absent)
            score += excluded_absent * 1
        
        scores[disease] = max(0, score)
    
    if not scores:
        return [("Undifferentiated clinical condition", 0)]
    
    # Get top 3 diagnoses
    sorted_diagnoses = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    # Calculate confidence percentage
    max_score = sorted_diagnoses[0][1]
    results = []
    for disease, score in sorted_diagnoses[:3]:
        confidence = (score / max_score * 100) if max_score > 0 else 0
        results.append((disease, confidence))
    
    return results

# -----------------------------
# FUNCTION: Extract Past Medical History
# -----------------------------
def extract_pmh(text):
    """Extract past medical history"""
    t = text.lower()
    
    chronic_conditions = {
        "diabetes": "Diabetes mellitus",
        "dm": "Diabetes mellitus",
        "sugar": "Diabetes mellitus",
        "hypertension": "Hypertension",
        "htn": "Hypertension",
        "high blood pressure": "Hypertension",
        "bp": "Hypertension",
        "asthma": "Bronchial asthma",
        "copd": "Chronic obstructive pulmonary disease",
        "heart disease": "Ischemic heart disease",
        "cardiac": "Ischemic heart disease",
        "kidney disease": "Chronic kidney disease",
        "ckd": "Chronic kidney disease",
        "renal": "Chronic kidney disease",
        "arthritis": "Arthritis",
        "thyroid": "Thyroid disorder",
        "cancer": "Malignancy",
        "stroke": "Cerebrovascular accident",
        "epilepsy": "Seizure disorder",
    }
    
    pmh = []
    for keyword, condition in chronic_conditions.items():
        if keyword in t:
            negation_patterns = [
                f"no {keyword}",
                f"no history of {keyword}",
                f"don't have {keyword}",
                f"never had {keyword}",
                f"without {keyword}",
            ]
            negation_found = any(neg in t for neg in negation_patterns)
            if not negation_found:
                if condition not in pmh:
                    pmh.append(condition)
    
    return pmh if pmh else ["None reported"]

# -----------------------------
# FUNCTION: Determine Chief Complaint
# -----------------------------
def determine_chief_complaint(symptoms_present, text):
    """Determine chief complaint from context"""
    t = text.lower()
    
    # Priority symptoms
    priority_symptoms = [
        "chest_pain", "shortness_of_breath", "seizure", "loss_of_consciousness",
        "severe_headache", "facial_deviation", "weakness_one_side"
    ]
    
    for symptom in priority_symptoms:
        if symptom in symptoms_present:
            return symptom.replace("_", " ").title()
    
    if symptoms_present:
        return symptoms_present[0].replace("_", " ").title()
    
    return "Not specified"

# -----------------------------
# FUNCTION: CRT Summarizer
# -----------------------------
def summarize_to_crt(text):
    """Generate Clinical Record Template (CRT) summary"""
    symptoms_present, symptoms_absent = extract_symptoms(text)
    
    chief_complaint = determine_chief_complaint(symptoms_present, text)
    pmh = extract_pmh(text)
    
    differential = diagnose_differential(symptoms_present, symptoms_absent)
    
    primary_diagnosis = differential[0][0]
    dd_text = "\n".join([
        f"   {i+1}. {disease} (Confidence: {confidence:.1f}%)"
        for i, (disease, confidence) in enumerate(differential)
    ])
    
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

5. ASSESSMENT & DIFFERENTIAL DIAGNOSIS:
   Primary Clinical Impression: {primary_diagnosis}
   
   Differential Diagnosis:
{dd_text}

==================================================
NOTE: This is a clinical decision support tool. 
Final diagnosis should be made by qualified healthcare professionals.
==================================================
"""
    return summary