import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Edit, Trash } from "lucide-react";
import * as XLSX from "xlsx";
import "./Donors.css";

interface Donor {
  _id?: string;
  donorId?: string;
  name: string;
  age: number;
  bloodType: string;
  organ: string;
  status: string;
  date: string;
}

const Donors: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [newDonor, setNewDonor] = useState<Donor>({
    name: "",
    age: 0,
    bloodType: "",
    organ: "",
    status: "Available",
    date: new Date().toISOString().split("T")[0],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [userRole, setUserRole] = useState("");

  const API_URL = "http://localhost:5000/donors";

  // ✅ Fetch user role
  const fetchUserRole = async () => {
    try {
      const email = localStorage.getItem("email");
      if (!email) return;
      

      const res = await fetch(`http://localhost:5000/api/userdetails/${email}`);
      const data = await res.json();

      if (data && data.accountType) {
                const normalized =
          data.accountType.toLowerCase() === "hospital" ||
          data.accountType.toLowerCase() === "hospital admin"
            ? "Hospital Admin"
            : data.accountType;

        setUserRole(normalized);
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  // ✅ Fetch donors list
  const fetchDonors = async () => {
    try {
      const res = await axios.get(API_URL);
      setDonors(res.data);
    } catch (err) {
      console.error(err);
      toast.error("❌ Error fetching donors.");
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchDonors();
  }, []);

  const handleAddDonor = async () => {
    if (!newDonor.name || !newDonor.bloodType || !newDonor.organ || newDonor.age <= 0) {
      toast.warning("Please fill all required fields.");
      return;
    }
    try {
      const res = await axios.post(API_URL, newDonor);
      setDonors([res.data, ...donors]);
      setNewDonor({
        name: "",
        age: 0,
        bloodType: "",
        organ: "",
        status: "Available",
        date: new Date().toISOString().split("T")[0],
      });
      setOpenAdd(false);
      toast.success("Donor added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error adding donor.");
    }
  };

  const handleUpdateDonor = async () => {
    if (!selectedDonor?._id) return;
    if (selectedDonor.age <= 0) {
      toast.warning("Please enter a valid age.");
      return;
    }
    try {
      const res = await axios.put(`${API_URL}/${selectedDonor._id}`, selectedDonor);
      setDonors((prev) => prev.map((d) => (d._id === res.data._id ? res.data : d)));
      setOpenEdit(false);
      setSelectedDonor(null);
      toast.success("Donor updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error updating donor.");
    }
  };

  const handleDeleteDonor = async () => {
    if (!donorToDelete?._id) return;
    try {
      await axios.delete(`${API_URL}/${donorToDelete._id}`);
      setDonors((prev) => prev.filter((d) => d._id !== donorToDelete._id));
      setDonorToDelete(null);
      setOpenDelete(false);
      toast.success("Donor deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error deleting donor.");
    }
  };

  const exportDonors = () => {
    if (donors.length === 0) {
      toast.warning("No donors to export!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(donors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Donors");
    XLSX.writeFile(workbook, `donors_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Donors exported successfully!");
  };

  const filteredDonors = donors.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "Donated":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const isAdmin = userRole?.toLowerCase().includes("hospital");



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RESPECTED DONORS</h1>
          <p className="text-muted-foreground">Manage registered organ donors</p>
        </div>

        {isAdmin && (
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Donor
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Donors</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search donors..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={exportDonors}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Organ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonors.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>{d.donorId}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.age}</TableCell>
                  <TableCell>{d.bloodType}</TableCell>
                  <TableCell>{d.organ}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                  </TableCell>
                  <TableCell>{d.date}</TableCell>
                  {isAdmin && (
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedDonor(d); setOpenEdit(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setDonorToDelete(d); setOpenDelete(true); }}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Modal */}
      {openAdd && isAdmin && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Donor</h2>
            <Input placeholder="Name" value={newDonor.name} onChange={e => setNewDonor({ ...newDonor, name: e.target.value })} />
            <Input type="number" placeholder="Age" value={newDonor.age === 0 ? "" : newDonor.age} onChange={e => setNewDonor({ ...newDonor, age: Number(e.target.value) })} />
            <select value={newDonor.bloodType} onChange={e => setNewDonor({ ...newDonor, bloodType: e.target.value })}>
              <option value="">Select Blood Type</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
            <Input placeholder="Organ" value={newDonor.organ} onChange={e => setNewDonor({ ...newDonor, organ: e.target.value })} />
            <select value={newDonor.status} onChange={e => setNewDonor({ ...newDonor, status: e.target.value })}>
              <option value="Available">Available</option>
              <option value="Donated">Donated</option>
            </select>
            <div className="modal-actions">
              <Button onClick={handleAddDonor}>Add</Button>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {openEdit && isAdmin && selectedDonor && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Donor</h2>
            <Input placeholder="Name" value={selectedDonor.name} onChange={e => setSelectedDonor({ ...selectedDonor, name: e.target.value })} />
            <Input type="number" placeholder="Age" value={selectedDonor.age} onChange={e => setSelectedDonor({ ...selectedDonor, age: Number(e.target.value) })} />
            <select value={selectedDonor.bloodType} onChange={e => setSelectedDonor({ ...selectedDonor, bloodType: e.target.value })}>
              <option value="">Select Blood Type</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
            <Input placeholder="Organ" value={selectedDonor.organ} onChange={e => setSelectedDonor({ ...selectedDonor, organ: e.target.value })} />
            <select value={selectedDonor.status} onChange={e => setSelectedDonor({ ...selectedDonor, status: e.target.value })}>
              <option value="Available">Available</option>
              <option value="Donated">Donated</option>
            </select>
            <div className="modal-actions">
              <Button onClick={handleUpdateDonor}>Update</Button>
              <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {openDelete && isAdmin && donorToDelete && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete {donorToDelete.name}?</p>
            <div className="modal-actions">
              <Button variant="destructive" onClick={handleDeleteDonor}>Delete</Button>
              <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
};

export default Donors;
