"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";


import {
  matchOrganRequest,
  validateMatchForBlockchain,
} from "@/lib/organMatching";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/************* TYPE DEFINITIONS *************/
interface DonorInfo {
  id: string;
  name: string;
  organ: string;
  bloodType: string;
  age: number;
}

interface RequestInfo {
  _id: string;
  recipientName: string;
  recipientEmail: string;
  bloodTypeRequired: string;
  organ: string;
  recipientAge: number;
  urgencyLevel: "Critical" | "High" | "Medium";
}

interface MatchItem {
  request: RequestInfo;
  donor: DonorInfo;
  urgencyLevel: "Critical" | "High" | "Medium";
  donorMongoId: string;
  donorBlockchainId: string;
  matchData: unknown;
}

/************* COMPONENT *************/
export default function Matching() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  /* ==================== FCFS RUN ==================== */
  const runFCFS = async () => {
    setLoading(true);
    setError("");

    try {
      const donorRes = await fetch(`${API_URL}/donors`);
      const donors = await donorRes.json();
      const available = donors.filter(
        (d: any) => d.status === "Available" && d.matchStatus === "NotMatched"
      );

      const reqRes = await fetch(`${API_URL}/api/requests`);
      const allRequests = await reqRes.json();

      const urgencyRank = { Critical: 3, High: 2, Medium: 1, Waiting: 0, Low: 0 };


      const pending = allRequests
        .filter((r: any) => r.requestStatus === "Pending")
        .sort((a: any, b: any) => {
          const uA = urgencyRank[a.urgency] || 1;
          const uB = urgencyRank[b.urgency] || 1;
          if (uB !== uA) return uB - uA;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      if (!pending.length) {
        setMatches([]);
        setError("No pending requests");
        setLoading(false);
        return;
      }
      if (!available.length) {
        setMatches([]);
        setError("No available donors");
        setLoading(false);
        return;
      }

      const results: MatchItem[] = [];
      const used = new Set<string>();

      for (const req of pending) {
        req.recipientAge = req.recipientAge ?? req.age ?? null;
        const donorOptions = available.filter((d: any) => !used.has(d._id));
        const matchResult = matchOrganRequest(req, donorOptions);

        if (matchResult && validateMatchForBlockchain(matchResult)) {
          const m = matchResult.match;

          results.push({
            request: req,
            donor: m.donorInfo,
            urgencyLevel: req.urgency,
            donorMongoId: m.donorMongoId,
            donorBlockchainId: m.donorBlockchainId,
            matchData: matchResult,
          });

          used.add(m.donorMongoId);
        }
      }

      setMatches(results);
      if (!results.length) setError("Matching failed");
    } catch (err) {
      console.error("FCFS error:", err);
      setError("Matching failed");
    }

    setLoading(false);
  };

  /* ==================== APPROVE MATCH ==================== */
  const approve = async (item: MatchItem) => {
  const donorKey = item.donorMongoId;
  setApproving((prev) => ({ ...prev, [donorKey]: true }));

  try {
    const payload = {
      requestId: item.request._id,
      donorBlockchainId: item.donorBlockchainId,
    };

    const res = await fetch(`${API_URL}/api/match/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Approval failed");

    // 🎉 UI Toast messages for email success
    if (data.donorEmailSent) {
      toast.success("✅ Email sent to donor");
    } else {
      toast.warning("Donor email not available");
    }

    if (data.recipientEmailSent) {
      toast.success("✅ Email sent to recipient");
    } else {
      toast.warning("Recipient email not available");
    }

    toast.success("Match approved & blockchain updated");
    await runFCFS();
  } catch {
    toast.error("Approval failed");
  }

  setApproving((prev) => ({ ...prev, [donorKey]: false }));
};


  useEffect(() => {
    runFCFS();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Smart Matching</h1>
        <Button onClick={runFCFS} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Running..." : "Run FCFS"}
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex gap-2 p-4 rounded bg-amber-50 border text-amber-700">
          <AlertCircle /> {error}
        </div>
      )}

      {/* No Matches */}
      {!matches.length && !error && (
        <Card>
          <CardContent className="text-center p-10">No matches yet</CardContent>
        </Card>
      )}

      {/* Matches */}
      {matches.map((m) => (
        <Card key={m.donorMongoId}>
          <CardContent className="p-6">
            <div className="flex justify-between gap-6">
              
              {/* Donor */}
              <div className="p-4 rounded bg-muted/20 flex-1">
                <Badge>Donor</Badge>
                <h3 className="text-lg mt-1 font-semibold">{m.donor.name}</h3>
                <p className="text-xs text-muted-foreground">Blockchain ID: {m.donorBlockchainId}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{m.donor.bloodType}</Badge>
                  <Badge variant="secondary">{m.donor.organ}</Badge>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">Age: {m.donor.age}</p>
              </div>

              <div className="flex items-center text-2xl font-bold">→</div>

              {/* Recipient */}
              <div className="p-4 rounded bg-muted/20 flex-1">
                <Badge>Recipient</Badge>
                <h3 className="text-lg mt-1 font-semibold">{m.request.recipientName}</h3>
                <p className="text-xs text-muted-foreground">{m.request.recipientEmail}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{m.request.bloodTypeRequired}</Badge>
                  <Badge variant="secondary">{m.request.organ}</Badge>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">Age: {m.request.recipientAge}</p>

                {/* URGENCY BADGE */}
                <div className="mt-2">
                  {m.urgencyLevel === "Critical" && (
                    <Badge className="bg-red-100 text-red-600">Critical</Badge>
                  )}
                  {m.urgencyLevel === "High" && (
                    <Badge className="bg-orange-100 text-orange-600">High</Badge>
                  )}
                  {m.urgencyLevel === "Medium" && (
                    <Badge className="bg-blue-100 text-blue-600">Medium</Badge>
                  )}
                </div>
              </div>

              {/* Approve */}
              <div className="flex items-center">
                <Button
                  onClick={() => approve(m)}
                  disabled={approving[m.donorMongoId]}
                  className="min-w-[140px]"
                >
                  {approving[m.donorMongoId] ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" /> Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </>
                  )}
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
