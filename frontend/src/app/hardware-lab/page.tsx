'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sparkles,
  Server,
  Layers,
  Clock,
  Battery,
  Wifi,
  Thermometer,
  ShieldAlert,
  Sliders,
  Send,
  BookOpen,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Loader2,
  FileText,
  Save,
  Award,
} from 'lucide-react';
import { useProject } from '@/lib/project-context';
import { api } from '@/lib/api';
import { HardwareDevice, HardwareSensor, HardwareAlert, HardwareExperiment, HardwareOverview } from '@/types';
import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function HardwareLabPage() {
  const { activeProject, projects, setActiveProjectId } = useProject();
  const [hardwareData, setHardwareData] = useState<HardwareOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation State
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 5 | 10>(1);
  const [telemetryHistory, setTelemetryHistory] = useState<Record<number, number[]>>({});
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [activeAnomalies, setActiveAnomalies] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<HardwareAlert[]>([]);
  const [experiments, setExperiments] = useState<HardwareExperiment[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Device telemetry counters
  const [uptime, setUptime] = useState(7200);
  const [packetsSent, setPacketsSent] = useState(1420);
  const [packetsReceived, setPacketsReceived] = useState(1408);
  const [batteryLevel, setBatteryLevel] = useState(94.2);
  const [packetLossRate, setPacketLossRate] = useState(0.85);

  // AI Interpretation State
  const [aiInterpretation, setAiInterpretation] = useState<any>(null);
  const [interpreting, setInterpreting] = useState(false);

  // Sensor Creation Modal
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [newSensorName, setNewSensorName] = useState('');
  const [newSensorType, setNewSensorType] = useState('turbidity');
  const [newSensorUnit, setNewSensorUnit] = useState('NTU');
  const [newSensorMin, setNewSensorMin] = useState(0);
  const [newSensorMax, setNewSensorMax] = useState(100);
  const [newSensorNormalMin, setNewSensorNormalMin] = useState(0);
  const [newSensorNormalMax, setNewSensorNormalMax] = useState(10);
  const [newSensorWarning, setNewSensorWarning] = useState(15);
  const [newSensorCritical, setNewSensorCritical] = useState(25);
  const [newSensorPin, setNewSensorPin] = useState('ADC1_CH0 (GPIO 36)');

  // Experiment Modal
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [expName, setExpName] = useState('');
  const [expObjective, setExpObjective] = useState('');
  const [expDuration, setExpDuration] = useState(300);
  const [expObservations, setExpObservations] = useState('');
  const [activeExperimentTimer, setActiveExperimentTimer] = useState<number | null>(null);

  const activeDevice = hardwareData?.devices?.[0];

  // Load hardware overview for active project
  const fetchHardwareData = async () => {
    if (!activeProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data: HardwareOverview = await api.getHardwareProject(activeProject.id);
      setHardwareData(data);
      setAlerts(data.recent_alerts || []);
      setExperiments(data.experiments || []);

      // Initialize telemetry histories for sensors
      if (data.devices?.[0]?.sensors) {
        const initialHist: Record<number, number[]> = {};
        data.devices[0].sensors.forEach((s) => {
          const base = s.current_val || s.normal_range_min + (s.normal_range_max - s.normal_range_min) * 0.5;
          initialHist[s.id] = Array(15).fill(base).map((v) => v + (Math.random() - 0.5) * 0.4);
        });
        setTelemetryHistory(initialHist);
        setTimestamps(Array(15).fill(0).map((_, i) => `${i + 1}s`));
      }
    } catch (err) {
      console.error('Error loading hardware lab data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHardwareData();
  }, [activeProject?.id]);

  // Real-time Simulation Engine Loop
  useEffect(() => {
    if (!isRunning || !activeDevice?.sensors || activeDevice.sensors.length === 0) return;

    const intervalMs = Math.max(1000 / simSpeed, 100);

    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
      setPacketsSent((prev) => prev + 1);
      if (Math.random() > packetLossRate / 100) {
        setPacketsReceived((prev) => prev + 1);
      }
      setBatteryLevel((prev) => Math.max(prev - 0.002 * simSpeed, 5.0));

      // Update sensors telemetry with realistic noise
      const updatedSensors = activeDevice.sensors.map((sensor) => {
        let current = sensor.current_val;

        // Add subtle Gaussian fluctuation
        const jitter = (Math.random() - 0.5) * ((sensor.normal_range_max - sensor.normal_range_min) * 0.05);
        current = Math.max(sensor.min_val, Math.min(sensor.max_val, current + jitter));

        // Revert temporary spike slowly back to normal range if not an active sticky anomaly
        if (!activeAnomalies.includes(sensor.name) && (current > sensor.normal_range_max || current < sensor.normal_range_min)) {
          const target = sensor.normal_range_min + (sensor.normal_range_max - sensor.normal_range_min) * 0.5;
          current = current + (target - current) * 0.15;
        }

        let sStatus: 'normal' | 'warning' | 'critical' | 'anomaly' = 'normal';
        if (current >= sensor.critical_threshold || current <= sensor.min_val) {
          sStatus = 'critical';
        } else if (current >= sensor.warning_threshold) {
          sStatus = 'warning';
        }

        return { ...sensor, current_val: Number(current.toFixed(2)), status: sStatus };
      });

      // Update telemetry history arrays
      setTelemetryHistory((prev) => {
        const nextHist = { ...prev };
        updatedSensors.forEach((s) => {
          const currentArr = nextHist[s.id] || [];
          nextHist[s.id] = [...currentArr.slice(-20), s.current_val];
        });
        return nextHist;
      });

      setTimestamps((prev) => [...prev.slice(-20), `${new Date().getSeconds()}s`]);

      if (hardwareData) {
        setHardwareData({
          ...hardwareData,
          devices: [
            {
              ...activeDevice,
              battery_level: Number(batteryLevel.toFixed(1)),
              sensors: updatedSensors,
            },
          ],
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, simSpeed, activeDevice, activeAnomalies, batteryLevel, packetLossRate, hardwareData]);

  // Anomaly Injection Handler
  const handleInjectAnomaly = async (anomalyType: string) => {
    if (!activeDevice || !activeDevice.sensors || activeDevice.sensors.length === 0) return;

    let targetSensor = activeDevice.sensors[0];
    if (anomalyType.includes('turbidity') || anomalyType.includes('water')) {
      targetSensor = activeDevice.sensors.find((s) => s.sensor_type === 'turbidity') || activeDevice.sensors[0];
    } else if (anomalyType.includes('ph')) {
      targetSensor = activeDevice.sensors.find((s) => s.sensor_type === 'ph') || activeDevice.sensors[0];
    } else if (anomalyType.includes('temp')) {
      targetSensor = activeDevice.sensors.find((s) => s.sensor_type === 'temperature') || activeDevice.sensors[0];
    }

    try {
      const res = await api.injectHardwareAnomaly({
        device_id: activeDevice.id,
        sensor_id: targetSensor.id,
        anomaly_type: anomalyType,
      });

      setActiveAnomalies((prev) => [...prev, targetSensor.name]);
      setToastMessage(`Anomaly Injected: ${targetSensor.name} triggered ${anomalyType.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 4000);

      // Auto-trigger AI Interpretation
      handleInterpretTelemetry([anomalyType]);
      fetchHardwareData();
    } catch (err) {
      console.error('Error injecting anomaly:', err);
    }
  };

  // AI Telemetry Interpretation
  const handleInterpretTelemetry = async (customAnomalies?: string[]) => {
    if (!activeProject || !activeDevice) return;
    setInterpreting(true);
    try {
      const summary: Record<string, any> = {};
      activeDevice.sensors.forEach((s) => {
        summary[s.name] = {
          current: s.current_val,
          unit: s.unit,
          status: s.status,
          normal_range: `${s.normal_range_min} - ${s.normal_range_max}`,
          warning_threshold: s.warning_threshold,
          critical_threshold: s.critical_threshold,
        };
      });

      const res = await api.interpretHardwareTelemetry({
        project_id: activeProject.id,
        device_name: activeDevice.name,
        telemetry_summary: summary,
        active_anomalies: customAnomalies || activeAnomalies,
        recent_alerts: alerts.slice(0, 3).map((a) => a.message),
      });

      setAiInterpretation(res);
    } catch (err) {
      console.error('Error interpreting telemetry:', err);
    } finally {
      setInterpreting(false);
    }
  };

  // Create Virtual Sensor
  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice || !newSensorName.trim()) return;

    try {
      await api.createHardwareSensor({
        device_id: activeDevice.id,
        name: newSensorName,
        sensor_type: newSensorType,
        unit: newSensorUnit,
        min_val: Number(newSensorMin),
        max_val: Number(newSensorMax),
        normal_range_min: Number(newSensorNormalMin),
        normal_range_max: Number(newSensorNormalMax),
        warning_threshold: Number(newSensorWarning),
        critical_threshold: Number(newSensorCritical),
        pin_interface: newSensorPin,
      });

      setSensorModalOpen(false);
      setNewSensorName('');
      setToastMessage('New Virtual Sensor attached to device!');
      setTimeout(() => setToastMessage(null), 3000);
      fetchHardwareData();
    } catch (err) {
      console.error('Error creating sensor:', err);
    }
  };

  // Save Experiment
  const handleSaveExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !expName.trim()) return;

    try {
      await api.createHardwareExperiment({
        project_id: activeProject.id,
        name: expName,
        objective: expObjective,
        duration_seconds: expDuration,
        sensors_tested: activeDevice?.sensors?.map((s) => s.name) || [],
        anomalies_detected: activeAnomalies.length || alerts.length || 2,
        packets_transmitted: packetsSent,
        packet_loss_pct: packetLossRate,
        observations: expObservations || 'Simulated benchmark completed with stable telemetry streaming.',
        result_summary: 'Experiment Logged & Verified',
      });

      setExperimentModalOpen(false);
      setExpName('');
      setExpObjective('');
      setExpObservations('');
      setToastMessage('Hardware Experiment saved and linked to Project Roadmap!');
      setTimeout(() => setToastMessage(null), 4000);
      fetchHardwareData();
    } catch (err) {
      console.error('Error saving experiment:', err);
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await api.resolveHardwareAlert(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_resolved: true } : a)));
      setToastMessage('Alert marked as resolved.');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-2xl animate-in fade-in flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Project Sync */}
      <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                <Cpu className="h-3.5 w-3.5 text-blue-600" />
                <span>Hardware Lab & Edge Telemetry Studio</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                DIGITAL TESTBED • SIMULATED TELEMETRY
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Virtual Hardware & Sensor Innovation Lab
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Simulate microcontrollers (ESP32 / Arduino / RPi), configure IoT sensor networks, inject real-time anomalies, and validate telemetry pipelines for{' '}
              <span className="text-slate-900 font-semibold">{activeProject?.title || 'your innovation project'}</span>.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setExperimentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Log Experiment</span>
            </button>
            <button
              onClick={() => setSensorModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Attach Sensor</span>
            </button>
          </div>
        </div>

        {/* Project Selector Sync Dropdown */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Active Project:</span>
            <select
              value={activeProject?.id}
              onChange={(e) => setActiveProjectId(Number(e.target.value))}
              aria-label="Select Active Project for Hardware Lab"
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.domain})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. Visual IoT Network Transmission Flow */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-indigo-400" />
            IoT End-to-End Network Transmission Pipeline
          </h2>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Data Stream Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">1. SENSORS</span>
            <span className="text-xs font-bold text-indigo-300 block">{activeDevice?.sensors?.length || 4} Channels</span>
            <span className="text-[9px] text-emerald-400 block font-mono">● Sampling</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
            <span className="text-[10px] text-indigo-300 font-bold block">2. EDGE NODE</span>
            <span className="text-xs font-bold text-white block">{activeDevice?.name || 'ESP32 Node'}</span>
            <span className="text-[9px] text-emerald-400 block font-mono">● Online</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">3. PROTOCOL</span>
            <span className="text-xs font-bold text-white block">{activeDevice?.network_protocol || 'LoRaWAN'}</span>
            <span className="text-[9px] text-emerald-400 block font-mono">● Stable (-64 dBm)</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">4. GATEWAY</span>
            <span className="text-xs font-bold text-white block">LoRa Gateway A</span>
            <span className="text-[9px] text-emerald-400 block font-mono">● Connected</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">5. BACKEND API</span>
            <span className="text-xs font-bold text-white block">FastAPI / Timescale</span>
            <span className="text-[9px] text-emerald-400 block font-mono">● 200 OK</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1">
            <span className="text-[10px] text-purple-300 font-bold block">6. AI ENGINE</span>
            <span className="text-xs font-bold text-white block">Gemini 2.5 Flash</span>
            <span className="text-[9px] text-purple-300 block font-mono">● Ready</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">7. ALERT / ACTION</span>
            <span className="text-xs font-bold text-white block">Dispatcher</span>
            <span className="text-[9px] text-indigo-400 block font-mono">{alerts.length} Triggered</span>
          </div>
        </div>
      </div>

      {/* 2. Device Health & Simulation Control Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Health Deck */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Device Telemetry & Health Deck</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Firmware: {activeDevice?.firmware_version}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                <Battery className="h-3.5 w-3.5 text-emerald-400" /> Battery Level
              </span>
              <p className="text-base font-black text-white">{batteryLevel.toFixed(1)}%</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${batteryLevel > 20 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${batteryLevel}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                <Wifi className="h-3.5 w-3.5 text-indigo-400" /> Signal Strength
              </span>
              <p className="text-base font-black text-white">{activeDevice?.signal_strength_dbm || -64} dBm</p>
              <span className="text-[10px] text-indigo-300 font-mono">RSSI: Excellent</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                <Server className="h-3.5 w-3.5 text-purple-400" /> Packet Loss
              </span>
              <p className="text-base font-black text-white">{packetLossRate.toFixed(2)}%</p>
              <span className="text-[10px] text-slate-400 font-mono">
                {packetsReceived}/{packetsSent} pkts
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Active Uptime
              </span>
              <p className="text-base font-black text-white font-mono">
                {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m {uptime % 60}s
              </p>
              <span className="text-[10px] text-slate-400">Node Temp: 31.5°C</span>
            </div>
          </div>
        </div>

        {/* Simulation Execution Controls */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              Simulation Engine Controls
            </h3>
            <p className="text-xs text-slate-400">Control virtual telemetry stream sampling rate</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                <span>{isRunning ? 'PAUSE SIMULATION' : 'START SIMULATION'}</span>
              </button>

              <button
                onClick={() => {
                  setUptime(0);
                  setPacketsSent(0);
                  setPacketsReceived(0);
                  setActiveAnomalies([]);
                  setToastMessage('Simulation stream reset.');
                  setTimeout(() => setToastMessage(null), 2000);
                }}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                title="Reset Counters"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-medium">Clock Speed:</span>
              <div className="flex items-center gap-1">
                {([1, 5, 10] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSimSpeed(spd)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition-colors ${
                      simSpeed === spd
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Sensor Telemetry Cards & Charts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              Live Sensor Telemetry Streams ({activeDevice?.sensors?.length || 0} Configured)
            </h2>
            <p className="text-xs text-slate-400">Real-time sampling with warning & critical threshold boundaries</p>
          </div>
          <button
            onClick={() => setSensorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Add Virtual Sensor</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeDevice?.sensors?.map((sensor) => {
            const hist = telemetryHistory[sensor.id] || [sensor.current_val];
            const minV = Math.min(...hist);
            const maxV = Math.max(...hist);
            const avgV = (hist.reduce((a, b) => a + b, 0) / hist.length).toFixed(1);

            const isCritical = sensor.status === 'critical' || sensor.current_val >= sensor.critical_threshold;
            const isWarning = sensor.status === 'warning' || sensor.current_val >= sensor.warning_threshold;

            return (
              <div
                key={sensor.id}
                className={`glass-panel rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                  isCritical
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-500/10 animate-pulse'
                    : isWarning
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 bg-slate-900/90'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{sensor.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{sensor.pin_interface}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {sensor.status}
                    </span>
                  </div>

                  {/* Big Current Reading */}
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span
                      className={`text-3xl font-black font-mono ${
                        isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {sensor.current_val}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{sensor.unit}</span>
                  </div>

                  {/* Mini Sparkline Chart */}
                  <div className="h-12 w-full pt-1 overflow-hidden">
                    <svg className="w-full h-full overflow-hidden" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke={isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={hist
                          .map((val, idx) => {
                            const x = (idx / Math.max(hist.length - 1, 1)) * 100;
                            const range = Math.max(sensor.max_val - sensor.min_val, 1);
                            const y = 30 - ((val - sensor.min_val) / range) * 28;
                            return `${x},${Math.max(2, Math.min(28, y))}`;
                          })
                          .join(' ')}
                      />
                    </svg>
                  </div>
                </div>

                {/* Threshold & Statistics Footer */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Normal Range:</span>
                    <span className="text-slate-200 font-mono">
                      {sensor.normal_range_min} - {sensor.normal_range_max} {sensor.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Critical Limit:</span>
                    <span className="text-rose-400 font-bold font-mono">
                      &gt; {sensor.critical_threshold} {sensor.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-0.5">
                    <span>Min: {minV.toFixed(1)}</span>
                    <span>Avg: {avgV}</span>
                    <span>Max: {maxV.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Inject Anomaly Lab Matrix */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Hardware Anomaly Injection Studio
          </h2>
          <p className="text-xs text-slate-400">
            Simulate realistic edge hardware failures, physical water contamination, and radio transmission dropouts
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <button
            onClick={() => handleInjectAnomaly('turbidity_spike')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">💧</span>
            <span className="font-bold text-[11px] leading-tight">Turbidity Surge (38 NTU)</span>
          </button>

          <button
            onClick={() => handleInjectAnomaly('temperature_spike')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">🌡️</span>
            <span className="font-bold text-[11px] leading-tight">Temp Spike (52 °C)</span>
          </button>

          <button
            onClick={() => handleInjectAnomaly('ph_acidic_drift')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">🧪</span>
            <span className="font-bold text-[11px] leading-tight">Acidic Drift (3.4 pH)</span>
          </button>

          <button
            onClick={() => handleInjectAnomaly('sensor_failure')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">🔌</span>
            <span className="font-bold text-[11px] leading-tight">Sensor Disconnect (0.0)</span>
          </button>

          <button
            onClick={() => handleInjectAnomaly('battery_drop')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">🔋</span>
            <span className="font-bold text-[11px] leading-tight">Low Battery (12%)</span>
          </button>

          <button
            onClick={() => handleInjectAnomaly('packet_loss_burst')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">📡</span>
            <span className="font-bold text-[11px] leading-tight">Packet Loss (22%)</span>
          </button>

          <button
            onClick={() => handleInjectAnomaly('out_of_range')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white transition-all text-left flex flex-col justify-between space-y-2 group"
          >
            <span className="text-lg">⚡</span>
            <span className="font-bold text-[11px] leading-tight">ADC Noise Burst</span>
          </button>
        </div>
      </div>

      {/* 5. AI Telemetry Interpretation Studio */}
      <div className="glass-panel rounded-3xl p-6 border border-indigo-500/30 bg-indigo-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">AI Telemetry Interpretation & Guidance</h2>
            </div>
            <p className="text-xs text-slate-300">
              Real-time reasoning on raw sensor payloads, anomaly mechanisms, and firmware mitigation actions
            </p>
          </div>

          <button
            onClick={() => handleInterpretTelemetry()}
            disabled={interpreting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all"
          >
            {interpreting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{interpreting ? 'Analyzing Telemetry...' : 'Interpret Telemetry with AI'}</span>
          </button>
        </div>

        {aiInterpretation ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: RAW SENSOR DATA */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  RAW SENSOR DATA
                </span>
                <div className="space-y-1 text-xs text-slate-300 pt-1 font-mono">
                  {Object.entries(aiInterpretation.raw_sensor_data || {}).map(([sName, sData]: [string, any]) => (
                    <div key={sName} className="flex justify-between">
                      <span className="truncate max-w-[120px]">{sName}:</span>
                      <span className="font-bold text-white">
                        {sData.current} {sData.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: AI INTERPRETATION */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI INTERPRETATION
                </span>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {aiInterpretation.ai_interpretation}
                </p>
              </div>

              {/* Box 3: RECOMMENDED ACTION */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  RECOMMENDED ACTION
                </span>
                <p className="text-xs text-emerald-200 leading-relaxed pt-1">
                  {aiInterpretation.recommended_action}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Overall State: <strong className="text-white">{aiInterpretation.overall_system_health}</strong></span>
              <span>Severity Level: <strong className="text-indigo-400">{aiInterpretation.severity_level}</strong></span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400">
              Click <strong>"Interpret Telemetry with AI"</strong> or inject a sensor anomaly to see real-time AI reasoning.
            </p>
          </div>
        )}
      </div>

      {/* 6. Hardware Alerts & Experiment History (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Hardware Alert Stream */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <h2 className="text-base font-bold text-white">Live Alert Dispatch Stream</h2>
            </div>
            <span className="text-xs text-slate-400">{alerts.filter((a) => !a.is_resolved).length} Active</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    alert.is_resolved
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                      : alert.alert_level === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold uppercase text-[9px] px-1.5 py-0.2 rounded bg-slate-950">
                        {alert.alert_level}
                      </span>
                      <span className="font-semibold text-white">{alert.sensor_name}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{alert.message}</p>
                  </div>

                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[10px] font-bold text-slate-300 shrink-0"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No active hardware alerts.</div>
            )}
          </div>
        </div>

        {/* Experiment History & Roadmap Evidence */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Hardware Experiment Logs ({experiments.length})</h2>
            </div>
            <button
              onClick={() => setExperimentModalOpen(true)}
              className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>+ New Benchmark</span>
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {experiments.length > 0 ? (
              experiments.map((exp) => (
                <div key={exp.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white">{exp.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                      {exp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{exp.objective}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Duration: {exp.duration_seconds}s</span>
                    <span>Anomalies: {exp.anomalies_detected}</span>
                    <span>Loss: {exp.packet_loss_pct}%</span>
                    <span className="text-emerald-400 font-semibold">{exp.result_summary}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No experiments saved yet. Click "Log Experiment" to document benchmarks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Hardware Contextual Resources */}
      {hardwareData?.recommended_hardware_resources && hardwareData.recommended_hardware_resources.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            Recommended Firmware Libraries & Hardware Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hardwareData.recommended_hardware_resources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400">{res.category}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <h3 className="text-xs font-bold text-white">{res.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{res.description}</p>
                </div>
                <div className="flex flex-wrap gap-1 pt-2">
                  {res.tags.map((t, idx) => (
                    <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-950 text-[9px] text-slate-400 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {sensorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              Attach Virtual Sensor to {activeDevice?.name}
            </h2>

            <form onSubmit={handleAddSensor} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Sensor Name *</label>
                <input
                  type="text"
                  required
                  value={newSensorName}
                  onChange={(e) => setNewSensorName(e.target.value)}
                  placeholder="e.g. Dissolved Oxygen Sensor"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Sensor Type</label>
                  <select
                    value={newSensorType}
                    onChange={(e) => setNewSensorType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="turbidity">Turbidity (NTU)</option>
                    <option value="ph">pH Probe</option>
                    <option value="temperature">Temperature (°C)</option>
                    <option value="humidity">Humidity (%)</option>
                    <option value="soil_moisture">Soil Moisture (%)</option>
                    <option value="air_quality">Air Quality (ppm)</option>
                    <option value="pressure">Pressure (hPa)</option>
                    <option value="custom">Custom Transducer</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newSensorUnit}
                    onChange={(e) => setNewSensorUnit(e.target.value)}
                    placeholder="e.g. mg/L"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Normal Range (Min / Max)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newSensorNormalMin}
                      onChange={(e) => setNewSensorNormalMin(Number(e.target.value))}
                      className="w-1/2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      value={newSensorNormalMax}
                      onChange={(e) => setNewSensorNormalMax(Number(e.target.value))}
                      className="w-1/2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Thresholds (Warn / Crit)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newSensorWarning}
                      onChange={(e) => setNewSensorWarning(Number(e.target.value))}
                      className="w-1/2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      value={newSensorCritical}
                      onChange={(e) => setNewSensorCritical(Number(e.target.value))}
                      className="w-1/2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSensorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Attach Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Experiment Modal */}
      {experimentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              Document Hardware Experiment Benchmark
            </h2>

            <form onSubmit={handleSaveExperiment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Experiment Title *</label>
                <input
                  type="text"
                  required
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  placeholder="e.g. 72-Hour Water Turbidity Spike & LoRa Retransmission Test"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Objective *</label>
                <textarea
                  rows={2}
                  required
                  value={expObjective}
                  onChange={(e) => setExpObjective(e.target.value)}
                  placeholder="Define the technical benchmark or hypothesis..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observations & Results</label>
                <textarea
                  rows={3}
                  value={expObservations}
                  onChange={(e) => setExpObservations(e.target.value)}
                  placeholder="Record packet loss, jitter, false positives, or ADC calibration notes..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExperimentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save & Link to Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
