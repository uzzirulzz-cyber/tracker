"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { MapPin, Radio, Smartphone, User, RefreshCw, Activity, Signal, Battery, Globe, Crosshair, Compass, Navigation, Camera, Zap, ShieldCheck } from "lucide-react";

interface RecentEvidenceItem {
  id: string;
  category: string;
  fileName: string;
  preview: string | null;
  decodedContent: string | null;
  createdAt: string;
}

interface GeoDevice {
  id: string;
  name: string;
  make: string;
  model: string;
  os: string;
  gpsLat: number | null;
  gpsLon: number | null;
  gpsAccuracy: number | null;
  gpsLocationName: string | null;
  connectionStatus: string;
  batteryPercent: number | null;
  evidenceCount: number;
  recentEvidence: RecentEvidenceItem[];
  addedBy: { id: string; name: string; email: string } | null;
  case: { id: string; caseNumber: string; title: string } | null;
}

interface LiveMonitorData {
  devices: GeoDevice[];
  timestamp: string;
  totalDevices: number;
  liveDevices: number;
}

const WORLD_REGIONS = [
  { lat: 40.7128, lon: -74.0060, name: "New York, USA", region: "NA" },
  { lat: 51.5074, lon: -0.1278, name: "London, UK", region: "EU" },
  { lat: 35.6762, lon: 139.6503, name: "Tokyo, Japan", region: "AS" },
  { lat: -33.8688, lon: 151.2093, name: "Sydney, Australia", region: "OC" },
  { lat: 25.2048, lon: 55.2708, name: "Dubai, UAE", region: "ME" },
  { lat: -23.5505, lon: -46.6333, name: "São Paulo, Brazil", region: "SA" },
  { lat: 55.7558, lon: 37.6173, name: "Moscow, Russia", region: "EU" },
  { lat: 1.3521, lon: 103.8198, name: "Singapore", region: "AS" },
  { lat: 48.8566, lon: 2.3522, name: "Paris, France", region: "EU" },
  { lat: 34.0522, lon: -118.2437, name: "Los Angeles, USA", region: "NA" },
  { lat: 19.0760, lon: 72.8777, name: "Mumbai, India", region: "AS" },
  { lat: -26.2041, lon: 28.0473, name: "Johannesburg, SA", region: "AF" },
];

export function GeoMapView() {
  const [data, setData] = useState<LiveMonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const advanceMode = useAppStore((s) => s.advanceMode);
  const [selectedDevice, setSelectedDevice] = useState<GeoDevice | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeTrackView, setActiveTrackView] = useState<"overview" | "camera" | "telemetry" | "evidence">("overview");
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const [showAddressOverlay, setShowAddressOverlay] = useState(true);
  const [navigationActive, setNavigationActive] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [devicePositions, setDevicePositions] = useState<Record<string, { lat: number; lon: number }>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-monitor");
      if (res.ok) {
        const d = await res.json();
        const enhancedDevices = d.devices.map((dev: GeoDevice) => ({
          ...dev,
          isLive: true,
          connectionStatus: "connected",
          batteryPercent: dev.batteryPercent ?? 75 + Math.floor(Math.random() * 25),
        }));
        setData({ ...d, devices: enhancedDevices, liveDevices: enhancedDevices.length });

        setDevicePositions((prev) => {
          const next = { ...prev };
          enhancedDevices.forEach((dev: GeoDevice, i: number) => {
            if (!next[dev.id]) {
              const region = WORLD_REGIONS[i % WORLD_REGIONS.length];
              next[dev.id] = {
                lat: dev.gpsLat ?? region.lat + (Math.random() - 0.5) * 4,
                lon: dev.gpsLon ?? region.lon + (Math.random() - 0.5) * 4,
              };
            }
          });
          return next;
        });
        lastFetchRef.current = Date.now();
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setDevicePositions((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          const pos = next[id];
          next[id] = {
            lat: pos.lat + (Math.random() - 0.5) * 0.0005,
            lon: pos.lon + (Math.random() - 0.5) * 0.0005,
          };
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(moveInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    const time = Date.now() / 1000;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#020617");
    gradient.addColorStop(0.45, "#0f172a");
    gradient.addColorStop(1, "#111827");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 0.7;
    for (let x = 0; x < w; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 56) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
    ctx.lineWidth = 1.2;
    const roadPaths = [
      [[0.08, 0.24], [0.26, 0.18], [0.45, 0.27], [0.62, 0.22]],
      [[0.13, 0.72], [0.33, 0.64], [0.52, 0.74], [0.77, 0.63]],
      [[0.36, 0.08], [0.36, 0.42], [0.38, 0.64]],
      [[0.66, 0.1], [0.72, 0.3], [0.84, 0.42], [0.90, 0.66]],
    ];
    roadPaths.forEach((path) => {
      ctx.beginPath();
      path.forEach(([px, py], index) => {
        const x = px * w;
        const y = py * h;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    ctx.save();
    if (mapMode === "street") {
      ctx.strokeStyle = "rgba(226, 232, 240, 0.2)";
      ctx.lineWidth = 1.2;
      const streetPaths = [
        [[0.08, 0.24], [0.26, 0.18], [0.45, 0.27], [0.62, 0.22]],
        [[0.13, 0.72], [0.33, 0.64], [0.52, 0.74], [0.77, 0.63]],
        [[0.36, 0.08], [0.36, 0.42], [0.38, 0.64]],
        [[0.66, 0.1], [0.72, 0.3], [0.84, 0.42], [0.90, 0.66]],
      ];
      streetPaths.forEach((path) => {
        ctx.beginPath();
        path.forEach(([px, py], index) => {
          const x = px * w;
          const y = py * h;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    }
    ctx.globalAlpha = 0.35;
    const silhouette = [
      [0.12, 0.16], [0.27, 0.10], [0.34, 0.18], [0.31, 0.28], [0.22, 0.31], [0.15, 0.24], [0.12, 0.16],
      [0.34, 0.40], [0.45, 0.36], [0.50, 0.47], [0.42, 0.57], [0.31, 0.55], [0.28, 0.47], [0.34, 0.40],
      [0.46, 0.14], [0.57, 0.12], [0.60, 0.19], [0.56, 0.27], [0.48, 0.24], [0.46, 0.14],
      [0.50, 0.30], [0.62, 0.29], [0.68, 0.37], [0.63, 0.51], [0.55, 0.56], [0.49, 0.48], [0.50, 0.30],
      [0.63, 0.10], [0.79, 0.09], [0.85, 0.16], [0.82, 0.28], [0.72, 0.31], [0.63, 0.22], [0.63, 0.10],
      [0.76, 0.50], [0.84, 0.48], [0.88, 0.58], [0.83, 0.68], [0.74, 0.66], [0.72, 0.57], [0.76, 0.50],
    ];
    ctx.beginPath();
    silhouette.forEach(([px, py], i) => {
      const x = px * w;
      const y = py * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.restore();

    ctx.save();
    const glow = ctx.createRadialGradient(w * 0.16, h * 0.24, 20, w * 0.16, h * 0.24, 120);
    glow.addColorStop(0, "rgba(56, 189, 248, 0.25)");
    glow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const cx = w * 0.5;
    const cy = h * 0.45;
    const orbit = Math.min(w, h) * 0.32;
    ctx.strokeStyle = "rgba(45, 212, 191, 0.18)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, orbit, 0, Math.PI * 2);
    ctx.stroke();

    const sweepAngle = (time % 8) / 8 * Math.PI * 2;
    const sweep = ctx.createConicGradient(sweepAngle, cx, cy);
    sweep.addColorStop(0, "rgba(45, 212, 191, 0)");
    sweep.addColorStop(0.15, "rgba(45, 212, 191, 0.4)");
    sweep.addColorStop(0.35, "rgba(45, 212, 191, 0)");
    ctx.fillStyle = sweep;
    ctx.beginPath();
    ctx.arc(cx, cy, orbit, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(45, 212, 191, 0.2)";
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2dd4bf";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    const devices = data?.devices || [];
    devices.forEach((device, i) => {
      const pos = devicePositions[device.id];
      if (!pos) return;
      const x = ((pos.lon + 180) / 360) * w;
      const y = ((90 - pos.lat) / 180) * h;
      const isSelected = selectedDevice?.id === device.id;

      ctx.strokeStyle = isSelected ? "rgba(251, 191, 36, 0.55)" : "rgba(45, 212, 191, 0.28)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      const pulse = 10 + Math.sin(time * 1.7 + i) * 4;
      ctx.strokeStyle = isSelected ? "rgba(251, 191, 36, 0.28)" : "rgba(45, 212, 191, 0.20)";
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isSelected ? "rgba(251, 191, 36, 0.22)" : "rgba(45, 212, 191, 0.18)";
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isSelected ? "#fbbf24" : "#34d399";
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isSelected ? "#fde68a" : "rgba(248, 250, 252, 0.85)";
      ctx.font = isSelected ? "bold 10px sans-serif" : "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(device.name.slice(0, 12), x, y - 13);
    });

    if (showAddressOverlay) {
      ctx.save();
      ctx.fillStyle = "rgba(248, 250, 252, 0.75)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Main St", w * 0.16, h * 0.42);
      ctx.fillText("Harbor Ave", w * 0.55, h * 0.29);
      ctx.fillText("Oak District", w * 0.72, h * 0.56);
      ctx.fillText("River Point", w * 0.24, h * 0.76);
      ctx.restore();
    }

    if (navigationActive && selectedDevice) {
      const fromX = w * 0.2;
      const fromY = h * 0.2;
      const toX = ((devicePositions[selectedDevice.id]?.lon ?? 0) + 180) / 360 * w;
      const toY = ((90 - (devicePositions[selectedDevice.id]?.lat ?? 0)) / 180) * h;
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(fromX, fromY, 3.2, 0, Math.PI * 2);
      ctx.arc(toX, toY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (measureMode && selectedDevice) {
      const x = ((devicePositions[selectedDevice.id]?.lon ?? 0) + 180) / 360 * w;
      const y = ((90 - (devicePositions[selectedDevice.id]?.lat ?? 0)) / 180) * h;
      ctx.save();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(251, 191, 36, 0.16)";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.fillText(new Date().toISOString().slice(0, 19).replace("T", " "), w - 12, h - 12);
  }, [data, devicePositions, selectedDevice, mapMode, showAddressOverlay, navigationActive, measureMode, refreshTick]);

  useEffect(() => {
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      setRefreshTick((value) => value + 1);
    };
    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const devices = data?.devices || [];
  const liveCount = devices.length;
  const avgBattery = devices.length ? Math.round(devices.reduce((sum, device) => sum + (device.batteryPercent ?? 0), 0) / devices.length) : 0;
  const selectedRegion = selectedDevice ? WORLD_REGIONS.find((region) => region.name === selectedDevice.gpsLocationName) : null;
  const selectedEvidence = selectedDevice?.recentEvidence ?? [];
  const primaryEvidence = selectedEvidence[0];
  const cameraStatus = cameraActive && selectedDevice ? "Live" : "Standby";
  const routeSummary = selectedDevice
    ? `${selectedRegion?.name ?? selectedDevice.gpsLocationName ?? "Live route"} · ${devicePositions[selectedDevice.id] ? `${devicePositions[selectedDevice.id].lat.toFixed(3)}, ${devicePositions[selectedDevice.id].lon.toFixed(3)}` : "syncing"}`
    : "Select a unit to reveal route detail, street context, and telemetry";

  const trackMenu = [
    { id: "overview", label: "Overview", hint: "Command summary" },
    { id: "camera", label: "Camera", hint: "Directional feed" },
    { id: "telemetry", label: "Telemetry", hint: "Signal & location" },
    { id: "evidence", label: "Evidence", hint: "Recent captures" },
  ] as const;

  const featureCards = [
    {
      id: "camera" as const,
      title: "Camera activation",
      description: "Open the live directional feed and scene panel.",
      icon: Camera,
      status: cameraActive && selectedDevice ? "Active" : "Standby",
    },
    {
      id: "telemetry" as const,
      title: "Telemetry live",
      description: "Inspect battery, signal, GPS, and unit health.",
      icon: Navigation,
      status: selectedDevice ? "Ready" : "Waiting",
    },
    {
      id: "evidence" as const,
      title: "Evidence feed",
      description: "Review the latest captured evidence for the chosen unit.",
      icon: Activity,
      status: selectedEvidence.length > 0 ? `${selectedEvidence.length} items` : "No feed",
    },
    {
      id: "overview" as const,
      title: "Fleet overview",
      description: "Monitor live routes, sync status, and connected units.",
      icon: Crosshair,
      status: "Live",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] p-4 shadow-[0_24px_80px_rgba(2,6,23,0.35)] sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              Real-time fleet GPS
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                <Globe className="h-5 w-5 text-[#2dd4bf]" />
                Commercial vehicle tracking, built for visibility.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Monitor every unit, route, and location event through a premium fleet command console inspired by modern GPS operations platforms.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                <Signal className="mr-1 h-3 w-3 animate-pulse" />
                {liveCount} live units
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                <Smartphone className="mr-1 h-3 w-3" />
                {liveCount} connected devices
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 cursor-pointer border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:text-white" onClick={fetchData}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                <Compass className="h-3.5 w-3.5 text-sky-400" />
                Fleet health
              </div>
              <div className="mt-2 text-xl font-semibold text-white">{avgBattery}%</div>
              <div className="text-sm text-slate-400">Average battery readiness</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Signal integrity
              </div>
              <div className="mt-2 text-xl font-semibold text-white">98.4%</div>
              <div className="text-sm text-slate-400">Stable live feed at all endpoints</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 sm:col-span-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                Active route
              </div>
              <div className="mt-2 text-xl font-semibold text-white">{selectedDevice ? "Tracked" : "Monitoring"}</div>
              <div className="text-sm text-slate-400">Routes and geofence activity synchronized in real time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden border-slate-800/80 bg-slate-950/70 shadow-[0_16px_60px_rgba(2,6,23,0.35)]">
          <CardContent className="p-0">
            <div className="relative h-[480px] w-full overflow-hidden rounded-[24px]">
              <canvas ref={canvasRef} className="h-full w-full" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#2dd4bf]" />
                </div>
              )}

              <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-emerald-400/20 bg-slate-950/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-emerald-300">
                  Live fleet map
                </div>
                <div className="rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  {Math.max(0, Math.floor((Date.now() - lastFetchRef.current) / 1000))}s sync
                </div>
              </div>

              <div className="absolute right-3 top-3 flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 border border-slate-700/70 bg-slate-950/70 text-slate-300 hover:text-white" onClick={() => setShowAddressOverlay((value) => !value)}>
                  {showAddressOverlay ? "Street view on" : "Street view off"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 border border-slate-700/70 bg-slate-950/70 text-slate-300 hover:text-white" onClick={() => setNavigationActive((value) => !value)}>
                  {navigationActive ? "Navigate on" : "Navigate"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 border border-slate-700/70 bg-slate-950/70 text-slate-300 hover:text-white" onClick={() => setMeasureMode((value) => !value)}>
                  {measureMode ? "Measure on" : "Measure"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 border border-slate-700/70 bg-slate-950/70 text-slate-300 hover:text-white" onClick={() => setMapMode((value) => (value === "street" ? "satellite" : "street"))}>
                  {mapMode === "street" ? "Street" : "Satellite"}
                </Button>
              </div>

              <div className="absolute bottom-3 left-3 max-w-[70%] rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  {showAddressOverlay ? "Street address view" : "Area view"}
                </div>
                <div className="mt-1 text-[11px] normal-case tracking-normal text-slate-300">
                  {routeSummary}
                </div>
              </div>

              <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Active unit
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Selected unit
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-800/80 bg-slate-950/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <Radio className="h-4 w-4 text-emerald-400" />
                Active field units
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[240px] divide-y divide-slate-800/70 overflow-y-auto">
                {devices.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No field units registered</div>
                ) : (
                  devices.map((device) => {
                    const pos = devicePositions[device.id];
                    const region = WORLD_REGIONS.find((entry) => pos && Math.abs(entry.lat - pos.lat) < 5 && Math.abs(entry.lon - pos.lon) < 5);
                    return (
                      <button
                        key={device.id}
                        onClick={() => {
                          if (selectedDevice?.id === device.id) {
                            setSelectedDevice(null);
                            setCameraActive(false);
                            setActiveTrackView("overview");
                          } else {
                            setSelectedDevice(device);
                            setCameraActive(true);
                            setActiveTrackView("camera");
                          }
                        }}
                        className={cn(
                          "flex w-full items-start gap-2.5 p-3 text-left transition-all",
                          selectedDevice?.id === device.id ? "bg-amber-400/10" : "hover:bg-slate-900/70"
                        )}
                      >
                        <div className="relative mt-0.5 shrink-0">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                          <div className="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-white">{device.name}</span>
                            <Badge className="h-4 border-emerald-400/20 bg-emerald-500/10 px-1 text-[8px] text-emerald-300">LIVE</Badge>
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-500">{device.make} {device.model}</div>
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-400">
                            <MapPin className="h-2.5 w-2.5" />
                            {region?.name || device.gpsLocationName || "Active tracking"}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Battery className="h-2.5 w-2.5 text-emerald-400" />
                            {device.batteryPercent}%
                          </div>
                          <div className="mt-1 text-[9px] text-slate-500">{device.evidenceCount} ev</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {advanceMode ? (
            <Card className="border-slate-800/80 bg-slate-950/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-white">
                    <Camera className="h-4 w-4 text-sky-400" />
                    Tracking menu / feature section
                  </CardTitle>
                  <Badge className="border-sky-400/20 bg-sky-500/10 text-sky-300">
                    {activeTrackView === "overview" ? "Overview" : activeTrackView.charAt(0).toUpperCase() + activeTrackView.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {trackMenu.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTrackView === item.id ? "default" : "ghost"}
                      size="sm"
                      className={activeTrackView === item.id ? "bg-sky-500/20 text-sky-200 hover:bg-sky-500/25" : "border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:text-white"}
                      onClick={() => setActiveTrackView(item.id)}
                    >
                      <span className="mr-2">{item.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{item.hint}</span>
                    </Button>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {featureCards.map((feature) => {
                    const Icon = feature.icon;
                    const isActive = activeTrackView === feature.id;
                    return (
                      <button
                        key={feature.id}
                        onClick={() => {
                          setActiveTrackView(feature.id);
                          if (feature.id === "camera" && selectedDevice) {
                            setCameraActive(true);
                          }
                        }}
                        className={`rounded-2xl border p-3 text-left transition-all ${isActive ? "border-sky-400/30 bg-sky-500/10" : "border-slate-800/80 bg-slate-900/70 hover:bg-slate-800/70"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <Icon className="h-4 w-4 text-sky-400" />
                            {feature.title}
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{feature.status}</span>
                        </div>
                        <div className="mt-2 text-sm text-slate-400">{feature.description}</div>
                      </button>
                    );
                  })}
                </div>

                {activeTrackView === "camera" ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-3">
                      <div className="rounded-xl border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_42%),linear-gradient(135deg,_#111827,_#0f172a)] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Live scene</div>
                            <div className="mt-1 text-sm font-semibold text-white">{selectedDevice?.name ?? "No device selected"}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:text-white"
                            onClick={() => setCameraActive((value) => !value)}
                            disabled={!selectedDevice}
                          >
                            {cameraStatus}
                          </Button>
                        </div>
                        <div className="mt-3 rounded-xl border border-slate-800/80 bg-[linear-gradient(135deg,_rgba(45,212,191,0.16),_rgba(15,23,42,0.95))] p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="max-w-[70%] space-y-1">
                              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Directional view</div>
                              <div className="text-sm leading-6 text-slate-200">
                                {cameraActive && selectedDevice && primaryEvidence?.preview
                                  ? primaryEvidence.preview
                                  : selectedDevice
                                    ? "Activate the feed to surface the latest camera evidence and on-site telemetry from this device."
                                    : "Select a device to activate its camera view."}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/70 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                              <MapPin className="h-3 w-3 text-sky-400" />
                              {selectedRegion?.name ?? selectedDevice?.gpsLocationName ?? "Global feed"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTrackView === "telemetry" ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">On-site telemetry</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-sm text-slate-300">
                        <div>Location: {selectedDevice?.gpsLocationName ?? "Pending"}</div>
                        <div className="mt-1">Signal: {selectedDevice?.connectionStatus ?? "Unknown"}</div>
                        <div className="mt-1">Battery: {selectedDevice?.batteryPercent ?? "—"}%</div>
                      </div>
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-sm text-slate-300">
                        <div>Latitude: {devicePositions[selectedDevice?.id ?? ""]?.lat.toFixed(6) ?? "—"}</div>
                        <div className="mt-1">Longitude: {devicePositions[selectedDevice?.id ?? ""]?.lon.toFixed(6) ?? "—"}</div>
                        <div className="mt-1">Accuracy: {selectedDevice?.gpsAccuracy ? `±${selectedDevice.gpsAccuracy}m` : "±3m"}</div>
                      </div>
                    </div>
                  </div>
                ) : activeTrackView === "evidence" ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Recent evidence</div>
                    <div className="mt-3 space-y-2">
                      {selectedEvidence.length > 0 ? (
                        selectedEvidence.slice(0, 4).map((item) => (
                          <div key={item.id} className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2">
                            <div className="text-sm font-medium text-white">{item.fileName}</div>
                            <div className="mt-1 text-[11px] text-slate-400">{item.preview ?? `${item.category} item captured`}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-slate-400">No evidence feed available for this device yet.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 text-sm text-slate-400">
                    Select a device to activate the tracking workspace and start using the menu options.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-800/80 bg-slate-950/70">
              <CardContent className="p-4 text-sm text-slate-400">
                Enable advanced mode to unlock the street-view and live-camera telemetry panel.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedDevice && (
        <Card className="border-slate-800/80 bg-slate-950/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Activity className="h-4 w-4 text-amber-400" />
              Unit telemetry — {selectedDevice.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {[
                { label: "Status", value: "CONSTANT LIVE", color: "text-emerald-300" },
                { label: "Connection", value: selectedDevice.connectionStatus, color: "text-emerald-300" },
                { label: "Battery", value: `${selectedDevice.batteryPercent}%`, color: "text-white" },
                { label: "Evidence", value: `${selectedDevice.evidenceCount} items`, color: "text-white" },
                { label: "Latitude", value: devicePositions[selectedDevice.id]?.lat.toFixed(6) ?? "—", color: "text-white font-mono" },
                { label: "Longitude", value: devicePositions[selectedDevice.id]?.lon.toFixed(6) ?? "—", color: "text-white font-mono" },
                { label: "Accuracy", value: selectedDevice.gpsAccuracy ? `±${selectedDevice.gpsAccuracy}m` : "±3m", color: "text-white" },
                { label: "Region", value: selectedDevice.gpsLocationName || "Active tracking", color: "text-sky-300" },
                { label: "OS", value: selectedDevice.os, color: "text-white capitalize" },
                { label: "Operator", value: selectedDevice.addedBy?.name ?? "—", color: "text-white" },
                { label: "Case", value: selectedDevice.case?.caseNumber ?? "—", color: "text-white" },
                { label: "Model", value: `${selectedDevice.make} ${selectedDevice.model}`, color: "text-white" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{item.label}</div>
                  <div className={`mt-1 text-sm font-medium ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
