// appointments.js
// Utility to filter booked patients for a doctor on a given day

export function getBookedPatients(patients, doctorId, date) {
  // date should be in YYYY-MM-DD format
  return patients.filter(
    p => p.doctor_id === doctorId && p.appointment_date === date && p.visit_status === 'booked'
  );
}
