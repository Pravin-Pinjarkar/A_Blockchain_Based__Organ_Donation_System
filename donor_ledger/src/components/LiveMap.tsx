import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import L from "leaflet";

// ✅ Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// 🚚 Truck icon
const truckIcon = new L.Icon({
  iconUrl: "https://img.icons8.com/fluency/48/truck.png",
  iconSize: [40, 40]
});

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImM2MzM4YjNlN2MyZTRmZmE5NDU5ZjE2MmQ0YTYwYjQ2IiwiaCI6Im11cm11cjY0In0=";

export default function LiveMap({ from, to, selectedShipment }: any) {
  const [loading, setLoading] = useState(true);
  const [fromCoords, setFromCoords] = useState<number[] | null>(null);
  const [toCoords, setToCoords] = useState<number[] | null>(null);
  const [route, setRoute] = useState<any[]>([]);
  const [truckPosition, setTruckPosition] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<any>(null);

  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");

  // 🔥 ETA STATES
  const [eta, setEta] = useState("");
  const [etaMessage, setEtaMessage] = useState("");

  // 📍 Convert location → coordinates
  const getCoords = async (place: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
      );
      const data = await res.json();
      if (!data.length) return null;

      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch {
      return null;
    }
  };

  // 🛣️ Get route
  const getRoute = async (fromC: any, toC: any) => {
    try {
      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: ORS_API_KEY
          },
          body: JSON.stringify({
            coordinates: [
              [fromC[1], fromC[0]],
              [toC[1], toC[0]]
            ]
          })
        }
      );

      const data = await res.json();
      if (!data?.features?.length) return;

      const coords = data.features[0].geometry.coordinates.map(
        (c: any) => [c[1], c[0]]
      );

      setRoute(coords);
      setTruckPosition(coords[0]);
      setMapCenter(coords[0]);

      const summary = data.features[0].properties.summary;

      setDistance((summary.distance / 1000).toFixed(2) + " km");

      setDuration(
        summary.duration > 3600
          ? (summary.duration / 3600).toFixed(1) + " hrs"
          : Math.round(summary.duration / 60) + " mins"
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 Load map
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const fromC = await getCoords(from);
      const toC = await getCoords(to);

      if (fromC && toC) {
        setFromCoords(fromC);
        setToCoords(toC);
        await getRoute(fromC, toC);
      }

      setLoading(false);
    };

    load();
  }, [from, to]);

  // 🚚 Update truck from backend
  useEffect(() => {
    if (!route.length) return;

    const index = selectedShipment?.liveIndex ?? 0;
    const safeIndex = Math.min(index, route.length - 1);

    if (route[safeIndex]) {
      setTruckPosition(route[safeIndex]);
      setMapCenter(route[safeIndex]);
    }
  }, [selectedShipment, route]);

  // ⏳ ETA LOGIC (REAL-TIME 🔥)
  useEffect(() => {
    if (!selectedShipment?.tracking?.startTime) return;

    const interval = setInterval(() => {
      const start = selectedShipment.tracking.startTime;
      const total = selectedShipment.tracking.totalTime * 1000;

      const now = Date.now();
      const remaining = total - (now - start);

      if (remaining <= 0) {
        setEta("0m 0s");
        setEtaMessage(" Reached destination");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      setEta(`${minutes}m ${seconds}s`);

      // 🔥 SMART MESSAGES
      if (minutes <= 1) {
        setEtaMessage("🎉 Reached destination");
      } else if (minutes <= 2) {
        setEtaMessage("🚚 Almost there");
      } else if (minutes <= 5) {
        setEtaMessage(`📍 Arriving in ${minutes} mins`);
      } else {
        setEtaMessage("🚚 On the way");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedShipment]);

  // 🔒 Loading
  if (loading) {
    return <div className="p-4 text-blue-500">Loading live tracking...</div>;
  }

  if (!fromCoords || !toCoords) {
    return <div className="p-4 text-red-500">Invalid location</div>;
  }

  // 🎉 Delivered
  if (selectedShipment?.status === "Delivered") {
    return (
      <div className="text-green-600 font-bold text-lg">
        Organ Delivered Successfully
      </div>
    );
  }

  const progress = selectedShipment?.progress || 0;

  const color =
    progress > 80
      ? "text-green-600"
      : progress > 40
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div>
      {/* 📏 Distance */}
      <div className="mb-2 font-medium">
        📏 {distance} | ⏱ {duration}
      </div>

      {/* ⏳ ETA */}
      <div className="mb-1 text-blue-600 font-semibold">
        ⏳ ETA: {eta}
      </div>

      {/* 💬 Message */}
      <div className={`mb-3 font-semibold ${color}`}>
        {etaMessage}
      </div>

      {/* 📊 Progress */}
      <div className="w-full bg-gray-200 rounded mb-3">
        <div
          className="bg-green-500 text-white text-xs text-center p-1 rounded"
          style={{ width: `${progress}%` }}
        >
          {Math.round(progress)}%
        </div>
      </div>

      {/* 🗺️ Map */}
      <MapContainer
        center={mapCenter || fromCoords}
        zoom={6}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={fromCoords}>
          <Popup>From: {from}</Popup>
        </Marker>

        <Marker position={toCoords}>
          <Popup>To: {to}</Popup>
        </Marker>

        <Polyline positions={route} color="red" />

        {truckPosition && (
          <Marker position={truckPosition} icon={truckIcon}>
            <Popup>🚚 Live Tracking</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}