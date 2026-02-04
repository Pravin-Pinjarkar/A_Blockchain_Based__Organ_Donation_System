
import React, { useState, useEffect } from "react";

const DonorForm = () => {
  const [donorId, setDonorId] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    bloodType: "",
    organDonate: "",
    customOrgan: "",
    status: "",
    registrationDate: "",
  });

  // Generate auto Donor ID like D-0001, D-0002
  useEffect(() => {
    const storedCount = localStorage.getItem("donorCount");
    const newCount = storedCount ? parseInt(storedCount) + 1 : 1;
    localStorage.setItem("donorCount", newCount.toString());
    const formattedId = `D-${String(newCount).padStart(4, "0")}`;
    setDonorId(formattedId);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Donor Registered:", { donorId, ...formData });
    alert(`Donor Registered Successfully!\nDonor ID: ${donorId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-red-600 mb-6">
          Donor Registration Form
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Donor ID */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Donor ID</label>
            <input
              type="text"
              value={donorId}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              placeholder="Enter age"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Blood Type */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Blood Type</label>
            <select
              name="bloodType"
              value={formData.bloodType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Blood Type</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Organ Donate */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Organ Donate</label>
            <select
              name="organDonate"
              value={formData.organDonate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Organ</option>
              {["Kidney", "Liver", "Lungs", "Heart", "Eyes"].map((organ) => (
                <option key={organ} value={organ}>
                  {organ}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Organ */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Other Organ (if not listed)
            </label>
            <input
              type="text"
              name="customOrgan"
              value={formData.customOrgan}
              onChange={handleChange}
              placeholder="Enter custom organ name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select Status</option>
              <option value="Available">Available</option>
              <option value="Processing">Processing</option>
              <option value="Matched">Matched</option>
            </select>
          </div>

          {/* Registration Date */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Registration Date</label>
            <input
              type="date"
              name="registrationDate"
              value={formData.registrationDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-red-500 text-white font-semibold px-8 py-2 rounded-lg hover:bg-red-600 transition duration-300 shadow-md"
            >
              Register Donor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonorForm;

