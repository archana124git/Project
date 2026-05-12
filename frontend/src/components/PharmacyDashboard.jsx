import React, { useEffect, useState } from "react";
import {
  Package, LogOut, Search, Calendar, Activity, Shield,
  Clock, Pill, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, BellRing, Send, X,
} from "lucide-react";
import supabase from "../supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --accent:#0d9488; --accent-dark:#0f766e; --accent-glow:rgba(13,148,136,0.18);
    --surface:#ffffff; --surface-2:#f0fdfa; --surface-3:#ccfbf1; --border:#d1fae5;
    --text-primary:#0f172a; --text-secondary:#374151; --text-muted:#5eaba0;
    --orange:#f97316; --orange-bg:#fff7ed; --orange-bdr:#fed7aa;
    --red:#ef4444; --red-bg:#fef2f2; --red-bdr:#fecaca;
    --green:#10b981; --green-bg:#ecfdf5;
    --amber-bg:#fffbeb;
    --purple:#8b5cf6; --purple-bg:#f5f3ff; --purple-bdr:#ddd6fe;
    --blue-bg:#eff6ff; --blue-bdr:#bfdbfe;
    --radius-xs:4px; --radius-sm:8px; --radius:12px; --radius-lg:16px;
    --shadow-sm:0 1px 3px rgba(13,148,136,0.08),0 1px 2px rgba(0,0,0,0.04);
    --shadow:0 4px 16px rgba(13,148,136,0.12),0 1px 4px rgba(0,0,0,0.04);
    --shadow-modal:0 24px 64px rgba(0,0,0,0.18);
    --font:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
    --ease:160ms cubic-bezier(.4,0,.2,1);
  }
  body { font-family:var(--font); background:var(--surface-2); color:var(--text-primary); }
  .pd-root { min-height:100vh; }

  /* Header */
  .pd-header { background:linear-gradient(135deg,#0d9488 0%,#10b981 100%); position:sticky; top:0; z-index:40; box-shadow:0 2px 20px rgba(13,148,136,0.30); }
  .pd-header-inner { max-width:1280px; margin:0 auto; padding:0 32px; height:64px; display:flex; align-items:center; justify-content:space-between; }
  .pd-logo { display:flex; align-items:center; gap:12px; }
  .pd-logo-icon { width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,0.22); border:1px solid rgba(255,255,255,0.35); display:flex; align-items:center; justify-content:center; }
  .pd-logo-text { font-size:17px; font-weight:700; color:#fff; letter-spacing:-0.3px; }
  .pd-logout-btn { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.22); color:rgba(255,255,255,0.85); font-family:var(--font); font-size:13px; font-weight:500; padding:8px 18px; border-radius:var(--radius-sm); cursor:pointer; transition:all var(--ease); }
  .pd-logout-btn:hover { background:rgba(255,255,255,0.24); color:#fff; }
  .pd-order-btn { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid rgba(255,255,255,0.5); color:#0d9488; font-family:var(--font); font-size:13px; font-weight:600; padding:8px 18px; border-radius:var(--radius-sm); cursor:pointer; transition:all var(--ease); }
  .pd-order-btn:hover { background:#f0fdfa; box-shadow:0 2px 8px rgba(0,0,0,0.10); }
  .pd-header-actions { display:flex; align-items:center; gap:10px; }

  /* Page */
  .pd-main { max-width:1280px; margin:0 auto; padding:32px; display:flex; flex-direction:column; gap:24px; }
  .pd-label { font-size:11px; font-weight:600; letter-spacing:1.1px; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; }

  /* Stat cards */
  .pd-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .pd-stat { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px 22px; box-shadow:var(--shadow-sm); position:relative; overflow:hidden; display:flex; flex-direction:column; gap:14px; transition:box-shadow var(--ease),transform var(--ease); }
  .pd-stat:hover { box-shadow:var(--shadow); transform:translateY(-2px); }
  .pd-stat-stripe { position:absolute; top:0; left:0; right:0; height:3px; border-radius:var(--radius) var(--radius) 0 0; }
  .pd-stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .pd-stat-label { font-size:12px; font-weight:500; color:var(--text-muted); margin-bottom:2px; }
  .pd-stat-value { font-size:30px; font-weight:700; letter-spacing:-1px; color:var(--text-primary); line-height:1; }

  /* Card */
  .pd-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); overflow:hidden; }
  .pd-card-head { padding:18px 22px 0; display:flex; align-items:center; gap:10px; }
  .pd-card-head-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pd-card-title { font-size:14px; font-weight:600; color:var(--text-primary); }
  .pd-card-subtitle { font-size:12.5px; color:var(--text-muted); margin-top:1px; }
  .pd-card-body { padding:16px 22px 22px; }

  /* Alert items */
  .pd-alert-list { display:flex; flex-direction:column; gap:8px; }
  .pd-alert-item { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:var(--radius-sm); border:1px solid transparent; transition:transform var(--ease),opacity 0.3s ease; }
  .pd-alert-item:hover { transform:translateX(3px); }
  .pd-alert-item.orange { background:var(--orange-bg); border-color:var(--orange-bdr); }
  .pd-alert-item.removing { opacity:0; transform:translateX(40px) scale(0.97); }
  .pd-alert-name { font-size:13.5px; font-weight:600; color:var(--text-primary); }
  .pd-alert-date { font-size:12px; color:var(--text-muted); margin-top:2px; }

  /* Empty */
  .pd-empty { padding:32px 16px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--text-muted); font-size:13px; }

  /* Controls */
  .pd-controls { display:flex; align-items:center; gap:10px; padding:18px 22px 14px; border-bottom:1px solid var(--border); }
  .pd-search-wrap { position:relative; flex:1; max-width:260px; }
  .pd-input-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
  .pd-input { width:100%; padding:8px 12px 8px 34px; border:1px solid var(--border); border-radius:var(--radius-sm); font-family:var(--font); font-size:13px; color:var(--text-primary); background:var(--surface-2); outline:none; transition:border-color var(--ease),box-shadow var(--ease); }
  .pd-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-glow); background:var(--surface); }
  .pd-count-pill { margin-left:auto; font-size:12px; color:var(--text-muted); background:var(--surface-3); padding:4px 12px; border-radius:20px; white-space:nowrap; }

  /* Table */
  .pd-table-wrap { overflow-x:auto; }
  .pd-table { width:100%; border-collapse:collapse; font-size:13.5px; }
  .pd-table th { background:var(--surface-2); padding:10px 16px; text-align:left; font-size:11px; font-weight:600; letter-spacing:0.7px; text-transform:uppercase; color:var(--accent); border-bottom:1px solid var(--border); white-space:nowrap; }
  .pd-table td { padding:14px 16px; border-bottom:1px solid var(--border); vertical-align:top; color:var(--text-secondary); }
  .pd-table tr:last-child td { border-bottom:none; }
  .pd-table tbody tr:hover td { background:var(--surface-2); }
  .pd-pid { font-family:var(--mono); font-size:12px; font-weight:500; background:var(--surface-3); color:var(--accent-dark); padding:3px 8px; border-radius:var(--radius-xs); display:inline-block; }

  /* Badges */
  .badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:600; white-space:nowrap; }
  .badge-teal   { background:var(--surface-3); color:var(--accent-dark); }
  .badge-green  { background:var(--green-bg);  color:#059669; }
  .badge-red    { background:var(--red-bg);    color:#dc2626; }
  .badge-gray   { background:#f1f5f9;          color:#64748b; }
  .badge-orange { background:var(--amber-bg);  color:#d97706; }
  .badge-purple { background:var(--purple-bg); color:#7c3aed; }

  /* Medicine cells */
  .pd-med-list { display:flex; flex-direction:column; gap:7px; }
  .pd-med-item { padding:8px 10px; border-radius:var(--radius-sm); background:var(--surface-2); border:1px solid var(--border); }
  .pd-med-name { font-weight:600; font-size:13px; color:var(--text-primary); }
  .pd-med-meta { font-size:11.5px; color:var(--text-muted); margin-top:3px; }
  .pd-med-warn { color:var(--red); font-weight:600; }

  /* Restock button */
  .restock-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:var(--radius-sm); background:var(--purple-bg); border:1px solid var(--purple-bdr); color:#7c3aed; font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all var(--ease); white-space:nowrap; flex-shrink:0; }
  .restock-btn:hover:not(:disabled) { background:#ede9fe; border-color:#c4b5fd; }
  .restock-btn:disabled { opacity:0.6; cursor:not-allowed; }

  /* Modal */
  .modal-overlay { position:fixed; inset:0; z-index:100; background:rgba(15,23,42,0.45); display:flex; align-items:center; justify-content:center; animation:fadeIn 0.18s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal { background:var(--surface); border-radius:var(--radius-lg); box-shadow:var(--shadow-modal); width:100%; max-width:480px; max-height:calc(100vh - 48px); margin:24px; animation:scaleIn 0.2s cubic-bezier(.34,1.56,.64,1); overflow:hidden; display:flex; flex-direction:column; }
  .modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:14px; overflow-y:auto; flex:1; }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  .modal-header { padding:22px 24px 18px; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .modal-icon { width:42px; height:42px; border-radius:11px; background:var(--purple-bg); border:1px solid var(--purple-bdr); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .modal-title { font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:3px; }
  .modal-sub   { font-size:13px; color:var(--text-muted); }
  .modal-close { width:30px; height:30px; border-radius:8px; border:1px solid var(--border); background:var(--surface-2); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-muted); flex-shrink:0; transition:all var(--ease); }
  .modal-close:hover { background:var(--red-bg); border-color:var(--red-bdr); color:var(--red); }
  .msg-preview { background:var(--blue-bg); border:1px solid var(--blue-bdr); border-radius:var(--radius-sm); padding:16px; font-size:13.5px; line-height:1.7; color:#1e40af; white-space:pre-line; }
  .msg-preview-label { font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#3b82f6; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .info-item { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 12px; }
  .info-item-label { font-size:11px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px; }
  .info-item-value { font-size:13px; font-weight:600; color:var(--text-primary); }
  .modal-footer { padding:16px 24px 22px; display:flex; gap:10px; justify-content:flex-end; }
  .btn { display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border-radius:var(--radius-sm); font-family:var(--font); font-size:13.5px; font-weight:600; cursor:pointer; transition:all var(--ease); border:1px solid transparent; }
  .btn-cancel  { background:var(--surface-2); border-color:var(--border); color:var(--text-secondary); }
  .btn-cancel:hover { background:#f1f5f9; }
  .btn-confirm { background:linear-gradient(135deg,#8b5cf6,#7c3aed); color:#fff; box-shadow:0 2px 8px rgba(139,92,246,0.3); }
  .btn-confirm:hover:not(:disabled) { background:linear-gradient(135deg,#7c3aed,#6d28d9); }
  .btn-confirm:disabled { opacity:0.6; cursor:not-allowed; }
  .btn-done { background:linear-gradient(135deg,#0d9488,#10b981); color:#fff; width:100%; justify-content:center; }
  .btn-done:hover { background:linear-gradient(135deg,#0f766e,#059669); }

  /* Success modal */
  .success-modal { text-align:center; padding:40px 32px; display:flex; flex-direction:column; align-items:center; gap:16px; }
  .success-icon { width:68px; height:68px; border-radius:50%; background:var(--green-bg); border:2px solid #a7f3d0; display:flex; align-items:center; justify-content:center; animation:popIn 0.35s cubic-bezier(.34,1.56,.64,1); }
  @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
  .success-title { font-size:18px; font-weight:700; color:var(--text-primary); }
  .success-sub   { font-size:13.5px; color:var(--text-muted); line-height:1.6; max-width:320px; }
  .success-details { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px 18px; width:100%; text-align:left; font-size:13px; color:var(--text-secondary); line-height:2; }

  /* Toast */
  .pd-toast { position:fixed; bottom:28px; right:28px; z-index:9999; background:#1e293b; color:#fff; font-size:13px; font-weight:500; padding:12px 20px; border-radius:var(--radius-sm); box-shadow:0 8px 24px rgba(0,0,0,0.18); display:flex; align-items:center; gap:10px; animation:slideUp 0.25s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  /* Qty selector */
  .qty-selector { display:flex; flex-direction:column; gap:10px; }
  .qty-selector-label { font-size:11px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-muted); }
  .qty-presets { display:flex; gap:8px; flex-wrap:wrap; }
  .qty-chip { padding:7px 18px; border-radius:var(--radius-sm); border:1.5px solid var(--border); background:var(--surface-2); color:var(--text-secondary); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all var(--ease); }
  .qty-chip:hover { border-color:#c4b5fd; background:var(--purple-bg); color:#7c3aed; }
  .qty-chip.active { border-color:#8b5cf6; background:var(--purple-bg); color:#7c3aed; box-shadow:0 0 0 3px rgba(139,92,246,0.12); }
  .qty-custom-wrap { display:flex; align-items:center; gap:10px; }
  .qty-custom-input { width:120px; padding:8px 12px; border:1.5px solid var(--border); border-radius:var(--radius-sm); font-family:var(--font); font-size:13px; font-weight:600; color:var(--text-primary); background:var(--surface-2); outline:none; transition:border-color var(--ease),box-shadow var(--ease); }
  .qty-custom-input:focus { border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,0.12); background:var(--surface); }
  .qty-custom-input.active { border-color:#8b5cf6; background:var(--surface); }
  .qty-custom-label { font-size:13px; color:var(--text-muted); }

  /* Loading */
  .pd-loading { display:flex; align-items:center; justify-content:center; padding:56px; gap:10px; color:var(--text-muted); font-size:14px; }
  .pd-spinner { width:20px; height:20px; border-radius:50%; border:2px solid var(--border); border-top-color:var(--accent); animation:spin 0.7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

const PRESET_QTYS = [25, 50, 100, 200];

function getMfgDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().split("T")[0];
}
function getNewExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setMonth(d.getMonth() + 5);
  return d.toISOString().split("T")[0];
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function getQty(item) {
  return item?.quantity ?? item?.stock ?? item?.available_quantity ?? item?.stock_quantity ?? 0;
}

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedDate, setSelectedDate]   = useState(new Date().toISOString().split("T")[0]);
  const [searchText, setSearchText]       = useState("");
  const [toast, setToast]                 = useState(null);

  // Modal state
  const [confirmItem, setConfirmItem]   = useState(null);
  const [restockQty, setRestockQty]     = useState(50);
  const [customQty, setCustomQty]       = useState("");
  const [useCustom, setUseCustom]       = useState(false);
  const [processing, setProcessing]     = useState(false);
  const [successItem, setSuccessItem]   = useState(null);

  // Track IDs being animated out of list
  const [removingIds, setRemovingIds]   = useState(new Set());

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const formatDate = d => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt) ? null : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatAvailability = v => {
    if (!v) return "Unknown";
    const s = String(v).trim();
    return s ? s[0].toUpperCase() + s.slice(1) : "Unknown";
  };
  const getExpiry = i => i.expires_at || i.expiration_date || i.expiry_date || i.expiryDate || i.expirationDate || null;

  const toDateStr = value => {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const getTodayStr    = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const getIn30DaysStr = () => { const d = new Date(); d.setDate(d.getDate()+30); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

  const isExpired         = d => { const s = toDateStr(d); return !!s && s < getTodayStr(); };
  const isWithinNextMonth = d => { const s = toDateStr(d); if (!s) return false; return s >= getTodayStr() && s <= getIn30DaysStr(); };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/", { replace: true }); };
  useEffect(() => { fetchPrescriptions(selectedDate); fetchInventory(); }, [selectedDate]);

  async function fetchInventory() {
  try {

    // ===== TOTAL MEDICINE COUNT =====
    const { count: totalCount, error: countError } = await supabase
      .from("medicine")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    setTotalMedicines(totalCount || 0);

    // ===== EXPIRING MEDICINES ONLY =====
    const today = getTodayStr();
    const next30 = getIn30DaysStr();

    const { data: expiringData, error: expiringError } = await supabase
      .from("medicine")
      .select("*")
      .gte("expiry_date", today)
      .lte("expiry_date", next30)
      .order("expiry_date", { ascending: true });

    if (expiringError) throw expiringError;

    setExpiringSoon(expiringData || []);

  } catch (err) {
    console.error("Inventory fetch failed:", err);
    showToast(`❌ ${err.message}`);
  }
}

  async function fetchPrescriptions(date) {
    setLoading(true);
    try {
      const { data: presData, error: presError } = await supabase
        .from("prescriptions").select("prescription_id, patient_id, created_at, dispatch_status")
        .gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`)
        .order("created_at", { ascending: false });
      if (presError) throw presError;
      if (!presData?.length) { setPrescriptions([]); setLoading(false); return; }

      const patientIds = [...new Set(presData.map(p => p.patient_id))];
      const token = localStorage.getItem("token");
      let patientData = [];
      try {
        const res = await axios.get("http://localhost:5000/patients", { headers: { Authorization: `Bearer ${token}` } });
        patientData = (res.data?.patients || []).filter(p => patientIds.includes(p.patient_id));
      } catch {
        const { data, error } = await supabase.from("patients").select("*").in("patient_id", patientIds);
        if (error) throw error;
        patientData = data || [];
      }
      const patientMap = {};
      patientData.forEach(p => { patientMap[p.patient_id] = p; patientMap[String(p.patient_id)] = p; });

      const prescriptionIds = presData.map(p => p.prescription_id);
      const { data: pmData, error: pmError } = await supabase.from("prescription_medicine").select("*").in("prescription_id", prescriptionIds);
      if (pmError) throw pmError;

      const medicineIds = [...new Set(pmData.map(m => m.medicine_id))];
      const { data: medicines } = await supabase.from("medicine").select("*").in("medicine_id", medicineIds);
      const medicineMap = {};
      medicines.forEach(m => (medicineMap[m.medicine_id] = m));

      const finalData = await Promise.all(presData.map(async p => {
        let diagnosis = "Not Available";
        try {
          const res = await axios.get(`http://localhost:5000/diagnosis/patient/${p.patient_id}`, { headers: { Authorization: `Bearer ${token}` } });
          diagnosis = res.data?.[0]?.disease_name || diagnosis;
        } catch {}
        const pe = patientMap[p.patient_id] || patientMap[String(p.patient_id)];
        const rawType   = pe?.insurance_type ?? pe?.insuranceType ?? pe?.insurance ?? null;
        const rawStatus = pe?.insurance_status ?? pe?.insuranceStatus ?? pe?.status ?? null;
        const hasType   = rawType && String(rawType).trim() !== "" && String(rawType).toUpperCase() !== "NONE";
        const insurance_type   = hasType ? rawType : null;
        const insurance_status = insurance_type && rawStatus
          ? typeof rawStatus === "string" ? rawStatus[0].toUpperCase() + rawStatus.slice(1) : rawStatus : null;
        return {
          prescription_id: p.prescription_id, patient_id: p.patient_id,
          patient_name: pe?.name || "Unknown Patient",
          visited_at: p.created_at, diagnosis, insurance_type, insurance_status,
          medicines: pmData.filter(m => m.prescription_id === p.prescription_id).map(m => {
            const med = medicineMap[m.medicine_id] || {};
            return {
              name: med.name || "Unknown", dosage: m.dosage, frequency: m.frequency,
              expiresAt: m.expires_at || m.expiration_date || m.expiry_date || med.expires_at || med.expiration_date || med.expiry_date || null,
              availabilityStatus: m.availability_status || m.availability || med.availability_status || med.availability || null,
            };
          }),
          dispatch_status: p.dispatch_status || "pending",
        };
      }));
      setPrescriptions(finalData);
    } catch (err) { console.error(err); setPrescriptions([]); }
    finally { setLoading(false); }
  }

  async function handleDispatch(prescriptionId) {
  try {

    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/prescriptions/${prescriptionId}/dispatch`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setPrescriptions(prev =>
      prev.map(p =>
        p.prescription_id === prescriptionId
          ? { ...p, dispatch_status: "dispatched" }
          : p
      )
    );

    showToast("✅ Prescription dispatched successfully");

  } catch (err) {
    console.error(err);

    showToast(
      `❌ ${err.response?.data?.error || "Dispatch failed"}`
    );
  }
}

  // ── Confirm restock ──
  async function handleConfirmRestock() {
    if (!confirmItem) return;
    const item = confirmItem;
    const id   = item.medicine_id;
    if (!id) { showToast("⚠ Invalid medicine ID"); setConfirmItem(null); return; }

    const effectiveQty = useCustom ? parseInt(customQty, 10) : restockQty;
    if (!effectiveQty || effectiveQty < 1) { showToast("⚠ Please enter a valid quantity"); return; }

    setProcessing(true);
    try {
      const newMfg    = getMfgDate();
      const newExpiry = getNewExpiry();
      const newQty    = getQty(item) + effectiveQty;

      const qtyField = "quantity" in item ? "quantity"
                     : "stock" in item ? "stock"
                     : "available_quantity" in item ? "available_quantity"
                     : "quantity";

      const updatePayload = {
        [qtyField]:          newQty,
        manufacturing_date:  newMfg,
        expiry_date:         newExpiry,
      };

      const { error: updateErr } = await supabase
        .from("medicine").update(updatePayload).eq("medicine_id", id);
      if (updateErr) throw updateErr;

      await supabase.from("restock_requests").insert({
        medicine_id:  id,
        name:         item.name || item.medicine_name || "Unknown",
        requested_at: new Date().toISOString(),
        status:       "pending",
      });

      // Animate out then update inventory list
      setRemovingIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        setInventory(prev =>
          prev.map(m => m.medicine_id === id
            ? { ...m, [qtyField]: newQty, expiry_date: newExpiry, manufacturing_date: newMfg }
            : m
          )
        );
        setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      }, 320);

        setConfirmItem(null);
        showToast("⏳ Processing restock, please wait…");

        setTimeout(() => {
          setSuccessItem({ ...item, restockedQty: effectiveQty });
          setTimeout(() => setSuccessItem(null), 3 * 60 * 1000);
        }, 10000); // 10 seconds delay

    } catch (err) {
      console.error("Restock error:", err);
      showToast(`⚠ ${err.message || "Restock failed. Check column names or RLS policies."}`);
      setConfirmItem(null);
    } finally {
      setProcessing(false);
    }
  }

  const effectiveRestockQty = useCustom ? (parseInt(customQty, 10) || 0) : restockQty;

  const specialistMessage = item =>
    `Hi,\n\nThis is an automated alert from the Pharmacy System.\n\nMedicine "${item?.name || item?.medicine_name || "Unknown"}" requires restocking.\n\nCurrent Stock: ${getQty(item)} units\nRequested Quantity: ${effectiveRestockQty} units\n\nPlease arrange delivery as soon as possible.\n\nThank you,\nPharmacy Dashboard`;

  function openConfirm(item) {
    setSuccessItem(null);
    setRestockQty(50);
    setCustomQty("");
    setUseCustom(false);
    setConfirmItem(item);
  }

  const filtered = prescriptions.filter(p => p.patient_id.toString().includes(searchText));

  return (
    <>
      <style>{css}</style>
      <div className="pd-root">

        {/* Toast */}
        {toast && <div className="pd-toast"><RefreshCw size={14} />{toast}</div>}

        {/* ── CONFIRM MODAL ── */}
        {confirmItem && (
          <div className="modal-overlay" onClick={() => !processing && setConfirmItem(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                  <div className="modal-icon"><RefreshCw size={20} color="#8b5cf6" /></div>
                  <div>
                    <div className="modal-title">Confirm Restock</div>
                    <div className="modal-sub">{confirmItem.name || confirmItem.medicine_name}</div>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setConfirmItem(null)} disabled={processing}><X size={14} /></button>
              </div>

              <div className="modal-body">
                <div className="qty-selector">
                  <div className="qty-selector-label">Restock Quantity</div>
                  <div className="qty-presets">
                    {PRESET_QTYS.map(q => (
                      <button
                        key={q}
                        className={`qty-chip${!useCustom && restockQty === q ? " active" : ""}`}
                        onClick={() => { setRestockQty(q); setUseCustom(false); setCustomQty(""); }}
                      >{q} units</button>
                    ))}
                  </div>
                  <div className="qty-custom-wrap">
                    <input
                      className={`qty-custom-input${useCustom ? " active" : ""}`}
                      type="number"
                      min="1"
                      placeholder="Custom…"
                      value={customQty}
                      onChange={e => {
                        setCustomQty(e.target.value);
                        setUseCustom(e.target.value !== "");
                      }}
                    />
                    <span className="qty-custom-label">or enter a custom amount</span>
                  </div>
                </div>
                <div className="msg-preview">
                  <div className="msg-preview-label"><Send size={12} /> Message to Inventory Specialist</div>
                  {specialistMessage(confirmItem)}
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-item-label">Current Stock</div>
                    <div className="info-item-value">{getQty(confirmItem)} units</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">After Restock</div>
                    <div className="info-item-value" style={{ color: effectiveRestockQty > 0 ? "#059669" : "var(--text-muted)" }}>
                      {effectiveRestockQty > 0 ? `+${effectiveRestockQty} units` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-cancel" onClick={() => setConfirmItem(null)} disabled={processing}>Cancel</button>
                <button className="btn btn-confirm" onClick={handleConfirmRestock} disabled={processing || effectiveRestockQty < 1}>
                  <Send size={14} />{processing ? "Processing…" : "Send & Restock"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS MODAL ── */}
        {successItem && (
          <div className="modal-overlay" onClick={() => setSuccessItem(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="success-modal">
                <div className="success-icon"><CheckCircle size={32} color="#10b981" /></div>
                <div className="success-title">Message Sent & Restocked!</div>
                <div className="success-sub">
                  The Inventory Specialist has been notified and the stock has been updated. The medicine has been removed from the expiring list.
                </div>
                <div className="success-details">
                  <div>💊 <b>Medicine:</b> {successItem.name || successItem.medicine_name}</div>
                  <div>📦 <b>Restocked:</b> +{successItem.restockedQty} units</div>
                </div>
                <button className="btn btn-done" onClick={() => setSuccessItem(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="pd-header">
          <div className="pd-header-inner">
            <div className="pd-logo">
              <div className="pd-logo-icon"><Pill size={19} color="#fff" /></div>
              <div><div className="pd-logo-text">Pharmacy Dashboard</div></div>
            </div>
            <div className="pd-header-actions">
              <button className="pd-logout-btn" onClick={handleLogout}><LogOut size={14} /> Logout</button>
            </div>
          </div>
        </header>

        <main className="pd-main">

          {/* Stat cards — 3 columns, no "Expires Tomorrow" */}
          <section>
            <div className="pd-label">Inventory Overview</div>
            <div className="pd-stats">
              <StatCard label="Total Medicines" value={totalMedicines}
                icon={<Package size={18} color="#0d9488" />} iconBg="#ccfbf1"
                stripe="linear-gradient(90deg,#0d9488,#10b981)" />
              <StatCard label="Expiring This Month" value={expiringSoon.length}
                icon={<Clock size={18} color="#f97316" />} iconBg="#fff7ed"
                stripe="linear-gradient(90deg,#f97316,#fb923c)" />
              <StatCard label="Total Prescriptions Today" value={prescriptions.length}
                icon={<Activity size={18} color="#8b5cf6" />} iconBg="#f5f3ff"
                stripe="linear-gradient(90deg,#8b5cf6,#a78bfa)" />
            </div>
          </section>

          {/* Expiring This Month — full width with restock buttons */}
          <div className="pd-card">
            <div className="pd-card-head">
              <div className="pd-card-head-icon" style={{ background:"#fff7ed" }}><Clock size={16} color="#f97316" /></div>
              <div>
                <div className="pd-card-title">Expiring This Month</div>
                <div className="pd-card-subtitle">{expiringSoon.length} item{expiringSoon.length !== 1 ? "s" : ""} expiring within 30 days — restock as needed</div>
              </div>
            </div>
            <div className="pd-card-body">
              {expiringSoon.length === 0
                ? <div className="pd-empty"><CheckCircle size={28} color="#10b981" />No medicines expiring within the next 30 days</div>
                : <div className="pd-alert-list">
                    {expiringSoon.map((item, i) => (
                      <div
                        className={`pd-alert-item orange ${removingIds.has(item.medicine_id) ? "removing" : ""}`}
                        key={item.medicine_id || i}
                      >
                        <Clock size={15} color="#f97316" style={{ flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="pd-alert-name">{item.name || item.medicine_name || "Unknown"}</div>
                          <div className="pd-alert-date">
                            Qty: {getQty(item)} · Exp: {formatDate(getExpiry(item)) || "—"}
                          </div>
                        </div>
                        <button
                          className="restock-btn"
                          disabled={removingIds.has(item.medicine_id)}
                          onClick={() => openConfirm(item)}
                        >
                          <RefreshCw size={12} />Restock
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>

          {/* Prescriptions */}
          <div className="pd-card">
            <div className="pd-controls">
              <div className="pd-search-wrap">
                <Search size={14} className="pd-input-icon" />
                <input className="pd-input" type="text" placeholder="Search by Patient ID…" value={searchText} onChange={e => setSearchText(e.target.value)} />
              </div>
              <div style={{ position:"relative" }}>
                <Calendar size={14} className="pd-input-icon" />
                <input className="pd-input" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ paddingLeft:34 }} />
              </div>
              <span className="pd-count-pill">{filtered.length} prescription{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="pd-card-head" style={{ padding:"18px 22px 0" }}>
              <div className="pd-card-head-icon" style={{ background:"#ccfbf1" }}><Activity size={16} color="#0d9488" /></div>
              <div>
                <div className="pd-card-title">Daily Prescriptions</div>
                <div className="pd-card-subtitle">Patient records for {new Date(selectedDate).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}</div>
              </div>
            </div>

            {loading ? (
              <div className="pd-loading"><div className="pd-spinner" /> Loading prescriptions…</div>
            ) : filtered.length === 0 ? (
              <div className="pd-empty" style={{ padding:56 }}><Activity size={30} color="#d1fae5" />No prescriptions found for this date</div>
            ) : (
              <div className="pd-table-wrap" style={{ marginTop:16 }}>
                <table className="pd-table">
                  <thead>
                    <tr><th>Patient ID</th><th>Insurance</th><th>Status</th><th>Visited</th><th>Medicines</th><th>Dispatch</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.prescription_id}>
                        <td><span className="pd-pid">#{p.patient_id}</span></td>
                        <td>
                          {p.insurance_type
                            ? <span className="badge badge-teal"><Shield size={11} />{p.insurance_type}</span>
                            : <span className="badge badge-gray">No Insurance</span>}
                        </td>
                        <td>
                          {p.insurance_status === "Active"   && <span className="badge badge-green"><CheckCircle size={11} /> Active</span>}
                          {p.insurance_status === "Inactive" && <span className="badge badge-red"><XCircle size={11} /> Inactive</span>}
                          {!p.insurance_status               && <span className="badge badge-gray">N/A</span>}
                        </td>
                        <td style={{ whiteSpace:"nowrap", fontSize:13 }}>
                          {new Date(p.visited_at).toLocaleString("en-US", { hour:"2-digit", minute:"2-digit", month:"short", day:"numeric" })}
                        </td>
                        <td>
                          <div className="pd-med-list">
                            {p.medicines.map((m, i) => (
                              <div className="pd-med-item" key={i}>
                                <div className="pd-med-name">{m.name}</div>
                                <div className="pd-med-meta">{m.dosage} · {m.frequency}</div>
                                {m.expiresAt && (
                                  <div className={`pd-med-meta ${isWithinNextMonth(m.expiresAt) ? "pd-med-warn" : ""}`}>
                                    Exp: {formatDate(m.expiresAt) || m.expiresAt}{isWithinNextMonth(m.expiresAt) && " ⚠"}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                        {p.dispatch_status === "dispatched" ? (
                          <span className="badge badge-green">
                            <CheckCircle size={11} />
                            Dispatched
                          </span>
                        ) : (
                          <button
                            className="restock-btn"
                            onClick={() => handleDispatch(p.prescription_id)}
                          >
                            <Send size={12} />
                            Dispatch
                          </button>
                        )}
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  );
}

function StatCard({ label, value, icon, iconBg, stripe }) {
  return (
    <div className="pd-stat">
      <div className="pd-stat-stripe" style={{ background:stripe }} />
      <div className="pd-stat-icon" style={{ background:iconBg }}>{icon}</div>
      <div>
        <div className="pd-stat-label">{label}</div>
        <div className="pd-stat-value">{value}</div>
      </div>
    </div>
  );
}