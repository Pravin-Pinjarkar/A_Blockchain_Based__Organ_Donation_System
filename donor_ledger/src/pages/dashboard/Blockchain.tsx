"use client";
import LiveMap from "@/components/LiveMap";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import contractJSON from "@/contracts/OrganRegistry.json";
import {
  Card, CardHeader, CardContent, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell
} from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CheckCircle } from "lucide-react";
import Swal from "sweetalert2";
import QRCode from "react-qr-code";
const API_URL = "http://localhost:5000";
const themeColor = "#E51845";
import { QRCodeCanvas } from "qrcode.react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { io } from "socket.io-client";

export default function Blockchain() {

  const [connected, setConnected] = useState(false);
  //state for get shipment modal
  const [openGetModal, setOpenGetModal] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [trackData, setTrackData] = useState<any>(null);
  const [account, setAccount] = useState("");
  const [shipments, setShipments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [latestMatch, setLatestMatch] = useState<any>(null);

  //Ai Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);

  //state for start shipment modal
  const [openStartModal, setOpenStartModal] = useState(false);
  const [startData, setStartData] = useState({
  receiver: "",
  recipientId: ""
});

  const [openModal, setOpenModal] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    receiver: "",
    pickupTime: "",
    distance: "",
    price: "",
  });

//send organ Modal
const [openSendModal, setOpenSendModal] = useState(false);

//location tracking state
const [fromLocation, setFromLocation] = useState("");
const [toLocation, setToLocation] = useState("");
const [selectedShipment, setSelectedShipment] = useState<any>(null);
const [openTrackModal, setOpenTrackModal] = useState(false);

const [sendData, setSendData] = useState({
  receiver: "",
  recipientId: "",
  organ: "",
  distance: "",
  price: "",
  adminWallet: ""
});


//complete shipment state
const [openCompleteModal, setOpenCompleteModal] = useState(false);

const [completeData, setCompleteData] = useState({
  receiver: "",
  recipientId: ""
});


//shipments count modal
const [openCountModal, setOpenCountModal] = useState(false);
const [completedShipments, setCompletedShipments] = useState<any[]>([]);


const [stats, setStats] = useState({
  pending: 0,
  transit: 0,
  completed: 0
});

const handleShipmentCount = () => {
  const completed = shipments.filter(
    (s: any) =>
      s.status === "Delivered" &&
      s.paid === "Payment Completed"
  );

  const pending = shipments.filter((s:any)=> s.status === "Pending").length;
  const transit = shipments.filter((s:any)=> s.status === "IN_TRANSIT").length;
  const done = completed.length;

  setStats({ pending, transit, completed: done });
  setCompletedShipments(completed);
  setOpenCountModal(true);
};

//user profile modal state
const [openProfileModal, setOpenProfileModal] = useState(false);
const [profileDetails, setProfileDetails] = useState<any>(null);
const [userShipments, setUserShipments] = useState<any[]>([]);

const [profile, setProfile] = useState({
  recipientId: "",
  wallet: "",
  balance: "",
  network: "",
  photo: ""
});

//other modal states
  const contractRef = useRef<ethers.Contract | null>(null);

  //location tracking socket
  const socketRef = useRef<any>(null);
  useEffect(() => {
  loadShipments();
  loadLatestMatch();
}, []);

useEffect(() => {
  socketRef.current = io("http://localhost:5000");

  return () => {
    socketRef.current.disconnect();
  };
}, []);


useEffect(() => {
  const handler = (data) => {
    if (data.recipientId === selectedShipment?.matchingRecipientId) {
      setSelectedShipment(prev => ({
        ...prev,
        liveIndex: data.index,
        progress: data.progress,
        status: data.status
      }));
    }
  };

  socketRef.current.on("shipmentUpdate", handler);

  return () => {
    socketRef.current.off("shipmentUpdate", handler);
  };
}, [selectedShipment?.matchingRecipientId]);


//metaMask connection and load shipments + latest match
  const connect = async () => {
    try {
      if (!(window as any).ethereum) {
        Swal.fire("Error", "MetaMask not installed", "error");
        return;
      }

      await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);

      const contract = new ethers.Contract(
        contractJSON.address,
        contractJSON.abi,
        signer
      );

      contractRef.current = contract;
      setConnected(true);

      await loadShipments();
      await loadLatestMatch();

    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const loadShipments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shipments`);
      const data = await res.json();

      const unique = new Map();
      data.forEach((s: any) => unique.set(s.txHash, s));

      setShipments([...unique.values()]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLatestMatch = async () => {
    try {
      const res = await fetch(`${API_URL}/api/latest-match`);
      const data = await res.json();
      setLatestMatch(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadShipments();
    loadLatestMatch();
  }, []);



  /* =========================================================
     🔥 NEW FUNCTION (AUTO FETCH SEND ORGAN DATA)
  ========================================================== */
 const fetchSendData = async (recipientId: string) => {
  try {
    if (!recipientId) return;

    const res = await fetch(`${API_URL}/api/send-organ/${recipientId}`);

    if (!res.ok) return;

    const data = await res.json();

    // ✅ PREVENT CRASH
    if (!data || !data.organ) {
      console.log("No data");
      return;
    }

    setSendData((prev) => ({
      ...prev,
      organ: data.organ || "",
      distance: data.distance || "",
      price: data.price ? data.price.toString() : ""
    }));

  } catch (err) {
    console.error(err);
  }
};



  //create shipmentt process

  const createShipment = async () => {
  try {
    if (!contractRef.current) {
      Swal.fire("Error", "Connect wallet first", "error");
      return;
    }

    if (!latestMatch) {
      Swal.fire("No Match", "No matching record found!", "warning");
      return;
    }

    const tx = await contractRef.current.createShipment(
      shipmentData.receiver,
      shipmentData.pickupTime,
      Number(shipmentData.distance),
      ethers.parseEther(shipmentData.price.toString())
    );

    const receipt = await tx.wait();
    const txHash = receipt.hash;

    // ✅ SAVE TO BACKEND
    const res = await fetch(`${API_URL}/api/blockchain-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      senderAddress: sendData.adminWallet,
      receiverAddress: shipmentData.receiver,   // ✅ FIXED

      recipientId: latestMatch?.recipientId,    // ✅ KEEP ID
      matchingDonorId: latestMatch?.donorId,
      matchingRecipientId: latestMatch?.recipientId,

      txHash,
      organ: latestMatch?.organ || "Unknown",
      distance: Number(shipmentData.distance),
      price: Number(shipmentData.price),
      pickupTime: shipmentData.pickupTime,

      type: "shipment",
    })

    });

    const result = await res.json();

    if (!result.success) {
      Swal.fire("Error", "Failed to save shipment", "error");
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Shipment Created",
      confirmButtonColor: themeColor,
    });

    // ✅ UPDATE TABLE
    setShipments((prev) => [result.event, ...prev]);

    // ✅ FETCH NEXT MATCH (FIFO)
    const matchRes = await fetch(`${API_URL}/api/latest-match`);
    const newMatch = await matchRes.json();

    if (matchRes.ok && newMatch) {
      setLatestMatch(newMatch);
    } else {
      setLatestMatch(null);
    }

    setOpenModal(false);

    setShipmentData({
      receiver: "",
      pickupTime: "",
      distance: "",
      price: "",
    });

  } catch (err: any) {
    Swal.fire("Error", err.message, "error");
  }
};

// get shipment process
const getShipmentDetails = async () => {
  try {
    if (!trackId) {
      Swal.fire("Error", "Enter Recipient ID", "warning");
      return;
    }

    const res = await fetch(`${API_URL}/api/shipment/${trackId}`);

    if (!res.ok) {
      Swal.fire("Not Found", "No shipment found!", "error");
      return;
    }

    const data = await res.json();
    setTrackData(data);

  } catch (err: any) {
    Swal.fire("Error", err.message, "error");
  }
};


//start shipment process
const startShipment = async () => {
  try {
    if (!contractRef.current) {
      Swal.fire("Error", "Connect wallet first", "error");
      return;
    }

    if (!startData.receiver || !startData.recipientId) {
      Swal.fire("Error", "Fill all fields", "warning");
      return;
    }

    // 🔥 CALL SMART CONTRACT → METAMASK POPUP
    const tx = await contractRef.current.startShipment(
      startData.receiver,
      startData.recipientId
    );

    await tx.wait();

    // 🔥 UPDATE DATABASE STATUS
const res = await fetch(`${API_URL}/api/shipment/start/${startData.recipientId}`, {
  method: "PUT"
});

const data = await res.json();

if (!res.ok) {
  Swal.fire("Error", data.message || "Cannot start shipment", "error");
  return;
}

Swal.fire("Success", "Shipment Started (IN_TRANSIT)", "success");

    //  REFRESH TABLE
    await loadShipments();

    setOpenStartModal(false);
    setStartData({ receiver: "", recipientId: "" });

  } catch (err: any) {
    Swal.fire("Error", err.message, "error");
  }
};


///send organ shipment Process
const payOrganFees = async () => {
  try {
    if (!(window as any).ethereum) {
      Swal.fire("Error", "MetaMask not installed", "error");
      return;
    }

    if (!sendData.adminWallet) {
      Swal.fire("Error", "Enter Hospital Admin Wallet Address", "error");
      return;
    }

    if (!fromLocation.trim() || !toLocation.trim()) {
  Swal.fire("Error", "Enter both locations", "warning");
  return;
}

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();

    // ✅ Convert ETH (string) → BigInt
    const amount = ethers.parseEther(sendData.price.toString());

    // 🚀 SEND PAYMENT TO ADMIN WALLET
    const tx = await signer.sendTransaction({
      to: sendData.adminWallet,
      value: amount,
    });

    await tx.wait();


//route time estimation (bonus feature)
     const getRouteTime = async (from, to) => {
  try {
    const getCoords = async (place) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
      );
      const data = await res.json();

      if (!data.length) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    };

    const fromC = await getCoords(from);
    const toC = await getCoords(to);

    if (!fromC || !toC) return null;

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImM2MzM4YjNlN2MyZTRmZmE5NDU5ZjE2MmQ0YTYwYjQ2IiwiaCI6Im11cm11cjY0In0="
        },
        body: JSON.stringify({
          coordinates: [
            [fromC.lng, fromC.lat],
            [toC.lng, toC.lat]
          ]
        })
      }
    );

    const data = await res.json();

    if (!data?.features?.length) return null;

    const summary = data.features[0].properties.summary;

    return {
      duration: summary.duration, // ✅ seconds
      distance: summary.distance,
      routeLength: data.features[0].geometry.coordinates.length
    };

  } catch (err) {
    console.error(err);
    return null;
  }
};

          // ✅ 1. UPDATE PAYMENT STATUS
          const res = await fetch(`${API_URL}/api/shipment/pay/${sendData.recipientId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromLocation,
              toLocation,
              adminWallet: sendData.adminWallet
            })
          });

          const data = await res.json();

          if (!res.ok) {
            Swal.fire("Error", data.message, "error");
            return;
          }

          
         // ✅ 2. GET REAL ROUTE DATA
        const routeData = await getRouteTime(fromLocation, toLocation);

        if (!routeData) {
          Swal.fire("Error", "Unable to calculate route", "error");
          return;
        }

        const etaMinutes = Math.ceil(routeData.duration / 60);

        // ✅ 3. START TRACKING (DYNAMIC 🔥)
        await fetch(`${API_URL}/api/start-tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: sendData.recipientId,
            routeLength: routeData.routeLength,   // ✅ REAL POINTS
            totalTime: routeData.duration         // ✅ REAL TIME (SECONDS)
          })
        });
          // ✅ 3. UI SUCCESS
          Swal.fire({
            icon: "success",
            title: "Payment Successful!",
            text: `Organ fees paid and tracking started 🚚 Estimated Delivery Time: ${etaMinutes} minutes`,
            confirmButtonColor: "#16a34a"
          });

      await loadShipments();
      setFromLocation("");
      setToLocation("");
      setOpenSendModal(false);

        } catch (err: any) {
          Swal.fire("Error", err.message, "error");
        }
      };


//complete shipment process
const completeShipment = async () => {
  try {
    if (!contractRef.current) {
      Swal.fire("Error", "Connect wallet first", "error");
      return;
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);

    // 🔥 CALL CONTRACT
    const tx = await contractRef.current.completeShipment(
      completeData.receiver,
      completeData.recipientId
    );

    // WAIT FOR CONFIRMATION
    const receipt = await tx.wait();

    // 🔥 GET BLOCK TIMESTAMP
    const block = await provider.getBlock(receipt.blockNumber);
    const deliveryTime = new Date(block.timestamp * 1000).toISOString();

    // 🔥 SEND TO BACKEND
    const res = await fetch(`${API_URL}/api/shipment/complete/${completeData.recipientId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deliveryTime })
          });

          const data = await res.json();

          if (!res.ok) {
            Swal.fire("Error", data.message, "error");
            return;
          }

          Swal.fire({
        icon: "success",
        title: "Shipment Completed",
        text: `${completeData.recipientId} shipment completed and Requested Organ is out for Delivery`,
      });

    await loadShipments();

    setOpenCompleteModal(false);

  } catch (err: any) {
    Swal.fire("Error", err.message, "error");
  }
};


//user profile loading function
const loadUserProfile = async () => {
  try {
    if (!(window as any).ethereum) return;

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();

    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    // 🔥 GET USER EMAIL (IMPORTANT)
    const email = localStorage.getItem("email");

    // 🔥 FETCH USER DETAILS (PROFILE IMAGE FROM DB)
    let profilePhoto = "/organ.png";

    if (email) {
      const userRes = await fetch(`${API_URL}/api/userdetails/${email}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        profilePhoto = userData.profilePhoto || "/organ.png";
      }
    }

    // 🔥 GET ALL SHIPMENTS
    const res = await fetch(`${API_URL}/api/shipments`);
    const data = await res.json();

    // 🔥 FILTER USER SHIPMENTS (BY WALLET)
    const userData = data.filter(
      (s: any) =>
        s.receiverAddress?.toLowerCase() === address.toLowerCase()
    );

    // 🔥 LATEST SHIPMENT
    // const latest = userData[0];

    const latest = userData.sort(
  (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
)[0];

    // ✅ SET PROFILE
    setProfile({
      recipientId: latest?.matchingRecipientId || "N/A",
      wallet: address,
      balance: ethers.formatEther(balance),
      network: network.name,
      photo: profilePhoto // ✅ FIXED (FROM DB)
    });

    // ✅ EXTRA DETAILS
    setProfileDetails({
      donorId: latest?.matchingDonorId,
      organ: latest?.organ,
      distance: latest?.distance,
      price: latest?.price
    });

    setUserShipments(userData);

  } catch (err) {
    console.error(err);
  }
};


//filter shipments based on search query (donorId, recipientId, matchingDonorId, matchingRecipientId)
  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.senderAddress || "N/A").toLowerCase().includes(q) ||
      s.recipientId?.toLowerCase().includes(q) ||
      s.matchingDonorId?.toLowerCase().includes(q) ||
      s.matchingRecipientId?.toLowerCase().includes(q)
    );
  });


  const exportPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Shipment Report", 14, 15);

  const tableData = filtered.map((s) => [
    s.senderAddress || "N/A",
    s.recipientId,
    s.matchingDonorId,
    s.matchingRecipientId,
    s.pickupTime,
    `${s.distance} Km`,
    s.price,
    s.deliveryTime
  ? new Date(s.deliveryTime).toLocaleString()
  : "-",
    s.paid,
    s.status,
  ]);

  autoTable(doc, {
    head: [[
      "Sender",
      "Receiver",
      "Donor ID",
      "Recipient ID",
      "Pickup",
      "Distance",
      "Price",
      "Delivery",
      "Paid",
      "Status"
    ]],
    body: tableData,
    startY: 25,
  });

  doc.save("shipments.pdf");
};


// Location tracking function
const getCoords = async (place: string) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
  );
  const data = await res.json();

  if (!data.length) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
};


// AI (Chatbot Integrated)
const Chatbot = ({ currentShipment }: any) => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi 👋 I can help you with organ donation!" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          message: input,
          shipment: currentShipment
        })
      });

      const data = await res.json();

      const botMsg = { sender: "bot", text: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "Error connecting to AI" }]);
    }

    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white shadow-2xl rounded-xl p-4 z-50 animate-fadeIn">
      <div className="font-bold text-[#E51845] mb-2">AI Assistant</div>

      <div className="h-60 overflow-y-auto mb-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
            <span className={`px-3 py-2 rounded-lg inline-block ${msg.sender === "user" ? "bg-[#E51845] text-white" : "bg-gray-200"}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Ask about organ, shipment..."
        />
        <button
          onClick={sendMessage}
          className="bg-[#E51845] text-white px-3 rounded hover:scale-105 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};
<Chatbot currentShipment={shipments[0]} />




  return (
    <div className="p-6 space-y-6 no-select">

       {/* 🤖 AI CHATBOT */}
    {/* {showChatbot && (
  <Chatbot currentShipment={shipments[0]} />
)} */}

      {/* CSS */}
      <style>{`
        .no-select * { user-select: none; }
        input { user-select: text; }

        .modal-bg { animation: fadeIn 0.3s ease; }
        .modal-box { animation: scaleIn 0.3s ease; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

                    @keyframes slideUp {
              from {
                transform: translateY(40px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }

            .modal-box {
              animation: slideUp 0.4s ease;
            }

            @keyframes glow {
                0% { box-shadow: 0 0 5px #E51845; }
                50% { box-shadow: 0 0 20px #E51845; }
                100% { box-shadow: 0 0 5px #E51845; }
              }

              .profile-glow {
                animation: glow 2s infinite;
              }
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }

                .animate-fadeIn {
                  animation: fadeIn 0.5s ease;
                }
                                .chatbot {
                animation: slideUp 0.4s ease;
              }
      `}</style>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>

        {!connected ? (
          <Button onClick={connect}>Connect Wallet</Button>
        ) : (
          <CheckCircle className="text-green-500" />
        )}
      </div>

      <Input
        placeholder="Search shipment..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex justify-end">
        <button
          onClick={exportPDF}
          className="px-4 py-2 text-white rounded"
          style={{ backgroundColor: themeColor }}
        >
          Export PDF
        </button>
      </div>

      {/* ✅ RESTORED BUTTONS */}
      <div className="grid grid-cols-3 gap-4">
        {[
            "Start Shipment",
            "Send Organ",
            "Get Shipment",
            "Complete Shipment",
            "Shipments Count",
            "User Profile",
          ].map((text, i) => (
            <Card
              key={i}
              className="text-white bg-[#4A2C2A] text-center p-6 font-bold cursor-pointer"
              onClick={() => {
                if (text === "Start Shipment") setOpenStartModal(true);
                if (text === "Get Shipment") setOpenGetModal(true);
                if (text === "Send Organ") setOpenSendModal(true); 
                if (text === "Complete Shipment") setOpenCompleteModal(true);  
                if (text === "Shipments Count") handleShipmentCount();
                if (text === "User Profile") {
                  loadUserProfile();
                  setOpenProfileModal(true);
                }
              }}
            >
              {text}
            </Card>
          ))}
      </div>

      <Button
        onClick={async () => {
          await loadShipments();
          await loadLatestMatch();
          setOpenModal(true);
        }}
        className="text-white bg-[#4A2C2A]"
      >
        Track Organ
      </Button>

      {/* TRACK ORGAN MODAL */}
      {openModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 modal-bg">
    <div className="bg-white p-6 rounded space-y-4 w-[400px] modal-box">
      
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Create Shipment</h2>
              <button onClick={() => setOpenModal(false)}>✕</button>
            </div>

            {latestMatch && (
              <div>
                <p>Donor: {latestMatch.matchingDonorId || latestMatch.donorId}</p>
                <p>Recipient: {latestMatch.matchingRecipientId || latestMatch.recipientId}</p>
              </div>
            )}
            

            <Input placeholder="Receiver"
              onChange={(e) => setShipmentData({ ...shipmentData, receiver: e.target.value })}
            />
            <Input type="date"
              onChange={(e) => setShipmentData({ ...shipmentData, pickupTime: e.target.value })}
            />
            <Input placeholder="Distance"
              onChange={(e) => setShipmentData({ ...shipmentData, distance: e.target.value })}
            />
            <Input placeholder="Price"
              onChange={(e) => setShipmentData({ ...shipmentData, price: e.target.value })}
            />

            <Button onClick={createShipment}>Create Shipment</Button>
            <Button variant="outline" onClick={() => setOpenModal(false)}>Cancel</Button>

          </div>
        </div>
      )}



{/* LOCATION MODAL */}
{openTrackModal && selectedShipment && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    
    <div className="bg-white p-6 rounded w-[600px] space-y-4">

      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Track Organ</h2>
        <button onClick={() => setOpenTrackModal(false)}>✕</button>
      </div>

      {/* 📍 ROUTE */}
      <p>
        📍 {selectedShipment.fromLocation} → {selectedShipment.toLocation}
      </p>

      {/* 🗺️ LIVE MAP */}
      {selectedShipment?.fromLocation?.length > 2 &&
 selectedShipment?.toLocation?.length > 2 && (
  <LiveMap
    from={selectedShipment.fromLocation}
    to={selectedShipment.toLocation}
    selectedShipment={selectedShipment}
  />
)}

    </div>
  </div>
)}




  {/* GET SHIPMENT MODAL */}
      {openGetModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 modal-bg">
    <div className="bg-white p-6 rounded space-y-4 w-[400px] modal-box">

      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Product Tracking Details</h2>
        <button onClick={() => {
          setOpenGetModal(false);
          setTrackData(null);
        }}>✕</button>
      </div>

      <Input
        placeholder="Enter Recipient ID (e.g. R-0037)"
        value={trackId}
        onChange={(e) => setTrackId(e.target.value)}
      />

      <Button onClick={getShipmentDetails}>
        Get details
      </Button>

      {/* ✅ RESULT DISPLAY */}
      {trackData && (
        <div className="text-sm space-y-1 mt-3">
          <p><b>Sender:</b> {trackData.senderAddress}</p>
          <p><b>Receiver:</b> {trackData.receiverAddress || "N/A"}</p>
          <p><b>Donor ID:</b> {trackData.matchingDonorId}</p>
          <p><b>Recipient ID:</b> {trackData.matchingRecipientId}</p>
          <p><b>Pickup Time:</b> {trackData.pickupTime}</p>
          <p><b>Delivery Time:</b> {trackData.deliveryTime || 0}</p>
          <p><b>Distance:</b> {trackData.distance} Km</p>
          <p><b>Price:</b> {trackData.price}</p>
          <p><b>Status:</b> {trackData.status}</p>
          <p><b>Paid:</b> {trackData.paid}</p>
        </div>
      )}

    </div>
  </div>
)}


{/* START SHIPMENT MODAL */}
{openStartModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 modal-bg">
    <div className="bg-white p-6 rounded space-y-4 w-[400px] modal-box">

      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Start The Shipping</h2>
        <button onClick={() => setOpenStartModal(false)}>✕</button>
      </div>

      <Input
        placeholder="Receiver Wallet Address"
        value={startData.receiver}
        onChange={(e) =>
          setStartData({ ...startData, receiver: e.target.value })
        }
      />

      <Input
        placeholder="Recipient ID (e.g. R-0037)"
        value={startData.recipientId}
        onChange={(e) =>
          setStartData({ ...startData, recipientId: e.target.value })
        }
      />

      <Button
        onClick={startShipment}
        className="w-full bg-purple-600 text-white"
      >
        Start Shipment
      </Button>

    </div>
  </div>
)}




{/* SEND ORGAN MODAL */}
{openSendModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 modal-bg">
    <div className="bg-white p-6 rounded space-y-4 w-[400px] modal-box">

      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Send Organ</h2>
        <button onClick={() => setOpenSendModal(false)}>✕</button>
      </div>

      <Input
        placeholder="Recipient Wallet Address"
        value={sendData.receiver}
        onChange={(e) =>
          setSendData({ ...sendData, receiver: e.target.value })
        }
      />

      <Input
      placeholder="Hospital Admin Wallet Address"
      value={sendData.adminWallet}
      onChange={(e) =>
        setSendData({ ...sendData, adminWallet: e.target.value })
      }
    />

     <Input
        placeholder="Recipient ID"
        value={sendData.recipientId}
        onChange={(e) => {
          const id = e.target.value;

          setSendData({ ...sendData, recipientId: id });

          // ✅ CALL ONLY WHEN FULL ID ENTERED
          if (id.length >= 6) {
            fetchSendData(id);
          }
        }}
      />

        <Input
          placeholder="From Location (Donor City)"
          value={fromLocation}
          onChange={(e) => setFromLocation(e.target.value)}
        />

        <Input
          placeholder="To Location (Recipient City)"
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
        />

      <Input
        placeholder="Organ"
        value={sendData.organ}
        onChange={(e) =>
          setSendData({ ...sendData, organ: e.target.value })
        }
      />

      <Input
        placeholder="Distance"
        value={sendData.distance}
        onChange={(e) =>
          setSendData({ ...sendData, distance: e.target.value })
        }
      />

      <Input
        placeholder="Price (in ETH)"
        value={sendData.price}
        onChange={(e) =>
          setSendData({ ...sendData, price: e.target.value })
        }
      />

  {/* <div className="flex justify-center mt-4">
  <img
    src="/logo.jpeg"
    alt="QR Code"
    className="w-64 h-64 object-contain"
  />
</div> */}

<Button
  onClick={payOrganFees}
  className="w-full bg-green-600 text-white"
>
  Pay Organ Fees
</Button>

    </div>
  </div>
)}



{/* COMPLETE SHIPMENT MODAL */}
{openCompleteModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded space-y-4 w-[400px]">

      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Complete Shipment</h2>
        <button onClick={() => setOpenCompleteModal(false)}>✕</button>
      </div>

      <Input
        placeholder="Receiver Wallet Address"
        value={completeData.receiver}
        onChange={(e) =>
          setCompleteData({ ...completeData, receiver: e.target.value })
        }
      />

      <Input
        placeholder="Recipient ID"
        value={completeData.recipientId}
        onChange={(e) =>
          setCompleteData({ ...completeData, recipientId: e.target.value })
        }
      />

      <Button
        onClick={completeShipment}
        className="w-full bg-blue-600 text-white"
      >
        Complete Shipment
      </Button>

    </div>
  </div>
)}




{/* SHIPMENT COUNT MODAL */}
{openCountModal && (
  <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 modal-bg">
    
    <div className="bg-white p-6 rounded-xl w-[600px] modal-box shadow-2xl">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-[#E51845]">
          Shipment Analytics
        </h2>
        <button onClick={() => setOpenCountModal(false)}>✕</button>
      </div>

      {/* 🔥 COUNT SUMMARY */}
      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div className="p-4 bg-yellow-100 rounded-lg">
          <p className="text-lg font-bold">{stats.pending}</p>
          <p>Pending</p>
        </div>

        <div className="p-4 bg-blue-100 rounded-lg">
          <p className="text-lg font-bold">{stats.transit}</p>
          <p>In Transit</p>
        </div>

        <div className="p-4 bg-green-100 rounded-lg">
          <p className="text-lg font-bold">{stats.completed}</p>
          <p>Completed</p>
        </div>
      </div>

      {/* 🔥 PIE CHART */}
      <div className="flex justify-center mb-6">
        <PieChart width={250} height={250}>
          <Pie
            data={[
              { name: "Pending", value: stats.pending },
              { name: "Transit", value: stats.transit },
              { name: "Completed", value: stats.completed }
            ]}
            dataKey="value"
            outerRadius={100}
            label
          >
            <Cell fill="#facc15" />
            <Cell fill="#3b82f6" />
            <Cell fill="#22c55e" />
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* 🔥 COMPLETED LIST */}
      <div className="max-h-[200px] overflow-y-auto border rounded p-3">
        <h3 className="font-semibold mb-2">Completed Shipments</h3>

        {completedShipments.length === 0 ? (
          <p className="text-gray-500">No completed shipments</p>
        ) : (
          completedShipments.map((s, i) => (
            <div
              key={i}
              className="p-2 bg-green-50 rounded mb-2 animate-pulse"
            >
              ✅ {s.matchingRecipientId}
            </div>
          ))
        )}
      </div>

    </div>
  </div>
)}


{/* USER PROFILE MODAL */}
{openProfileModal && (
  <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 modal-bg">

    <div className="bg-white p-6 rounded-2xl w-[500px] modal-box shadow-2xl">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-[#E51845]">
          User Profile
        </h2>
        <button onClick={() => setOpenProfileModal(false)}>✕</button>
      </div>

      {/* PROFILE IMAGE */}
     <div className="flex justify-center mb-4 cursor-pointer">
  <label>
    <img
      src={profile.photo || "/profile.jpg"}
      alt="profile"
      className="w-24 h-24 rounded-full border-4 border-[#E51845] shadow-lg hover:scale-110 transition"
    />
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const email = localStorage.getItem("email"); // 👈 IMPORTANT

  const formData = new FormData();
  formData.append("photo", file);
  formData.append("email", email || "");

  const res = await fetch(`${API_URL}/api/upload-profile`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (data.success) {
    setProfile((prev) => ({
      ...prev,
      photo: data.imageUrl
    }));
  }
}}

      
    />
  </label>
</div>

      {/* INFO */}
      <div className="space-y-3 text-sm">

        <div className="p-3 bg-gray-100 rounded-lg">
          <b>Recipient ID:</b> {profile.recipientId}
        </div>

        <div className="p-3 bg-gray-100 rounded-lg break-all">
          <b>Wallet:</b> {profile.wallet}
        </div>

        <div className="p-3 bg-gray-100 rounded-lg">
          <b>Balance:</b> {Number(profile.balance).toFixed(4)} ETH
        </div>

        <div className="p-3 bg-gray-100 rounded-lg">
          <b>Network:</b> {profile.network}
        </div>

      </div>

          {/* 🧬 DONOR + ORGAN INFO */}
          <div className="mt-4 space-y-2">

            <h3 className="font-semibold text-[#E51845]">Donor & Organ Details</h3>

            <div className="p-3 bg-red-50 rounded-lg">
              <b>Donor ID:</b> {profileDetails?.donorId || "N/A"}
            </div>

            <div className="p-3 bg-red-50 rounded-lg">
              <b>Organ:</b> {profileDetails?.organ || "N/A"}
            </div>

            <div className="p-3 bg-red-50 rounded-lg">
              <b>Distance:</b> {profileDetails?.distance} Km
            </div>

          </div>


      {/* ACTION */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            window.open(
              `https://sepolia.etherscan.io/address/${profile.wallet}`,
              "_blank"
            );
          }}
          className="px-6 py-2 bg-[#E51845] text-white rounded-lg hover:scale-105 transition"
        >
          View Blockchain Activity
        </button>
      </div>

    </div>
  </div>
)}



      {/* BLOCKCHAIN TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Tracking ({filtered.length})</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-auto max-h-[400px] border">
            <Table className="min-w-[1200px]">
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  {["Sender","Receiver","Donor ID","Recipient ID","Pickup","Distance","Price","Delivery","Paid","Status","Actions","Location","Track"]
                    .map((h,i)=><TableHead key={i}>{h}</TableHead>)}
                </TableRow>
              </TableHeader>

                              <TableBody>
                  {filtered.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.senderAddress || "N/A"}</TableCell>
                      <TableCell>{s.receiverAddress || "N/A"}</TableCell>
                      <TableCell>{s.matchingDonorId}</TableCell>
                      <TableCell>{s.matchingRecipientId}</TableCell>
                      <TableCell>{s.pickupTime}</TableCell>
                      <TableCell>{s.distance} Km</TableCell>
                      <TableCell>{s.price}</TableCell>

                      <TableCell>
                        {s.deliveryTime? new Date(s.deliveryTime).toLocaleString() : "—"}
                      </TableCell>

                                   

                      <TableCell>{s.paid}</TableCell>
                      <TableCell>{s.status}</TableCell>

                

                      {/* 🔥 ACTION BUTTONS COLUMN */}
                      <TableCell className="space-x-2">

                        {/* START */}
                        <Button
                          size="sm"
                          disabled={s.status !== "Pending"}
                          onClick={() => {
                            setStartData({
                              receiver: s.receiver,
                              recipientId: s.matchingRecipientId
                            });
                            setOpenStartModal(true);
                          }}
                          className={`${
                            s.status === "Pending"
                              ? "bg-blue-600"
                              : "bg-gray-400 cursor-not-allowed"
                          } text-white`}
                        >
                          Start
                        </Button>

                        {/* PAY */}
                        <Button
                          size="sm"
                          disabled={s.status !== "IN_TRANSIT" || s.paid === "Payment Completed"}
                          onClick={() => {
                            setSendData({
                              ...sendData,
                              receiver: s.receiver,
                              recipientId: s.matchingRecipientId,
                              price: s.price?.toString(),
                              distance: s.distance?.toString(),
                              organ: s.organ || ""
                            });
                            setOpenSendModal(true);
                          }}
                          className={`${
                            s.paid !== "Payment Completed"
                              ? "bg-green-600"
                              : "bg-gray-400 cursor-not-allowed"
                          } text-white`}
                        >
                          Pay
                        </Button>

                        {/* COMPLETE */}
                        <Button
                          size="sm"
                          disabled={s.status !== "IN_TRANSIT" || s.paid !== "Payment Completed"}
                          onClick={() => {
                            setCompleteData({
                              receiver: s.receiver,
                              recipientId: s.matchingRecipientId
                            });
                            setOpenCompleteModal(true);
                          }}
                          className={`${
                            s.status === "IN_TRANSIT"
                              ? "bg-purple-600"
                              : "bg-gray-400 cursor-not-allowed"
                          } text-white`}
                        >
                          Complete
                        </Button>

                      </TableCell>

                    <TableCell>
                  <span className="text-sm font-medium text-blue-600">
                    📍 {s.fromLocation || "N/A"}
                  </span>
                  <span className="mx-1">→</span>
                  <span className="text-sm font-medium text-green-600">
                    {s.toLocation || "N/A"}
                  </span>
                </TableCell>
                      <TableCell>
          <Button
              onClick={async () => {
                setSelectedShipment(s);
                setOpenTrackModal(true);

                const fromCoords = await getCoords(s.fromLocation);
                const toCoords = await getCoords(s.toLocation);

                if (!fromCoords || !toCoords) {
                  alert("Invalid location");
                  return;
                }

                const routeRes = await fetch(
                  "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImM2MzM4YjNlN2MyZTRmZmE5NDU5ZjE2MmQ0YTYwYjQ2IiwiaCI6Im11cm11cjY0In0="
                    },
                    body: JSON.stringify({
                      coordinates: [
                        [fromCoords.lng, fromCoords.lat],
                        [toCoords.lng, toCoords.lat]
                      ]
                    })
                  }
                );

                const routeData = await routeRes.json();

                const route = routeData.features[0].geometry.coordinates;
                const totalTime =
                  routeData.features[0].properties.summary.duration;

              }}
            >
              Track 📍
            </Button>
                </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}