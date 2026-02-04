import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Download,
  MapPin,
  Edit,
  Trash,
  Star,
  StarHalf,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Hospital.css";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000";
const socket = io(API_URL);

const userRole = localStorage.getItem("accountType");
const isAdmin = userRole === "Hospital Admin";

interface Hospital {
  _id?: string;
  hospitalId: string;
  name: string;
  location: string;
  transplants: number;
  verification: string;
  rating: number;
}

const Hospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    transplants: 0,
    verification: "Pending",
    rating: 0,
  });

  const location = useLocation();
  const navigate = useNavigate();
  const requestId = (location.state as { requestId?: string })?.requestId;

  const fetchHospitals = async () => {
    try {
      const res = await fetch(`${API_URL}/hospitals`);
      if (!res.ok) throw new Error("Failed to load hospitals");
      const data: Hospital[] = await res.json();
      setHospitals(data);
      setFilteredHospitals(data);
    } catch {
      toast.error("Failed to fetch hospitals!");
    }
  };

  useEffect(() => {
    fetchHospitals();
    if (requestId) {
      toast.info(`Select a hospital for Request ID: ${requestId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.hospitalId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHospitals(filtered);
  }, [searchTerm, hospitals]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "transplants" || name === "rating"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      transplants: 0,
      verification: "Pending",
      rating: 0,
    });
    setEditingHospital(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location) {
      toast.error("Please fill all fields!");
      return;
    }

    try {
      const method = editingHospital ? "PUT" : "POST";
      const url = editingHospital
        ? `${API_URL}/hospitals/${editingHospital._id}`
        : `${API_URL}/hospitals`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          transplants: Number(formData.transplants),
          rating: Number(formData.rating),
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      toast.success(editingHospital ? "Hospital updated!" : "Hospital added!");
      await fetchHospitals();
      setShowModal(false);
      resetForm();
    } catch {
      toast.error("Operation failed!");
    }
  };

  const handleEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      location: hospital.location,
      transplants: hospital.transplants,
      verification: hospital.verification,
      rating: hospital.rating,
    });
    setShowModal(true);
  };

  const handleDelete = (hospital: Hospital) => {
    toast(
      ({ closeToast }) => (
        <div className="p-2">
          <p className="mb-2">
            Delete <strong>{hospital.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await fetch(`${API_URL}/hospitals/${hospital._id}`, {
                    method: "DELETE",
                  });
                  toast.success("Hospital deleted!");
                  fetchHospitals();
                } catch {
                  toast.error("Delete failed!");
                }
                closeToast?.();
              }}
            >
              Yes
            </Button>
            <Button size="sm" variant="outline" onClick={closeToast}>
              No
            </Button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  // Hospital Assign
  const handleSelectHospital = async (hospital: Hospital) => {
    if (!requestId) {
      toast.error("No request selected!");
      return;
    }

    setLoadingAssign(true);

    try {
      const res = await fetch(`${API_URL}/api/update-hospital/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName: hospital.name,
          hospitalAddress: hospital.location,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.message || "Failed to assign hospital");
        setLoadingAssign(false);
        return;
      }

      toast.success(` ${hospital.name} assigned successfully!`);

      socket.emit("hospitalAssigned", {
        _id: requestId,
        hospitalName: hospital.name,
      });

      setTimeout(() => {
        navigate("/dashboard/requests");
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error("Error updating hospital!");
    }

    setLoadingAssign(false);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(hospitals);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hospitals");
    XLSX.writeFile(workbook, "Hospitals.xlsx");
    toast.success("Exported!");
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating))
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 inline" />);
      else if (i - rating < 1)
        stars.push(
          <StarHalf key={i} className="w-4 h-4 text-yellow-500 inline" />
        );
      else stars.push(<Star key={i} className="w-4 h-4 text-gray-300 inline" />);
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" theme="colored" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {requestId ? "CHOOSE HOSPITAL" : "POPULAR HOSPITALS"}
          </h1>
          <p className="text-muted-foreground">
            {requestId
              ? "Select a hospital to assign for the organ request."
              : "Partner hospitals in the network."}
          </p>
        </div>

        {!requestId && isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-[#e11d48] hover:bg-[#be123c] text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Hospital
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          {!requestId && (
            <div className="flex justify-between items-center">
              <CardTitle>All Hospitals</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search hospitals..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>{requestId ? "Select" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHospitals.map((hospital) => (
                  <TableRow key={hospital._id}>
                    <TableCell>{hospital.hospitalId}</TableCell>
                    <TableCell>{hospital.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {hospital.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          hospital.verification === "Verified"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                        }
                      >
                        {hospital.verification}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderStars(hospital.rating)}</TableCell>
                    <TableCell>
                      {requestId ? (
                        <Button
                          onClick={() => handleSelectHospital(hospital)}
                          disabled={loadingAssign}
                        >
                          {loadingAssign ? "Assigning..." : "Select"}
                        </Button>
                      ) : isAdmin ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(hospital)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(hospital)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">No actions</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">
              {editingHospital ? "Edit Hospital" : "Add Hospital"}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Hospital name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Transplants</label>
                  <Input
                    type="number"
                    name="transplants"
                    min={0}
                    value={formData.transplants}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Rating (0-5)</label>
                  <Input
                    type="number"
                    name="rating"
                    min={0}
                    max={5}
                    step={0.5}
                    value={formData.rating}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Verification</label>
                <select
                  name="verification"
                  value={formData.verification}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingHospital ? "Save Changes" : "Add Hospital"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
