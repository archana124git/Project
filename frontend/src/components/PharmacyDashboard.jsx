import React, { useState } from 'react';
import { Search, Package, AlertCircle, CheckCircle, Plus, Edit2, Trash2, X, Activity, TrendingDown, FileText, ClipboardList, User, Calendar, Pill } from 'lucide-react';

export default function PharmacyDashboard() {
  const [userRole, setUserRole] = useState('pharmacist');
  const [activeTab, setActiveTab] = useState('inventory');
  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Paracetamol 500mg', category: 'Analgesic', stock: 250, minStock: 50, price: 5.00, available: true, expiryDate: '2025-12-30' },
    { id: 2, name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 120, minStock: 30, price: 15.00, available: true, expiryDate: '2025-08-15' },
    { id: 3, name: 'Ibuprofen 400mg', category: 'Analgesic', stock: 0, minStock: 50, price: 8.00, available: false, expiryDate: '2026-01-20' },
    { id: 4, name: 'Metformin 500mg', category: 'Antidiabetic', stock: 180, minStock: 40, price: 12.00, available: true, expiryDate: '2025-11-10' },
    { id: 5, name: 'Lisinopril 10mg', category: 'Antihypertensive', stock: 15, minStock: 30, price: 20.00, available: true, expiryDate: '2025-09-25' },
    { id: 6, name: 'Omeprazole 20mg', category: 'Proton Pump Inhibitor', stock: 95, minStock: 25, price: 10.00, available: true, expiryDate: '2026-03-18' },
  ]);
  
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      prescriptionNo: 'RX-2024-001',
      patientName: 'John Doe',
      patientAge: 45,
      doctorName: 'Dr. Sarah Williams',
      date: '2024-12-20',
      status: 'pending',
      medicines: [
        { medicineId: 1, medicineName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '5 days', quantity: 15 },
        { medicineId: 2, medicineName: 'Amoxicillin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '7 days', quantity: 14 }
      ],
      notes: 'Take after meals'
    },
    {
      id: 2,
      prescriptionNo: 'RX-2024-002',
      patientName: 'Emma Smith',
      patientAge: 32,
      doctorName: 'Dr. Michael Chen',
      date: '2024-12-19',
      status: 'fulfilled',
      medicines: [
        { medicineId: 4, medicineName: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', quantity: 30 }
      ],
      notes: 'Take with breakfast'
    },
    {
      id: 3,
      prescriptionNo: 'RX-2024-003',
      patientName: 'Robert Johnson',
      patientAge: 58,
      doctorName: 'Dr. Sarah Williams',
      date: '2024-12-21',
      status: 'pending',
      medicines: [
        { medicineId: 5, medicineName: 'Lisinopril 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', quantity: 30 },
        { medicineId: 3, medicineName: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'As needed', duration: '10 days', quantity: 10 }
      ],
      notes: 'Monitor blood pressure regularly'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    minStock: '',
    price: '',
    expiryDate: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    patientName: '',
    patientAge: '',
    doctorName: '',
    medicines: [{ medicineId: '', dosage: '', frequency: '', duration: '', quantity: '' }],
    notes: ''
  });

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrescriptions = prescriptions.filter(pres =>
    pres.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pres.prescriptionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pres.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMedicine = () => {
    if (formData.name && formData.category && formData.stock && formData.price) {
      const newMedicine = {
        id: medicines.length + 1,
        name: formData.name,
        category: formData.category,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock) || 20,
        price: parseFloat(formData.price),
        expiryDate: formData.expiryDate || '2026-12-31',
        available: parseInt(formData.stock) > 0
      };
      setMedicines([...medicines, newMedicine]);
      setFormData({ name: '', category: '', stock: '', minStock: '', price: '', expiryDate: '' });
      setShowAddModal(false);
    }
  };

  const handleUpdateMedicine = () => {
    if (editingMedicine && formData.name && formData.category && formData.stock && formData.price) {
      setMedicines(medicines.map(med => 
        med.id === editingMedicine.id 
          ? {
              ...med,
              name: formData.name,
              category: formData.category,
              stock: parseInt(formData.stock),
              minStock: parseInt(formData.minStock) || 20,
              price: parseFloat(formData.price),
              expiryDate: formData.expiryDate || '2026-12-31',
              available: parseInt(formData.stock) > 0
            }
          : med
      ));
      setEditingMedicine(null);
      setFormData({ name: '', category: '', stock: '', minStock: '', price: '', expiryDate: '' });
    }
  };

  const handleDeleteMedicine = (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      setMedicines(medicines.filter(med => med.id !== id));
    }
  };

  const handleEditClick = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      category: medicine.category,
      stock: medicine.stock.toString(),
      minStock: medicine.minStock.toString(),
      price: medicine.price.toString(),
      expiryDate: medicine.expiryDate
    });
  };

  const handleAddPrescription = () => {
    if (prescriptionForm.patientName && prescriptionForm.doctorName) {
      const newPrescription = {
        id: prescriptions.length + 1,
        prescriptionNo: `RX-2024-${(prescriptions.length + 1).toString().padStart(3, '0')}`,
        patientName: prescriptionForm.patientName,
        patientAge: parseInt(prescriptionForm.patientAge),
        doctorName: prescriptionForm.doctorName,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        medicines: prescriptionForm.medicines.filter(m => m.medicineId).map(m => ({
          ...m,
          medicineName: medicines.find(med => med.id === parseInt(m.medicineId))?.name || '',
          quantity: parseInt(m.quantity)
        })),
        notes: prescriptionForm.notes
      };
      setPrescriptions([newPrescription, ...prescriptions]);
      setPrescriptionForm({
        patientName: '',
        patientAge: '',
        doctorName: '',
        medicines: [{ medicineId: '', dosage: '', frequency: '', duration: '', quantity: '' }],
        notes: ''
      });
      setShowPrescriptionModal(false);
    }
  };

  const handleFulfillPrescription = (prescriptionId) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
      const canFulfill = prescription.medicines.every(med => {
        const medicine = medicines.find(m => m.id === med.medicineId);
        return medicine && medicine.stock >= med.quantity;
      });

      if (canFulfill) {
        prescription.medicines.forEach(med => {
          setMedicines(medicines.map(m => 
            m.id === med.medicineId 
              ? { ...m, stock: m.stock - med.quantity, available: (m.stock - med.quantity) > 0 }
              : m
          ));
        });
        setPrescriptions(prescriptions.map(p =>
          p.id === prescriptionId ? { ...p, status: 'fulfilled' } : p
        ));
        alert('Prescription fulfilled successfully!');
      } else {
        alert('Cannot fulfill prescription. Some medicines are out of stock or insufficient quantity.');
      }
    }
  };

  const addMedicineToPrescription = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { medicineId: '', dosage: '', frequency: '', duration: '', quantity: '' }]
    });
  };

  const updatePrescriptionMedicine = (index, field, value) => {
    const updatedMedicines = [...prescriptionForm.medicines];
    updatedMedicines[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medicines: updatedMedicines });
  };

  const removePrescriptionMedicine = (index) => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: prescriptionForm.medicines.filter((_, i) => i !== index)
    });
  };

  const availableCount = medicines.filter(m => m.available).length;
  const outOfStockCount = medicines.filter(m => !m.available).length;
  const lowStockCount = medicines.filter(m => m.available && m.stock <= m.minStock).length;
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <h1 className="text-2xl font-bold text-blue-900">
            Pharmacy Dashboard
          </h1>
          <button onClick={handleLogout} className="flex items-center text-red-600">
            <LogOut size={18} />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
        <StatCard title="Total Medicines" value={inventory.length} icon={<Package />} />
        <StatCard title="Low Stock" value={lowStockCount} icon={<AlertCircle />} />
        <StatCard title="Patients" value={patientsCount} icon={<ClipboardList />} />
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by Patient ID"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="border px-3 py-2 rounded w-1/3"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border px-3 py-2 rounded w-1/3"
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Patient ID</th>
                  <th className="border px-4 py-2">Diagnosis</th>
                  <th className="border px-4 py-2">Insurance Name</th>
                  <th className="border px-4 py-2">Insurance Status</th>
                  <th className="border px-4 py-2">Visited</th>
                  <th className="border px-4 py-2">Medicines</th>
                </tr>
              </thead>

              <tbody>
                {filteredPrescriptions.map(p => (
                  <tr key={p.prescription_id}>
                    <td className="border px-4 py-2">{p.patient_id}</td>
                    <td className="border px-4 py-2">{p.diagnosis}</td>

                    <td className="border px-4 py-2">
                      {p.insurance_type ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                          {p.insurance_type}
                        </span>
                      ) : (
                        <div>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">No Insurance</span>
                          <div className="text-xs text-gray-400 mt-1">
                            raw: {p.patient_raw?.insurance_type ?? "(missing)"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {p.insurance_status === "Active" && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                          Active
                        </span>
                      )}
                      {p.insurance_status === "Inactive" && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-semibold">
                          Inactive
                        </span>
                      )}
                      {!p.insurance_status && (
                        <div>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">N/A</span>
                          <div className="text-xs text-gray-400 mt-1">
                            raw: {p.patient_raw?.insurance_status ?? "(missing)"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {new Date(p.visited_at).toLocaleString()}
                    </td>

                    <td className="border px-4 py-2">
                      <ul className="list-disc ml-4">
                        {p.medicines.map((m, i) => (
                          <li key={i}>
                            <b>{m.name}</b> — {m.dosage}, {m.frequency}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-5 rounded shadow flex items-center space-x-4">
      <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
