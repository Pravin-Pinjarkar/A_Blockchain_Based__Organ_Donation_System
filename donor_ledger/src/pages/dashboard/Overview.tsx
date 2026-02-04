import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, HeartPulse, Building2, Activity, TrendingUp, Clock, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(API_URL);

const Overview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  const loadStats = () => {
    fetch(`${API_URL}/api/overview-stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Stats load error:", err));
  };

  useEffect(() => {
    loadStats();
    const events = [
      "donor_created",
      "recipient_created",
      "request_created",
      "request_updated",
      "match_approved",
      "hospital_created",
      "request_deleted"
    ];
    events.forEach(evt => socket.on(evt, () => loadStats()));

    return () => events.forEach(evt => socket.off(evt));
  }, []);

  if (!stats) return <div className="p-6 text-lg font-semibold">Loading dashboard...</div>;

  const cards = [
    { title: "Total Donors", value: stats.totalDonors, icon: Users, color: "text-blue-600" },
    { title: "Total Recipients", value: stats.totalRecipients, icon: HeartPulse, color: "text-red-600" },
    { title: "Total Partner Hospitals", value: stats.totalHospitals, icon: Building2, color: "text-green-600" },
    { title: "Successful Matches", value: stats.successfulMatches, icon: Activity, color: "text-purple-600" },
    { title: "Pending Requests", value: stats.pendingRequests, icon: Clock, color: "text-orange-600" },
    { title: "Blockchain Transactions", value: stats.blockchainTx, icon: TrendingUp, color: "text-indigo-600" },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-primary">LifeLink Dashboard</h1>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/signin")}>
          <ArrowLeft className="h-4 w-4" />
          Sign In
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">Updated in real-time</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 🔥 Image Section (replacing activity feed) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Together We Save Lives ❤️</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <img
            src="/donor.png"
            alt="Organ Donation"
            className="w-full rounded-lg shadow-lg object-cover"
            style={{ maxHeight: "350px" }}
          />

        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
