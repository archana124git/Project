

export default function PrescriptionPreview({ data }) {
return (
  <div className="max-w-3xl mx-auto bg-white p-6 border shadow">
    <div className="border-b pb-4 mb-4">
      <h1 className="text-2xl font-bold text-center">Medical Prescription</h1>
      <p className="text-center text-sm text-gray-500">
        Date: {data.date}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
      <div>
        <h2 className="font-semibold">Doctor Details</h2>
        <p>Name: {data.doctor.name}</p>
        <p>Specialization: {data.doctor.specialization}</p>
        <p>License No: {data.doctor.license}</p>
      </div>

      <div>
        <h2 className="font-semibold">Patient Details</h2>
        <p>Patient ID: {data.patient.id}</p>
        <p>Name: {data.patient.name}</p>
        <p>Age: {data.patient.age}</p>
      </div>
    </div>

    <table className="w-full border-collapse border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">#</th>
          <th className="border p-2">Medicine</th>
          <th className="border p-2">Dosage</th>
          <th className="border p-2">Frequency</th>
          <th className="border p-2">Duration</th>
          <th className="border p-2">Qty</th>
          <th className="border p-2">Before Meal</th>
        </tr>
      </thead>
      <tbody>
        {data.medicines.map((m, i) => (
          <tr key={i}>
            <td className="border p-2 text-center">{i + 1}</td>
            <td className="border p-2">{m.name}</td>
            <td className="border p-2">{m.dosage}</td>
            <td className="border p-2">{m.frequency}</td>
            <td className="border p-2">{m.duration}</td>
            <td className="border p-2 text-center">{m.quantity}</td>
            <td className="border p-2 text-center">
              {m.before_meal === "before"
                ? "Before Food"
                : m.before_meal === "after"
                ? "After Food"
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-6 flex justify-between text-sm">
      <p>Signature:</p>
      <p className="font-semibold">{data.doctor.name}</p>
    </div>
  </div>
);
}  