import re
from collections import defaultdict

# =============================================================================
# SYMPTOM MAP  (unchanged from your original)
# =============================================================================
SYMPTOM_MAP = {
    "fever": ["fever","high temperature","temperature","febrile","body heat","feeling feverish","high fever","low grade fever","mild fever"],
    "chills": ["chills","shivering","rigors","shaking chills","feeling cold","cold spells"],
    "fatigue": ["fatigue","tiredness","weakness","exhaustion","feeling weak","low energy","lethargy","always tired","extremely tired","feel tired","tired all the time","feeling tired","very tired","so tired"],
    "body_ache": ["body ache","body pain","generalized body pain","muscle ache","whole body pain","myalgia","body soreness"],
    "loss_of_appetite": ["loss of appetite","poor appetite","reduced appetite","not eating well","doesn't feel like eating","anorexia"],
    "headache": ["headache","head pain","pain in head","migraine","head hurting"],
    "severe_headache": ["severe headache","worst headache","thunderclap headache","very bad headache","intense headache"],
    "dizziness": ["dizziness","giddiness","vertigo","lightheadedness","feeling faint","lightheaded"],
    "photophobia": ["photophobia","light sensitivity","cannot tolerate light","light hurts eyes"],
    "loss_of_consciousness": ["loss of consciousness","fainting","blackout","passed out","syncope"],
    "seizure": ["seizure","fits","convulsions","jerking movements"],
    "cough": ["cough","coughing","persistent cough","chronic cough"],
    "dry_cough": ["dry cough","non productive cough","cough without sputum"],
    "productive_cough": ["productive cough","phlegm","sputum","mucus","cough with sputum","wet cough"],
    "shortness_of_breath": ["shortness of breath","breathlessness","difficulty breathing","dyspnea","breathing difficulty","cannot breathe properly","hard to breathe","breathless"],
    "wheezing": ["wheezing","whistling sound","wheeze"],
    "sore_throat": ["sore throat","throat pain","pain while swallowing","scratchy throat","pharyngitis"],
    "runny_nose": ["runny nose","nasal discharge","rhinorrhea"],
    "nasal_congestion": ["blocked nose","stuffy nose","nasal congestion"],
    "chest_pain": ["chest pain","chest discomfort","pain in chest","tightness in chest"],
    "chest_tightness": ["chest tightness","pressure in chest","heavy chest"],
    "hemoptysis": ["coughing blood","blood in sputum","hemoptysis"],
    "abdominal_pain": ["abdominal pain","stomach pain","belly pain","pain abdomen","tummy pain"],
    "epigastric_pain": ["epigastric pain","upper stomach pain","pain below chest","burning stomach pain","pain below ribs"],
    "nausea": ["nausea","feeling nauseous","feeling sick"],
    "vomiting": ["vomiting","throwing up","emesis","vomited"],
    "diarrhea": ["diarrhea","loose stools","watery stools","frequent stools"],
    "constipation": ["constipation","hard stools","difficulty passing stool","infrequent bowel movements"],
    "heartburn": ["heartburn","acid reflux","burning chest","acidity"],
    "burning_urination": ["burning urination","painful urination","pain while urinating","burning while passing urine","dysuria"],
    "frequent_urination": ["frequent urination","urinating frequently","passing urine frequently","polyuria","pees often","need to urinate often","urinate often","go to the bathroom many times","bathroom many times","toilet many times","going to the bathroom frequently","urinate frequently","pass urine many times","many times to urinate","nocturia","especially at night to urinate"],
    "urgency": ["urgency","urgent need to urinate","cannot hold urine","urinary urgency","need to go urgently"],
    "blood_in_urine": ["blood in urine","red urine","hematuria"],
    "flank_pain": ["flank pain","side pain","loin pain"],
    "increased_thirst": ["increased thirst","excessive thirst","always thirsty","polydipsia","very thirsty","feeling very thirsty"],
    "increased_hunger": ["increased hunger","eating more","always hungry","polyphagia","feel hungry","hungry again"],
    "weight_loss": ["weight loss","losing weight","unintentional weight loss","lost weight","lost around","lost kg","lost 5 kg","lost 10 kg"],
    "weight_gain": ["weight gain","gaining weight"],
    "blurred_vision": ["blurred vision","blurry vision","unclear vision","vision becomes blurry","blurring of vision"],
    "palpitations": ["palpitations","heart racing","fast heartbeat","pounding heart"],
    "leg_swelling": ["leg swelling","swollen legs","pedal edema","ankle swelling"],
    "orthopnea": ["orthopnea","difficulty breathing while lying down","breathlessness lying flat","breathlessness lying down"],
    "heat_intolerance": ["heat intolerance","cannot tolerate heat","feels too hot"],
    "cold_intolerance": ["cold intolerance","cannot tolerate cold","feels too cold"],
    "hair_loss": ["hair loss","hair fall","losing hair"],
    "sleep_disturbance": ["sleep disturbance","poor sleep","insomnia","cannot sleep"],
    "persistent_low_mood": ["persistent low mood","feeling depressed","sad all the time","depression"],
    "night_sweats": ["night sweats"],
    "malaise": ["malaise","feeling unwell","generally unwell"],
    "joint_pain": ["joint pain","knee pain","finger pain","elbow pain","arthralgia","joints hurt","pain in joints","pain in my hands","pain in my knees","pain and swelling in my hands"],
    "muscle_pain": ["muscle pain","myalgia"],
    "back_pain": ["back pain","lumbar pain"],
    "right_upper_quadrant_pain": ["right upper quadrant pain","ruq pain","right upper stomach pain"],
    "pelvic_pain": ["pelvic pain","lower abdominal pain"],
    "bone_pain": ["bone pain"],
    "tooth_pain": ["tooth pain","dental pain","toothache"],
    "ear_pain": ["ear pain","earache","otalgia"],
    "retro_orbital_pain": ["pain behind eyes","retro orbital pain","eye socket pain"],
    "painful_menstruation": ["painful periods","dysmenorrhea","menstrual cramps","period pain"],
    "painful_intercourse": ["painful intercourse","dyspareunia","pain during sex"],
    "stiffness": ["stiffness","joint stiffness","joints feel stiff","feel stiff"],
    "morning_stiffness": ["morning stiffness","stiffness in morning","stiff in the morning","stiff after i wake up","stiffness after waking"],
    "limited_range_of_motion": ["restricted movement","limited movement","reduced mobility"],
    "gait_instability": ["difficulty walking","unsteady gait","balance problems"],
    "swelling": ["swelling","edema","swollen"],
    "joint_swelling": ["joint swelling","swollen joints","swelling in my hands","swelling in my knees"],
    "facial_swelling": ["facial swelling","swollen face"],
    "neck_swelling": ["neck swelling","enlarged neck","goiter"],
    "breast_lump": ["breast lump","breast mass"],
    "lump": ["lump","mass","nodule"],
    "painless_lymph_node_swelling": ["painless lymph node swelling","swollen lymph nodes without pain"],
    "lymph_node_swelling": ["swollen lymph nodes","enlarged lymph nodes"],
    "ascites": ["ascites","abdominal swelling","fluid in abdomen"],
    "chronic_cough": ["chronic cough","cough for months","cough for weeks","persistent cough"],
    "paroxysmal_nocturnal_dyspnea": ["pnd","breathless at night","sudden breathlessness at night"],
    "bloody_diarrhea": ["bloody diarrhea","blood in diarrhea"],
    "chronic_diarrhea": ["chronic diarrhea","diarrhea for months"],
    "blood_in_stool": ["blood in stool","hematochezia","bloody stool"],
    "black_stools": ["black stools","melena","tarry stools"],
    "jaundice": ["jaundice","yellowing of skin","yellow eyes"],
    "bloating": ["bloating","abdominal distension","abdominal bloating"],
    "straining": ["straining","straining during defecation"],
    "incomplete_evacuation": ["feeling of incomplete evacuation","incomplete bowel emptying"],
    "difficulty_swallowing": ["difficulty swallowing","dysphagia"],
    "rectal_bleeding": ["rectal bleeding","bleeding from rectum"],
    "weak_urine_stream": ["weak urine stream","poor flow"],
    "difficulty_urinating": ["difficulty urinating","straining to urinate"],
    "frequent_night_urination": ["frequent night urination","nocturia"],
    "decreased_urine": ["decreased urine","oliguria","reduced urine output"],
    "foamy_urine": ["foamy urine","frothy urine","bubbles in urine"],
    "tea_colored_urine": ["tea colored urine","dark urine","cola colored urine"],
    "numbness": ["numbness","loss of sensation","numb","numbness on right side","numbness on left side","right side numb","left side numb"],
    "tingling": ["tingling","pins and needles","paresthesia"],
    "slurred_speech": ["slurred speech","difficulty speaking","speech difficulty","can't speak properly"],
    "memory_loss": ["memory loss","forgetfulness"],
    "confusion": ["confusion","disorientation"],
    "vision_loss": ["loss of vision","vision loss","blind"],
    "tremors": ["tremors","shaking","hand shaking"],
    "facial_deviation": ["facial deviation","face drooping","facial droop","drooping face","side of face drooping","facial drooping"],
    "weakness_one_side": ["one sided weakness","weakness on one side","hemiparesis","arm weakness","right arm weakness","left arm weakness","right side weak","left side weak","weakness right side","weakness left side"],
    "drowsiness": ["drowsiness","sleepiness","lethargy"],
    "slow_speech": ["slow speech"],
    "rigidity": ["rigidity","muscle stiffness"],
    "hallucinations": ["hallucinations","seeing things","hearing voices"],
    "delusions": ["delusions","false beliefs","paranoia"],
    "disorganized_thinking": ["disorganized thinking","confused thoughts","racing thoughts"],
    "sweating": ["sweating","diaphoresis"],
    "anxiety": ["anxiety","nervousness","worry"],
    "loss_of_smell": ["loss of smell","cannot smell","can't smell","anosmia"],
    "loss_of_taste": ["loss of taste","cannot taste","can't taste","ageusia"],
    "irregular_menstrual_cycles": ["irregular menstrual cycles","irregular periods"],
    "hyperandrogenism": ["hyperandrogenism","excess androgen symptoms","hirsutism","acne"],
    "polycystic_ovaries_on_ultrasound": ["polycystic ovaries on ultrasound","pcos on ultrasound"],
    "polyuria": ["polyuria","excessive urination"],
    "elevated_blood_pressure": ["elevated blood pressure","high blood pressure","hypertension"],
    "missed_period": ["missed period","missed menstrual cycle","amennorrhea"],
    "sneezing": ["sneezing","sneeze","frequent sneezing"],
    "dehydration": ["dehydration","dehydrated","dry mouth","sunken eyes"],
    "acute_onset": ["sudden onset","started suddenly","acute onset","came on suddenly"],
    "high_fever": ["high fever","very high fever","high temperature","burning fever"],
    "night_symptoms": ["night symptoms","symptoms worse at night","night cough","wheezing at night","breathlessness at night"],
    "lower_abdominal_pain": ["lower abdominal pain","lower stomach pain","pain in lower abdomen","suprapubic pain"],
    "pain_radiating_to_left_arm": ["pain radiating to left arm","pain going to left arm","left arm pain with chest pain","chest pain spreading to left arm"],
    "bleeding": ["bleeding","bleeds easily","gum bleeding","nose bleeding","bleeding tendency"],
    "rash": ["rash","skin rash","red spots","red patches","skin eruptions","rashes on body"],
    "breathing_difficulty": ["difficulty breathing","breathless","shortness of breath"],
}

# =============================================================================
# DURATION PATTERNS  (unchanged)
# =============================================================================
DURATION_PATTERNS = [
    r"for\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)",
    r"since\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)\s+ago",
    r"past\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)",
    r"last\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)",
    r"(\d+)\s+(day|days|week|weeks|month|months|year|years)\s+history",
    r"persistent\s+for\s+(\d+)\s+(day|days|week|weeks|month|months)"
]

# =============================================================================
# DISEASE PATTERNS  (unchanged from your original)
# =============================================================================
DISEASE_PATTERNS = {
    "Viral Fever": {
        "required": ["fever"],
        "highly_specific": ["body_ache", "fatigue"],
        "supporting": ["headache", "chills", "muscle_pain", "loss_of_appetite"],
        "duration_rules": {"fever": {"max_days": 14}},
        "minimum_score": 7,
        "excludes": ["productive_cough", "burning_urination", "blood_in_stool", "hemoptysis"]
    },
    "Viral Upper Respiratory Infection": {
        "required": ["fever", "cough"],
        "highly_specific": ["runny_nose", "sore_throat"],
        "supporting": ["nasal_congestion", "fatigue", "sneezing", "chills"],
        "duration_rules": {"cough": {"max_days": 14}},
        "minimum_score": 10,
        "excludes": ["shortness_of_breath", "hemoptysis", "loss_of_smell", "loss_of_taste"]
    },
    "COVID-19": {
        "required": ["fever", "cough"],
        "highly_specific": ["loss_of_smell", "loss_of_taste"],
        "supporting": ["fatigue", "sore_throat", "shortness_of_breath", "body_ache", "headache"],
        "duration_rules": {"fever": {"max_days": 21}},
        "minimum_score": 12,
        "excludes": ["productive_cough"]
    },
    "Pneumonia": {
        "required": ["fever", "cough"],
        "minimum_required_match": 1,
        "highly_specific": ["productive_cough", "shortness_of_breath"],
        "supporting": ["chest_pain", "fatigue"],
        "minimum_score": 12
    },
    "Urinary Tract Infection": {
        "required": ["burning_urination"],
        "highly_specific": ["frequent_urination", "urgency"],
        "supporting": ["fever", "lower_abdominal_pain", "blood_in_urine", "flank_pain"],
        "duration_rules": {"burning_urination": {"max_days": 14}},
        "minimum_score": 10,
        "excludes": ["cough", "shortness_of_breath"]
    },
    "Diabetes Mellitus": {
        "required": ["frequent_urination", "increased_thirst"],
        "highly_specific": ["increased_hunger"],
        "supporting": ["weight_loss", "fatigue", "blurred_vision"],
        "duration_rules": {"frequent_urination": {"min_days": 30}},
        "minimum_score": 12,
        "excludes": ["acute_fever"]
    },
    "Asthma": {
        "required": ["wheezing", "shortness_of_breath"],
        "highly_specific": ["chest_tightness"],
        "supporting": ["dry_cough", "night_symptoms"],
        "duration_rules": {"shortness_of_breath": {"max_days": 30}},
        "minimum_score": 11,
        "excludes": ["high_fever", "hemoptysis", "productive_cough"]
    },
    "Acute Gastroenteritis": {
        "required": ["diarrhea"],
        "highly_specific": ["vomiting"],
        "supporting": ["abdominal_pain", "fever", "nausea", "dehydration"],
        "duration_rules": {"diarrhea": {"max_days": 14}},
        "minimum_score": 10,
        "excludes": ["blood_in_stool", "black_stools"]
    },
    "Migraine": {
        "required": ["headache"],
        "highly_specific": ["photophobia"],
        "supporting": ["nausea", "vomiting"],
        "duration_rules": {"headache": {"max_days": 7}},
        "minimum_score": 7,
        "excludes": ["fever", "slurred_speech"]
    },
    "Tuberculosis": {
        "required": ["cough"],
        "highly_specific": ["hemoptysis", "night_sweats"],
        "supporting": ["weight_loss", "fatigue", "fever", "loss_of_appetite"],
        "duration_rules": {"cough": {"min_days": 21}},
        "minimum_score": 10,
        "excludes": ["runny_nose", "acute_onset"]
    },
    "Meningitis": {
        "required": ["fever"],
        "highly_specific": ["photophobia"],
        "supporting": ["headache", "confusion", "vomiting"],
        "minimum_score": 10,
        "excludes": []
    },
    "Dengue Fever": {
        "required": ["fever", "severe_headache"],
        "highly_specific": ["retro_orbital_pain", "joint_pain"],
        "supporting": ["muscle_pain", "rash", "bleeding"],
        "minimum_score": 10,
        "excludes": []
    },
    "Hepatitis": {
        "required": ["jaundice"],
        "highly_specific": ["right_upper_quadrant_pain"],
        "supporting": ["fatigue", "nausea", "loss_of_appetite", "fever"],
        "minimum_score": 8,
        "excludes": []
    },
    "Myocardial Infarction": {
        "required": ["chest_pain"],
        "highly_specific": ["pain_radiating_to_left_arm", "sweating"],
        "supporting": ["shortness_of_breath", "nausea"],
        "minimum_score": 12
    },
    "Congestive Heart Failure": {
        "required": ["shortness_of_breath"],
        "highly_specific": ["orthopnea", "paroxysmal_nocturnal_dyspnea"],
        "supporting": ["leg_swelling", "fatigue"],
        "minimum_score": 10,
        "excludes": []
    },
    "Arrhythmia": {
        "required": ["palpitations"],
        "supporting": ["dizziness", "loss_of_consciousness", "chest_pain"],
        "minimum_score": 8,
        "excludes": []
    },
    "Hypertension": {
        "required": ["elevated_blood_pressure"],
        "supporting": ["headache", "dizziness"],
        "minimum_score": 6
    },
    "Stroke": {
        "required": ["slurred_speech"],
        "highly_specific": ["facial_deviation", "weakness_one_side"],
        "supporting": ["numbness", "dizziness", "confusion", "headache"],
        "minimum_score": 10,
        "excludes": []
    },
    "Epilepsy": {
        "required": ["seizure"],
        "supporting": ["loss_of_consciousness", "confusion"],
        "minimum_score": 6,
        "excludes": []
    },
    "Parkinsons Disease": {
        "required": ["tremors"],
        "highly_specific": ["rigidity", "gait_instability"],
        "supporting": ["slow_speech"],
        "minimum_score": 10,
        "excludes": []
    },
    "Alzheimers Disease": {
        "required": ["memory_loss"],
        "supporting": ["confusion", "gait_instability"],
        "minimum_score": 6,
        "excludes": []
    },
    "Hypothyroidism": {
        "required": ["cold_intolerance"],
        "highly_specific": ["weight_gain"],
        "supporting": ["fatigue", "hair_loss", "constipation"],
        "minimum_score": 8,
        "excludes": ["heat_intolerance"]
    },
    "Hyperthyroidism": {
        "required": ["heat_intolerance"],
        "highly_specific": ["weight_loss", "tremors"],
        "supporting": ["palpitations", "anxiety", "increased_hunger"],
        "minimum_score": 9,
        "excludes": ["cold_intolerance"]
    },
    "Goitre": {
        "required": ["neck_swelling"],
        "supporting": ["difficulty_swallowing"],
        "minimum_score": 6,
        "excludes": []
    },
    "Rheumatoid Arthritis": {
        "required": ["joint_pain"],
        "highly_specific": ["morning_stiffness", "joint_swelling"],
        "supporting": ["fatigue", "stiffness"],
        "minimum_score": 10,
        "excludes": []
    },
    "Osteoarthritis": {
        "required": ["joint_pain"],
        "supporting": ["stiffness", "limited_range_of_motion"],
        "minimum_score": 7,
        "excludes": ["morning_stiffness"]
    },
    "Ankylosing Spondylitis": {
        "required": ["back_pain"],
        "highly_specific": ["morning_stiffness"],
        "supporting": ["limited_range_of_motion"],
        "minimum_score": 9,
        "excludes": []
    },
    "COPD": {
        "required": ["chronic_cough", "shortness_of_breath"],
        "supporting": ["wheezing"],
        "minimum_score": 10,
        "excludes": ["acute_onset"]
    },
    "Chronic Kidney Disease": {
        "required": ["fatigue"],
        "supporting": ["leg_swelling", "blood_in_urine", "decreased_urine"],
        "minimum_score": 8,
        "excludes": []
    },
    "Depression": {
        "required": ["persistent_low_mood"],
        "supporting": ["sleep_disturbance", "fatigue"],
        "minimum_score": 6,
        "excludes": []
    },
    "Anxiety Disorder": {
        "required": ["anxiety"],
        "supporting": ["palpitations", "sleep_disturbance"],
        "minimum_score": 6,
        "excludes": []
    },
    "Lung Cancer": {
        "required": ["chronic_cough"],
        "highly_specific": ["hemoptysis"],
        "supporting": ["weight_loss", "shortness_of_breath", "chest_pain"],
        "minimum_score": 11,
        "excludes": []
    },
    "Colorectal Cancer": {
        "required": ["blood_in_stool"],
        "supporting": ["weight_loss", "abdominal_pain", "constipation"],
        "minimum_score": 8,
        "excludes": []
    },
    "PCOS": {
        "required": ["irregular_menstrual_cycles", "hyperandrogenism"],
        "highly_specific": ["polycystic_ovaries_on_ultrasound"],
        "supporting": ["weight_gain"],
        "minimum_score": 10,
        "excludes": []
    },
    "Pregnancy": {
        "required": ["missed_period"],
        "supporting": ["nausea"],
        "minimum_score": 6,
        "excludes": []
    },
}

def _normalize_block(text: str) -> str:
    """Lowercase and collapse whitespace. Keep apostrophes for negation words."""
    text = text.lower()

    text = re.sub(r"[^\w\s']", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()



_NEGATIONS = [
    "no", "not", "without", "denies", "deny",
    "dont", "don't", "doesnt", "doesn't", "never"
]
_NEG_OR       = '|'.join(re.escape(n) for n in _NEGATIONS)
# negation comes BEFORE symptom  ("no fever", "denies cough")
_NEG_BEFORE   = r'\b(?:{neg})\b\s+(?:\w+\s+){{0,8}}?{kw}'
# negation comes AFTER symptom   ("fever? no", "cough — denies")
_NEG_AFTER    = r'{kw}[\w\s]{{0,30}}?\b(?:{neg})\b'

_BARE_NEG_RE  = re.compile(
    r'^(?:' + _NEG_OR + r')[\s\w]{0,15}?$',
    re.IGNORECASE
)
_RESPONSE_RE  = re.compile(
    r'^(yes|no|yeah|nope|i |my |doctor|not|never|actually)',
    re.IGNORECASE
)
_LABEL_RE     = re.compile(
    r'(patient|doctor|dr|pt)\s*[:\-]\s*',
    re.IGNORECASE
)

def _split_into_patient_blocks(raw_text: str) -> list[str]:
    """
    Three-tier format detector that works on the ORIGINAL text
    (before any punctuation stripping) so structural markers survive.

    Tier 1 — Labelled turns    : "Doctor: ...  Patient: ..."
    Tier 2 — Inline Q+A        : "Any fever? Yes doctor, ..."
    Tier 3 — Plain / unlabelled: sentence-level heuristics
    """

    # ------------------------------------------------------------------
    # TIER 1: explicit speaker labels
    # ------------------------------------------------------------------
    if _LABEL_RE.search(raw_text):
        parts  = _LABEL_RE.split(raw_text)
        blocks = []
        i = 1
        while i < len(parts) - 1:
            speaker   = parts[i].strip().lower()
            utterance = parts[i + 1].strip()

            if speaker in ('doctor', 'dr'):
       
                next_i = i + 2
                if next_i < len(parts) - 1:
                    next_speaker   = parts[next_i].strip().lower()
                    next_utterance = parts[next_i + 1].strip()
                    if next_speaker not in ('doctor', 'dr'):
                        norm_next = _normalize_block(next_utterance)
                        if _BARE_NEG_RE.match(norm_next):
                          
                            blocks.append('no ' + utterance)
            else:
                norm = _normalize_block(utterance)
                if not _BARE_NEG_RE.match(norm):
                    blocks.append(utterance)

            i += 2
        return blocks


    inline_qa = re.compile(r'\?[^?]{0,80}?(yes|no|yeah|nope)\b', re.IGNORECASE)
    if inline_qa.search(raw_text):
        blocks         = []
        carry_negation = False
        chunks         = re.split(r'\?', raw_text)

        for idx, chunk in enumerate(chunks):
            chunk = chunk.strip()
            if not chunk:
                continue

            
            sub_sentences = re.split(r'(?<=[.!\n])\s+', chunk)
            sub_sentences = [s.strip() for s in sub_sentences if s.strip()]

            doctor_fragment = []  
            for sub in sub_sentences:
                if _RESPONSE_RE.match(sub):
                    if _BARE_NEG_RE.match(sub):
                        
                        if doctor_fragment:
                            blocks.append('no ' + ' '.join(doctor_fragment))
                        carry_negation = True
                        continue
                    if carry_negation:
                        sub = 'no ' + sub
                        carry_negation = False
                    blocks.append(sub)
                    doctor_fragment = []
                else:
                    
                    doctor_fragment.append(sub)
                    carry_negation = False

        return blocks

    blocks         = []
    carry_negation = False
    prev_question  = ''
    sentences      = re.split(r'(?<=[.!?\n])\s+', raw_text)

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        if sentence.endswith('?'):
            prev_question  = sentence.rstrip('?')
            carry_negation = False
            continue

        if _BARE_NEG_RE.match(sentence):
            
            if prev_question:
                blocks.append('no ' + prev_question)
            carry_negation = True
            prev_question  = ''
            continue

        if carry_negation:
            sentence       = 'no ' + sentence
            carry_negation = False

        blocks.append(sentence)
        prev_question = ''

    return blocks


def _extract_from_block(block: str, present: set, absent: set) -> None:
    """
    Mutates `present` and `absent` sets in-place.
    `block` must already be normalized (_normalize_block applied).
    """
    for canonical, keywords in SYMPTOM_MAP.items():
        found_positive = False
        found_negative = False

       
        for keyword in sorted(keywords, key=len, reverse=True):
            kw_pat = r'\b' + re.escape(keyword.lower()) + r'\b'

            if not re.search(kw_pat, block):
                continue

            negated = bool(
                re.search(_NEG_BEFORE.format(neg=_NEG_OR, kw=kw_pat), block) or
                re.search(_NEG_AFTER.format(kw=kw_pat,   neg=_NEG_OR), block)
            )

            if negated:
                found_negative = True
            else:
                found_positive = True
                break   

        
        if found_positive:
            present.add(canonical)
        elif found_negative:
            absent.add(canonical)



def extract_symptoms(raw_text: str) -> tuple[list, list]:
    """
    Main entry point.
    Accepts the ORIGINAL transcript (punctuation intact).
    Returns (symptoms_present, symptoms_absent).
    """
    blocks = _split_into_patient_blocks(raw_text)
   
    if not blocks:
        blocks = [raw_text]

    present: set = set()
    absent:  set = set()

    for block in blocks:
        normalized = _normalize_block(block)
        if normalized:
            _extract_from_block(normalized, present, absent)

    absent -= present

    return list(present), list(absent)

def convert_to_days(value: str | int, unit: str) -> int:
    value = int(value)
    unit  = unit.lower()
    if "day"   in unit: return value
    if "week"  in unit: return value * 7
    if "month" in unit: return value * 30
    if "year"  in unit: return value * 365
    return value


def classify_duration(days: int) -> str:
    if days <= 7:  return "acute"
    if days <= 30: return "subacute"
    return "chronic"


def extract_duration(text: str) -> list[dict]:
    text      = text.lower()
    durations = []
    for pattern in DURATION_PATTERNS:
        for value, unit in re.findall(pattern, text):
            days = convert_to_days(value, unit)
            durations.append({
                "value":    int(value),
                "unit":     unit,
                "days":     days,
                "category": classify_duration(days)
            })
    return durations


def extract_symptom_duration(text: str, symptoms_present: list) -> dict:
    """
    For each present symptom, look for a duration phrase near it in the text.
    Also does a global duration search as fallback.
    """
    lower_text       = text.lower()
    symptom_durations = {}

    for symptom in symptoms_present:
        symptom_text = symptom.replace("_", " ")
        pattern      = (
            rf"\b{re.escape(symptom_text)}\b"
            rf".{{0,60}}?"
            rf"(?:for|since|past|last)\s+(\d+)\s+"
            rf"(day|days|week|weeks|month|months|year|years)"
        )
        match = re.search(pattern, lower_text)
        if match:
            value, unit = match.groups()
            days = convert_to_days(value, unit)
            symptom_durations[symptom] = {
                "value":    int(value),
                "unit":     unit,
                "days":     days,
                "category": classify_duration(days)
            }

    if not symptom_durations:
        global_durations = extract_duration(text)
        if global_durations:
            best = global_durations[0]
            for symptom in symptoms_present:
                symptom_durations[symptom] = best

    return symptom_durations

def extract_pmh(raw_text: str) -> list[str]:
    """
    Works on the original text (lowercased only, punctuation kept)
    so negation context ("no diabetes", "no history of hypertension") works.
    """
    text = raw_text.lower()

    CHRONIC_CONDITIONS = {
        "diabetes":            "Diabetes mellitus",
        "dm":                  "Diabetes mellitus",
        "sugar":               "Diabetes mellitus",
        "hypertension":        "Hypertension",
        "htn":                 "Hypertension",
        "high blood pressure": "Hypertension",
        "asthma":              "Bronchial asthma",
        "copd":                "Chronic obstructive pulmonary disease",
        "heart disease":       "Ischemic heart disease",
        "cardiac":             "Ischemic heart disease",
        "kidney disease":      "Chronic kidney disease",
        "ckd":                 "Chronic kidney disease",
        "thyroid":             "Thyroid disorder",
        "stroke":              "Cerebrovascular accident",
        "epilepsy":            "Seizure disorder",
    }

    PMH_NEGATIONS = ["no", "not", "without", "denies", "never", "no history", "no known"]

    pmh = []

    for keyword, condition in CHRONIC_CONDITIONS.items():
        pattern = r'\b' + re.escape(keyword) + r'\b'
        for match in re.finditer(pattern, text):
            # Look back up to 60 chars for a negation
            start   = max(0, match.start() - 60)
            context = text[start:match.start()]
            negated = any(
                re.search(r'\b' + re.escape(neg) + r'\b', context)
                for neg in PMH_NEGATIONS
            )
            if not negated and condition not in pmh:
                pmh.append(condition)

    return pmh if pmh else ["None reported"]

def diagnose_differential(
    symptoms_present: list,
    symptoms_absent:  list,
    symptom_durations: dict | None = None
) -> list[tuple[str, float]]:

    symptom_durations = symptom_durations or {}
    present_set       = set(symptoms_present)
    absent_set        = set(symptoms_absent)
    scores: dict      = {}

    for disease, pattern in DISEASE_PATTERNS.items():

        excludes = pattern.get("excludes", [])
        if any(s in present_set for s in excludes):
            continue

        required         = pattern.get("required", [])
        minimum_required = pattern.get("minimum_required_match", len(required))
        required_matches = sum(1 for s in required if s in present_set)

        if required_matches < minimum_required:
            continue

        score = required_matches * 4

        highly_specific  = pattern.get("highly_specific", [])
        specific_matches = sum(1 for s in highly_specific if s in present_set)
        score           += specific_matches * 5
        if highly_specific and specific_matches == 0:
            score -= 3

        supporting         = pattern.get("supporting", [])
        supporting_matches = sum(1 for s in supporting if s in present_set)
        score             += supporting_matches * 2

        # Duration scoring
        for symptom, rules in pattern.get("duration_rules", {}).items():
            if symptom not in symptom_durations:
                continue
            days = symptom_durations[symptom]["days"]
            if "min_days" in rules:
                score += 5 if days >= rules["min_days"] else -3
            if "max_days" in rules:
                score += 3 if days <= rules["max_days"] else -5

        total_matches = required_matches + specific_matches + supporting_matches
        if total_matches <= 1:
            score -= 5

        # Bonus: excluded symptoms confirmed absent
        score += sum(1 for s in excludes if s in absent_set)

        minimum_score = pattern.get("minimum_score", 8)
        if score >= minimum_score:
            scores[disease] = score

    if not scores:
        return [("Undifferentiated clinical condition", 0.0)]

    sorted_diagnoses = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    max_score        = sorted_diagnoses[0][1]

    results = []
    for disease, score in sorted_diagnoses[:3]:
        confidence = min(round((score / max_score) * 100, 1), 95.0)
        results.append((disease, confidence))

    return results


def determine_chief_complaint(symptoms_present: list, raw_text: str) -> str:
    """
    Returns the most clinically urgent symptom, or the first-mentioned one.
    Uses the raw transcript to detect what was said first.
    """
    PRIORITY = [
        "chest_pain", "shortness_of_breath", "loss_of_consciousness",
        "seizure", "severe_headache", "facial_deviation", "weakness_one_side",
        "hemoptysis", "slurred_speech"
    ]

    present_set = set(symptoms_present)

    for symptom in PRIORITY:
        if symptom in present_set:
            return symptom.replace("_", " ").title()
 
    lower_text   = raw_text.lower()
    earliest     = None
    earliest_pos = len(lower_text) + 1

    for symptom in symptoms_present:
        for keyword in SYMPTOM_MAP.get(symptom, []):
            pos = lower_text.find(keyword.lower())
            if 0 <= pos < earliest_pos:
                earliest_pos = pos
                earliest     = symptom

    if earliest:
        return earliest.replace("_", " ").title()

    return "Not specified"


def validate_symptom_definitions():
    all_pattern_symptoms = set()
    for pattern in DISEASE_PATTERNS.values():
        for val in pattern.values():
            if isinstance(val, list):
                all_pattern_symptoms.update(val)

    missing = all_pattern_symptoms - set(SYMPTOM_MAP.keys())
    if missing:
        print("\nSymptoms referenced in DISEASE_PATTERNS but missing from SYMPTOM_MAP:\n")
        for s in sorted(missing):
            print(f"  - {s}")
    else:
        print("All symptom definitions are complete.")


def summarize_to_crt(raw_text: str) -> str:
    """
    Accepts the ORIGINAL transcript text (punctuation intact).
    All functions receive raw_text — preprocessing happens internally
    only where needed.
    """

    symptoms_present, symptoms_absent = extract_symptoms(raw_text)
    symptom_durations  = extract_symptom_duration(raw_text, symptoms_present)
    pmh                = extract_pmh(raw_text)
    chief_complaint    = determine_chief_complaint(symptoms_present, raw_text)
    differential       = diagnose_differential(symptoms_present, symptoms_absent, symptom_durations)
    primary_diagnosis  = differential[0][0]

    duration_text = [
        f"{s.replace('_', ' ')} for {d['value']} {d['unit']} ({d['category']})"
        for s, d in symptom_durations.items()
    ]

    dd_text = "\n".join(
        f"   {i+1}. {disease} (Confidence: {conf:.1f}%)"
        for i, (disease, conf) in enumerate(differential)
    )

    present_str = ", ".join(symptoms_present)  if symptoms_present else "None"
    absent_str  = ", ".join(symptoms_absent)   if symptoms_absent  else "None"
    dur_str     = "\n- ".join(duration_text)   if duration_text    else "Not specified"
    pmh_str     = ", ".join(pmh)

    summary = f"""
1. CHIEF COMPLAINT:
   {chief_complaint}

2. PRESENT ILLNESS:
   Symptoms Present:
   {present_str}
   Symptoms Absent:
   {absent_str}

3. SYMPTOM DURATION:
   {dur_str}

4. PAST MEDICAL HISTORY:
   {pmh_str}

5. PRIMARY CLINICAL IMPRESSION:
   {primary_diagnosis}

6. DIFFERENTIAL DIAGNOSIS:
   {dd_text}
   """.strip()

    return summary
