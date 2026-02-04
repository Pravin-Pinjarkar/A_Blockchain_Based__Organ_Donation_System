import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
import { Search, Plus, Download, Edit, Trash } from "lucide-react";
import * as XLSX from "xlsx";
import "./Recipients.css";

interface Recipient {
  _id?: string;
  recipientId?: string;
  name: string;
  age: number;
  bloodType: string;
  organ: string;
  urgency: string;
  waitTime: string;
  status: string;
}

const Recipients: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState<Recipient>({
    name: "",
    age: 0,
    bloodType: "",
    organ: "",
    urgency: "Medium",
    waitTime: "",
    status: "Medium",
  });

  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipientToDelete, setRecipientToDelete] = useState<Recipient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [userRole, setUserRole] = useState("");

  const API_URL = "http://localhost:5000/recipients";

  /* Fetch user role */
  const fetchUserRole = async () => {
    try {
      const email = localStorage.getItem("email");
      if (!email) return;

      const res = await fetch(`http://localhost:5000/api/userdetails/${email}`);
      const data = await res.json();

      if (data && data.accountType) setUserRole(data.accountType);
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  /* Fetch Recipients */
  const fetchRecipients = async () => {
    try {
      const res = await axios.get(API_URL);

      const mapped = res.data.map((r: Recipient) => ({
        ...r,
        urgency: r.urgency || r.status || "Medium",
        status: r.status || r.urgency || "Medium",
      }));

      setRecipients(mapped);
    } catch {
      toast.error("❌ Error fetching recipients.");
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchRecipients();
  }, []);

  /* Add Recipient */
  const handleAddRecipient = async () => {
    if (!newRecipient.name || !newRecipient.organ || !newRecipient.bloodType || !newRecipient.waitTime) {
      toast.warning("Please fill all required fields.");
      return;
    }

    if (newRecipient.age <= 0) {
      toast.warning("Please enter a valid age.");
      return;
    }

    try {
      const payload = {
        ...newRecipient,
        urgency: newRecipient.urgency,
        status: newRecipient.urgency,
      };

      const res = await axios.post(API_URL, payload);
      setRecipients([res.data, ...recipients]);

      setNewRecipient({
        name: "",
        age: 0,
        bloodType: "",
        organ: "",
        urgency: "Medium",
        waitTime: "",
        status: "Medium",
      });

      setOpenAdd(false);
      toast.success("Recipient added successfully!");
    } catch {
      toast.error("❌ Error adding recipient.");
    }
  };

  /* Update Recipient */
  const handleUpdateRecipient = async () => {
    if (!selectedRecipient?._id) return;

    if (selectedRecipient.age <= 0) {
      toast.warning("Please enter a valid age.");
      return;
    }

    try {
      const payload = {
        ...selectedRecipient,
        status: selectedRecipient.urgency,
      };

      const res = await axios.put(`${API_URL}/${selectedRecipient._id}`, payload);
      setRecipients(prev => prev.map(r => r._id === res.data._id ? res.data : r));

      setOpenEdit(false);
      setSelectedRecipient(null);
      toast.success("Recipient updated successfully!");
    } catch {
      toast.error("❌ Error updating recipient.");
    }
  };

  /* Delete Recipient */
  const handleDeleteRecipient = async () => {
    if (!recipientToDelete?._id) return;

    try {
      await axios.delete(`${API_URL}/${recipientToDelete._id}`);
      setRecipients(prev => prev.filter(r => r._id !== recipientToDelete._id));

      setOpenDelete(false);
      setRecipientToDelete(null);
      toast.success("Recipient deleted successfully!");
    } catch {
      toast.error("❌ Error deleting recipient.");
    }
  };

  /* Excel Export */
  const exportRecipients = () => {
    if (recipients.length === 0) {
      toast.warning("Nothing to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(recipients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");
    XLSX.writeFile(workbook, `recipients_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const filteredRecipients = recipients.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUrgencyColor = (value: string) => {
    switch (value) {
      case "Critical": return "bg-red-500/10 text-red-600";
      case "High": return "bg-orange-500/10 text-orange-600";
      case "Medium": return "bg-yellow-500/10 text-yellow-600";
      default: return "bg-gray-300 text-gray-600";
    }
  };

  const isAdmin = userRole.toLowerCase().includes("hospital");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RESPECTED RECIPIENTS</h1>
          <p className="text-muted-foreground">Manage recipients in the organ waiting list</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Recipient
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Recipients</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Button variant="outline" onClick={exportRecipients}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Organ Needed</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wait Time</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRecipients.map(r => (
                <TableRow key={r._id} className="hover:bg-gray-100">
                  <TableCell>{r.recipientId}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.age}</TableCell>
                  <TableCell>{r.bloodType}</TableCell>
                  <TableCell>{r.organ}</TableCell>
                  <TableCell>
                    <Badge className={getUrgencyColor(r.urgency)}>{r.urgency}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getUrgencyColor(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{r.waitTime}</TableCell>

                  {isAdmin && (
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedRecipient(r); setOpenEdit(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setRecipientToDelete(r); setOpenDelete(true); }}>
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
      {openAdd && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Recipient</h2>

            <Input placeholder="Name" value={newRecipient.name} onChange={e => setNewRecipient({ ...newRecipient, name: e.target.value })} />
            <Input type="number" placeholder="Age" value={newRecipient.age || ""} onChange={e => setNewRecipient({ ...newRecipient, age: Number(e.target.value) })} />

            <select value={newRecipient.bloodType} onChange={e => setNewRecipient({ ...newRecipient, bloodType: e.target.value })}>
              <option value="">Select Blood Type</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>

            <Input placeholder="Organ Needed" value={newRecipient.organ} onChange={e => setNewRecipient({ ...newRecipient, organ: e.target.value })} />

            <select value={newRecipient.urgency} onChange={e => setNewRecipient({ ...newRecipient, urgency: e.target.value, status: e.target.value })}>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>

            <Input placeholder="Wait Time" value={newRecipient.waitTime} onChange={e => setNewRecipient({ ...newRecipient, waitTime: e.target.value })} />

            <div className="modal-actions">
              <Button onClick={handleAddRecipient}>Add</Button>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {openEdit && selectedRecipient && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Recipient</h2>

            <Input placeholder="Name" value={selectedRecipient.name} onChange={e => setSelectedRecipient({ ...selectedRecipient, name: e.target.value })} />
            <Input type="number" placeholder="Age" value={selectedRecipient.age} onChange={e => setSelectedRecipient({ ...selectedRecipient, age: Number(e.target.value) })} />

            <select value={selectedRecipient.bloodType} onChange={e => setSelectedRecipient({ ...selectedRecipient, bloodType: e.target.value })}>
              <option value="">Select Blood Type</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>

            <Input placeholder="Organ Needed" value={selectedRecipient.organ} onChange={e => setSelectedRecipient({ ...selectedRecipient, organ: e.target.value })} />

            <select value={selectedRecipient.urgency} onChange={e => setSelectedRecipient({ ...selectedRecipient, urgency: e.target.value, status: e.target.value })}>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>

            <Input placeholder="Wait Time" value={selectedRecipient.waitTime} onChange={e => setSelectedRecipient({ ...selectedRecipient, waitTime: e.target.value })} />

            <div className="modal-actions">
              <Button onClick={handleUpdateRecipient}>Update</Button>
              <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {openDelete && recipientToDelete && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete {recipientToDelete.name}?</p>
            <div className="modal-actions">
              <Button variant="destructive" onClick={handleDeleteRecipient}>Delete</Button>
              <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
    </div>
  );
};

export default Recipients;
