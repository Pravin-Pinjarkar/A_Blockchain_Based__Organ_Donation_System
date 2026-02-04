"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import contractJSON from "@/contracts/OrganRegistry.json";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AlertCircle, CheckCircle } from "lucide-react";

const API_URL = "http://localhost:5000";
const themeColor = "#E51845"; // Connect button color

export default function Blockchain() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const contractRef = useRef<ethers.Contract | null>(null);

  const connect = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractJSON.address,
        contractJSON.abi,
        signer
      );

      contractRef.current = contract;
      setConnected(true);
      await loadEvents(contract);
      setupLiveListeners(contract);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadEvents = async (contract: ethers.Contract) => {
    try {
      const logs = await contract.queryFilter("TransactionRecorded", -6000);
      const provider = contract.runner!.provider as ethers.Provider;

      const rows: any[] = [];
      for (const log of logs) {
        const e = log as ethers.EventLog;
        const timestamp = (await provider.getBlock(e.blockNumber))?.timestamp;
        rows.push({
          donorId: e.args[0],
          patientId: e.args[1],
          txHash: e.transactionHash,
          time: timestamp,
          block: log.blockNumber,
        });
      }

      const unique = new Map();
      rows.forEach((r) => {
        const key = `${r.donorId}-${r.patientId}`;
        if (!unique.has(key) || unique.get(key).block < r.block) unique.set(key, r);
      });

      const filtered = [...unique.values()];

      const enriched = await Promise.all(
        filtered.map(async (r) => {
          const donor = await fetch(`${API_URL}/api/donors/${r.donorId}`).then((res) =>
            res.json()
          ).catch(() => ({}));
          const rec = await fetch(`${API_URL}/api/recipients/${r.patientId}`).then((res) =>
            res.json()
          ).catch(() => ({}));

          return {
            ...r,
            donorAge: donor.age ?? "-",
            donorBlood: donor.bloodType ?? "-",
            donorOrgan: donor.organ ?? "-",
            recAge: rec.age ?? "-",
            recBlood: rec.bloodType ?? "-",
            recOrgan: rec.organ ?? "-",
          };
        })
      );

      setEvents(enriched.sort((a, b) => b.block - a.block));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setupLiveListeners = (contract: ethers.Contract) => {
    contract.on("TransactionRecorded", async () => {
      await loadEvents(contract);
    });
  };

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.donorId.toLowerCase().includes(q) ||
      e.patientId.toLowerCase().includes(q) ||
      e.donorBlood.toLowerCase().includes(q) ||
      e.recBlood.toLowerCase().includes(q) ||
      e.donorOrgan.toLowerCase().includes(q) ||
      e.recOrgan.toLowerCase().includes(q)
    );
  });

  /* ------------------ EXPORT PDF ------------------ */
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(20);
    doc.text("Blockchain Organ Match Report", 15, 18);

    const tableData = filtered.map((e) => [
      e.donorId,
      e.donorAge,
      e.donorBlood,
      e.donorOrgan,
      e.patientId,
      e.recAge,
      e.recBlood,
      e.recOrgan,
      e.txHash.slice(0, 12) + "…",
      e.time ? new Date(e.time * 1000).toLocaleString() : "-",
    ]);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          "Donor ID",
          "Age",
          "Blood",
          "Organ",
          "Recipient ID",
          "Age",
          "Blood",
          "Organ",
          "Tx Hash",
          "Time",
        ],
      ],
      body: tableData,
      headStyles: {
        fillColor: [229, 24, 69],
        textColor: 255,
        fontSize: 11,
        halign: "center",
      },
      styles: { halign: "center" },
    });

    doc.save("Blockchain_Report.pdf");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>
        {!connected ? (
          <Button onClick={connect}>Connect Wallet</Button>
        ) : (
          <CheckCircle className="text-green-500" />
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 p-3 rounded flex items-center gap-2 text-red-700">
          <AlertCircle /> {error}
        </div>
      )}

      <Input
        placeholder="Search by donor / recipient / blood group / organ"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex justify-end">
        <button
          onClick={exportPDF}
          className="px-4 py-2 rounded font-semibold text-white"
          style={{ backgroundColor: themeColor }}
        >
          Export PDF
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blockchain Events ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
           <TableHeader>
              <TableRow>
                {[
                  "Donor ID",
                  "Age",
                  "Blood",
                  "Organ",
                  "Recipient ID",
                  "Age",
                  "Blood",
                  "Organ",
                  "Tx Hash",
                  "Time",
                ].map((h, i) => (
                  <TableHead
                    key={i}
                    className="text-white font-semibold text-center"
                    style={{ backgroundColor: "#4A2C2A" }}   // DARK BROWN
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

                
            <TableBody>
              {filtered.map((e, i) => (
                <TableRow
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell className="font-bold">{e.donorId}</TableCell>
                  <TableCell className="font-bold">{e.donorAge}</TableCell>
                  <TableCell className="font-bold">{e.donorBlood}</TableCell>
                  <TableCell className="font-bold">{e.donorOrgan}</TableCell>

                  <TableCell className="font-bold">{e.patientId}</TableCell>
                  <TableCell className="font-bold">{e.recAge}</TableCell>
                  <TableCell className="font-bold">{e.recBlood}</TableCell>
                  <TableCell className="font-bold">{e.recOrgan}</TableCell>

                  <TableCell>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                      target="_blank"
                      className="text-blue-600 underline font-semibold"
                    >
                      {e.txHash.slice(0, 12)}…
                    </a>
                  </TableCell>

                  <TableCell className="font-semibold">
                    {e.time ? new Date(e.time * 1000).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
