import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const API_URL = "http://localhost:5000";

interface RequestData {
  _id: string;
  requestId: string;
  recipientId: string;
  organ: string;
  bloodTypeRequired: string;
  urgency: string;
  requestStatus: string;
  hospitalName: string;
  createdAt: string;
}

interface Hospital {
  name: string;
  location: string;
}

export default function Requests() {
  const navigate = useNavigate();
  const location = useLocation();

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");

  // Fetch requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/requests`);
      setRequests(res.data);
    } catch (err) {
      toast.error("❌ Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  // Assign hospital
  const assignHospital = async (requestId: string, hospital: Hospital) => {
    try {
      await axios.put(`${API_URL}/api/update-hospital/${requestId}`, {
        hospitalName: hospital.name,
        hospitalAddress: hospital.location,
      });

      toast.success(`Hospital ${hospital.name} assigned!`);
      setSelectedHospital(hospital.name);
      fetchRequests();
    } catch (err) {
      toast.error("❌ Failed to update hospital");
      console.error(err);
    }
  };

  // If redirected from /hospitals → assign selected hospital
  useEffect(() => {
    if (
      location.state &&
      location.state.selectedHospital &&
      location.state.requestId
    ) {
      const hospital = location.state.selectedHospital;
      assignHospital(location.state.requestId, {
        name: hospital.name,
        location: hospital.location,
      });
    }
  }, []); // run only on first render

  // Fetch + socket listeners
  useEffect(() => {
    fetchRequests();
    const socket = io(API_URL);

    socket.on("request_created", (newReq: RequestData) => {
      setRequests((p) => [newReq, ...p]);
      toast.success("🆕 New organ request received!");
    });

    socket.on("hospitalAssigned", (updated: RequestData) => {
      setRequests((prev) =>
        prev.map((req) => (req._id === updated._id ? updated : req))
      );
      toast.success(`🏥 ${updated.hospitalName} Assigned!`);
      setSelectedHospital(updated.hospitalName);
    });

    return () => socket.disconnect();
  }, []);

  // Search + Filter
  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filter === "All" || r.requestStatus === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      r.requestId.toLowerCase().includes(q) ||
      r.recipientId.toLowerCase().includes(q) ||
      r.organ.toLowerCase().includes(q) ||
      r.hospitalName?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // CSV export
  const exportToCSV = () => {
    if (filteredRequests.length === 0)
      return toast.warning("⚠ No data to export!");

    const headers = [
      "RequestID,RecipientID,Organ,BloodType,Urgency,Status,Hospital,Date",
    ];

    const rows = filteredRequests.map((r) =>
      [
        r.requestId,
        r.recipientId,
        r.organ,
        r.bloodTypeRequired,
        r.urgency,
        r.requestStatus,
        r.hospitalName,
        r.createdAt?.split("T")[0],
      ].join(",")
    );

    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Organ_Requests.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("📄 CSV Exported");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">ORGAN REQUESTS</h1>
        <div
          className={`px-4 py-2 rounded-lg font-semibold shadow ${
            selectedHospital
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-64 border rounded-lg">
          <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 w-full rounded-lg outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="border rounded-lg px-3 py-2 flex items-center bg-white">
            <Filter className="w-4 h-4 text-gray-500 mr-1" />
            <select
              className="bg-transparent outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Matched">Matched</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200 uppercase text-xs font-semibold">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Recipient ID</th>
                <th className="py-3 px-4">Organ</th>
                <th className="py-3 px-4">Blood Type</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{req.requestId}</td>
                    <td className="py-3 px-4">{req.recipientId}</td>
                    <td className="py-3 px-4">{req.organ}</td>
                    <td className="py-3 px-4">{req.bloodTypeRequired}</td>
                    <td className="py-3 px-4">{req.urgency}</td>
                    <td className="py-3 px-4">{req.requestStatus}</td>
                    <td className="py-3 px-4">
                      {req.hospitalName || "Not Assigned"}
                    </td>

                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate("/hospitals", {
                            state: { requestId: req._id },
                          })
                        }
                      >
                        {req.hospitalName
                          ? "Change Hospital"
                          : "Choose Hospital"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 text-center text-gray-500"
                  >
                    No {filter.toLowerCase()} requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}
