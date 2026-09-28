'use client';

import React, { useState, useEffect, useRef } from'react';
import Link from'next/link';
import {
 Cpu,
 Radio,
 Play,
 Pause,
 RotateCcw,
 Activity,
 Plus,
 XCircle,
 Server,
 Clock,
 Battery,
 Wifi,
 ShieldAlert,
 Sliders,
 ExternalLink,
 Loader2,
 FileText
} from'lucide-react';
import { useProject } from'@/lib/project-context';
import { api } from'@/lib/api';
import { HardwareDevice, HardwareSensor, HardwareAlert, HardwareExperiment, HardwareOverview } from'@/types';
import { SkeletonDashboard } from'@/components/ui/skeleton';

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

 if (data.devices?.[0]?.sensors) {
 const initialHist: Record<number, number[]> = {};
 data.devices[0].sensors.forEach((s) => {
 const base = s.current_val || s.normal_range_min + (s.normal_range_max - s.normal_range_min) * 0.5;
 initialHist[s.id] = Array(15).fill(base).map((v) => v + (Math.random() - 0.5) * 0.4);
 });
 setTelemetryHistory(initialHist);
 setTimestamps(Array(15).fill(0).map((_, i) =>`${i + 1}s`));
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

 const updatedSensors = activeDevice.sensors.map((sensor) => {
 let current = sensor.current_val;
 const jitter = (Math.random() - 0.5) * ((sensor.normal_range_max - sensor.normal_range_min) * 0.05);
 current = Math.max(sensor.min_val, Math.min(sensor.max_val, current + jitter));

 if (!activeAnomalies.includes(sensor.name) && (current > sensor.normal_range_max || current < sensor.normal_range_min)) {
 const target = sensor.normal_range_min + (sensor.normal_range_max - sensor.normal_range_min) * 0.5;
 current = current + (target - current) * 0.15;
 }

 let sStatus:'normal' |'warning' |'critical' |'anomaly' ='normal';
 if (current >= sensor.critical_threshold || current <= sensor.min_val) {
 sStatus ='critical';
 } else if (current >= sensor.warning_threshold) {
 sStatus ='warning';
 }

 return { ...sensor, current_val: Number(current.toFixed(2)), status: sStatus };
 });

 setTelemetryHistory((prev) => {
 const nextHist = { ...prev };
 updatedSensors.forEach((s) => {
 const currentArr = nextHist[s.id] || [];
 nextHist[s.id] = [...currentArr.slice(-20), s.current_val];
 });
 return nextHist;
 });

 setTimestamps((prev) => [...prev.slice(-20),`${new Date().getSeconds()}s`]);

 if (hardwareData) {
 setHardwareData({
 ...hardwareData,
 devices: [{
 ...activeDevice,
 battery_level: Number(batteryLevel.toFixed(1)),
 sensors: updatedSensors,
 }],
 });
 }
 }, intervalMs);

 return () => clearInterval(timer);
 }, [isRunning, simSpeed, activeDevice, activeAnomalies, batteryLevel, packetLossRate, hardwareData]);

 const handleInjectAnomaly = async (anomalyType: string) => {
 if (!activeDevice || !activeDevice.sensors || activeDevice.sensors.length === 0) return;

 let targetSensor = activeDevice.sensors[0];
 if (anomalyType.includes('turbidity') || anomalyType.includes('water')) {
 targetSensor = activeDevice.sensors.find((s) => s.sensor_type ==='turbidity') || activeDevice.sensors[0];
 } else if (anomalyType.includes('ph')) {
 targetSensor = activeDevice.sensors.find((s) => s.sensor_type ==='ph') || activeDevice.sensors[0];
 } else if (anomalyType.includes('temp')) {
 targetSensor = activeDevice.sensors.find((s) => s.sensor_type ==='temperature') || activeDevice.sensors[0];
 }

 try {
 await api.injectHardwareAnomaly({
 device_id: activeDevice.id,
 sensor_id: targetSensor.id,
 anomaly_type: anomalyType,
 });

 setActiveAnomalies((prev) => [...prev, targetSensor.name]);
 setToastMessage(`Anomaly Injected: ${targetSensor.name} triggered ${anomalyType.replace('_','')}`);
 setTimeout(() => setToastMessage(null), 4000);

 handleInterpretTelemetry([anomalyType]);
 fetchHardwareData();
 } catch (err) {
 console.error('Error injecting anomaly:', err);
 }
 };

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
 normal_range:`${s.normal_range_min} - ${s.normal_range_max}`,
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
 setToastMessage('New Virtual Sensor attached.');
 setTimeout(() => setToastMessage(null), 3000);
 fetchHardwareData();
 } catch (err) {
 console.error('Error creating sensor:', err);
 }
 };

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
 observations: expObservations ||'Simulated benchmark completed.',
 result_summary:'Experiment Logged',
 });

 setExperimentModalOpen(false);
 setExpName('');
 setExpObjective('');
 setExpObservations('');
 setToastMessage('Hardware Experiment saved.');
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
 } catch (err) {
 console.error('Error resolving alert:', err);
 }
 };

 if (loading) {
 return <SkeletonDashboard />;
 }

 return (
 <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
 {/* Toast Notification */}
 {toastMessage && (
 <div className="fixed top-20 right-8 z-50 px-4 py-2.5 bg-slate-800 text-white text-sm rounded shadow-sm flex items-center gap-2">
 <Activity className="h-4 w-4 text-slate-300" />
 <span>{toastMessage}</span>
 </div>
 )}

 {/* Top Banner */}
 <div className="rounded-lg bg-white border border-slate-200 p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4">
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
 <Cpu className="h-3.5 w-3.5 text-slate-500" />
 <span>Hardware Lab & Edge Telemetry Studio</span>
 </span>
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
 DIGITAL TESTBED
 </span>
 </div>

 <h1 className="text-xl font-semibold text-slate-900">
 Virtual Hardware & Sensor Innovation Lab
 </h1>
 <p className="text-sm text-slate-600 max-w-3xl">
 Simulate microcontrollers, configure IoT networks, inject anomalies, and validate telemetry for{''}
 <span className="text-slate-900 font-medium">{activeProject?.title ||'your project'}</span>.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={() => setExperimentModalOpen(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
 >
 <Activity className="h-4 w-4" />
 <span>Log Experiment</span>
 </button>
 <button
 onClick={() => setSensorModalOpen(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium shadow-sm transition-colors"
 >
 <Plus className="h-4 w-4" />
 <span>Attach Sensor</span>
 </button>
 </div>
 </div>

 {projects.length > 1 && (
 <div className="flex items-center gap-2 text-sm pt-4 border-t border-slate-100">
 <span className="text-slate-500 font-medium">Active Project:</span>
 <select
 value={activeProject?.id}
 onChange={(e) => setActiveProjectId(Number(e.target.value))}
 className="bg-white border border-slate-300 text-slate-900 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
 >
 {projects.map((p) => (
 <option key={p.id} value={p.id}>
 {p.title}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Network Pipeline */}
 <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-5 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Radio className="h-4 w-4 text-slate-500" />
 IoT End-to-End Network Transmission Pipeline
 </h2>
 <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1.5">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 Live Data Stream
 </span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-sm">
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <span className="text-xs text-slate-500 font-medium block">1. Sensors</span>
 <span className="text-sm font-semibold text-slate-900 block">{activeDevice?.sensors?.length || 4} Channels</span>
 </div>
 <div className="p-3 rounded-md bg-indigo-50 border border-indigo-200 space-y-1">
 <span className="text-xs text-indigo-700 font-medium block">2. Edge Node</span>
 <span className="text-sm font-semibold text-indigo-900 block">{activeDevice?.name ||'Node'}</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <span className="text-xs text-slate-500 font-medium block">3. Protocol</span>
 <span className="text-sm font-semibold text-slate-900 block">{activeDevice?.network_protocol ||'LoRaWAN'}</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <span className="text-xs text-slate-500 font-medium block">4. Gateway</span>
 <span className="text-sm font-semibold text-slate-900 block">Gateway A</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <span className="text-xs text-slate-500 font-medium block">5. Backend</span>
 <span className="text-sm font-semibold text-slate-900 block">API / DB</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <span className="text-xs text-slate-500 font-medium block">6. AI Engine</span>
 <span className="text-sm font-semibold text-slate-900 block">Processing</span>
 </div>
 <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
 <span className="text-xs text-slate-500 font-medium block">7. Dispatch</span>
 <span className="text-sm font-semibold text-slate-900 block">{alerts.length} Alerts</span>
 </div>
 </div>
 </div>

 {/* Health & Simulation */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 rounded-lg bg-white border border-slate-200 shadow-sm p-5 space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <Activity className="h-4 w-4 text-slate-500" />
 <h3 className="text-sm font-semibold text-slate-900">Device Telemetry & Health Deck</h3>
 </div>
 <span className="text-xs text-slate-500">Firmware: {activeDevice?.firmware_version}</span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
 <div className="space-y-1">
 <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
 <Battery className="h-4 w-4 text-slate-400" /> Battery
 </span>
 <p className="text-lg font-semibold text-slate-900">{batteryLevel.toFixed(1)}%</p>
 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full ${batteryLevel > 20 ?'bg-emerald-500' :'bg-red-500'}`}
 style={{ width:`${batteryLevel}%` }}
 />
 </div>
 </div>

 <div className="space-y-1">
 <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
 <Wifi className="h-4 w-4 text-slate-400" /> Signal
 </span>
 <p className="text-lg font-semibold text-slate-900">{activeDevice?.signal_strength_dbm || -64} dBm</p>
 </div>

 <div className="space-y-1">
 <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
 <Server className="h-4 w-4 text-slate-400" /> Loss
 </span>
 <p className="text-lg font-semibold text-slate-900">{packetLossRate.toFixed(2)}%</p>
 </div>

 <div className="space-y-1">
 <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
 <Clock className="h-4 w-4 text-slate-400" /> Uptime
 </span>
 <p className="text-base font-semibold text-slate-900">
 {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600) / 60)}m {uptime % 60}s
 </p>
 </div>
 </div>
 </div>

 <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-5 space-y-4">
 <div className="space-y-1">
 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
 <Sliders className="h-4 w-4 text-slate-500" />
 Simulation Controls
 </h3>
 </div>

 <div className="space-y-4">
 <div className="flex gap-2">
 <button
 onClick={() => setIsRunning(!isRunning)}
 className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ${
 isRunning
 ?'bg-amber-100 hover:bg-amber-200 text-amber-900'
 :'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
 }`}
 >
 {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
 <span>{isRunning ?'Pause' :'Start'}</span>
 </button>
 <button
 onClick={() => {
 setUptime(0);
 setPacketsSent(0);
 setPacketsReceived(0);
 setActiveAnomalies([]);
 setToastMessage('Stream reset.');
 setTimeout(() => setToastMessage(null), 2000);
 }}
 className="p-2 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
 >
 <RotateCcw className="h-4 w-4" />
 </button>
 </div>

 <div className="flex items-center justify-between text-sm">
 <span className="text-slate-500">Speed:</span>
 <div className="flex gap-1">
 {([1, 5, 10] as const).map((spd) => (
 <button
 key={spd}
 onClick={() => setSimSpeed(spd)}
 className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
 simSpeed === spd
 ?'bg-slate-800 text-white'
 :'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

 {/* Sensor Telemetry Cards */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-sm font-semibold text-slate-900">
 Live Sensor Telemetry Streams
 </h2>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {activeDevice?.sensors?.map((sensor) => {
 const hist = telemetryHistory[sensor.id] || [sensor.current_val];
 const isCritical = sensor.status ==='critical' || sensor.current_val >= sensor.critical_threshold;
 const isWarning = sensor.status ==='warning' || sensor.current_val >= sensor.warning_threshold;

 return (
 <div
 key={sensor.id}
 className={`rounded-lg p-4 border flex flex-col justify-between space-y-4 transition-colors shadow-sm bg-white ${
 isCritical
 ?'border-red-300 bg-red-50/50'
 : isWarning
 ?'border-amber-300 bg-amber-50/50'
 :'border-slate-200'
 }`}
 >
 <div className="space-y-2">
 <div className="flex items-start justify-between gap-2">
 <div>
 <h3 className="text-sm font-semibold text-slate-900">{sensor.name}</h3>
 <span className="text-xs text-slate-500">{sensor.pin_interface}</span>
 </div>
 <span
 className={`px-2 py-0.5 rounded text-xs font-medium ${
 isCritical
 ?'bg-red-100 text-red-800'
 : isWarning
 ?'bg-amber-100 text-amber-800'
 :'bg-emerald-100 text-emerald-800'
 }`}
 >
 {sensor.status}
 </span>
 </div>

 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-semibold text-slate-900">
 {sensor.current_val}
 </span>
 <span className="text-sm text-slate-500">{sensor.unit}</span>
 </div>
 </div>

 <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
 <div className="flex justify-between text-slate-600">
 <span>Range:</span>
 <span>{sensor.normal_range_min} - {sensor.normal_range_max}</span>
 </div>
 <div className="flex justify-between text-slate-600">
 <span>Limit:</span>
 <span>&gt; {sensor.critical_threshold}</span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Inject Anomaly */}
 <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-5 space-y-4">
 <h2 className="text-sm font-semibold text-slate-900">
 Hardware Anomaly Injection
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
 <button
 onClick={() => handleInjectAnomaly('turbidity_spike')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 Turbidity Surge
 </button>
 <button
 onClick={() => handleInjectAnomaly('temperature_spike')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 Temp Spike
 </button>
 <button
 onClick={() => handleInjectAnomaly('ph_acidic_drift')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 Acidic Drift
 </button>
 <button
 onClick={() => handleInjectAnomaly('sensor_failure')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 Disconnect
 </button>
 <button
 onClick={() => handleInjectAnomaly('battery_drop')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 Low Battery
 </button>
 <button
 onClick={() => handleInjectAnomaly('packet_loss_burst')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 Packet Loss
 </button>
 <button
 onClick={() => handleInjectAnomaly('out_of_range')}
 className="p-3 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-left text-xs font-medium"
 >
 ADC Noise
 </button>
 </div>
 </div>

 {/* AI Interpretation */}
 <div className="rounded-lg bg-slate-50 border border-slate-200 shadow-sm p-5 space-y-4">
 <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
 <div>
 <h2 className="text-sm font-semibold text-slate-900">AI Telemetry Analysis</h2>
 </div>
 <button
 onClick={() => handleInterpretTelemetry()}
 disabled={interpreting}
 className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {interpreting && <Loader2 className="h-4 w-4 animate-spin" />}
 Analyze Telemetry
 </button>
 </div>

 {aiInterpretation ? (
 <div className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
 AI INTERPRETATION
 </span>
 <p className="text-sm text-slate-700 pt-1">
 {aiInterpretation.ai_interpretation}
 </p>
 </div>

 <div className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-2">
 <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
 RECOMMENDED ACTION
 </span>
 <p className="text-sm text-slate-700 pt-1">
 {aiInterpretation.recommended_action}
 </p>
 </div>
 </div>
 </div>
 ) : (
 <div className="p-4 text-center rounded-md bg-white border border-slate-200">
 <p className="text-sm text-slate-600">
 Run analysis to view insights on current telemetry.
 </p>
 </div>
 )}
 </div>

 {/* Modals - Simplified */}
 {sensorModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
 <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 w-full max-w-md">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-sm font-semibold text-slate-900">Add Sensor</h2>
 <button onClick={() => setSensorModalOpen(false)}><XCircle className="h-4 w-4 text-slate-500" /></button>
 </div>
 <form onSubmit={handleAddSensor} className="space-y-4">
 <input
 type="text"
 required
 value={newSensorName}
 onChange={(e) => setNewSensorName(e.target.value)}
 placeholder="Sensor Name"
 className="w-full p-2 border border-slate-200 rounded text-sm"
 />
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setSensorModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded text-sm font-medium text-slate-700">Cancel</button>
 <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium">Add</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {experimentModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
 <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 w-full max-w-md">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-sm font-semibold text-slate-900">Log Experiment</h2>
 <button onClick={() => setExperimentModalOpen(false)}><XCircle className="h-4 w-4 text-slate-500" /></button>
 </div>
 <form onSubmit={handleSaveExperiment} className="space-y-4">
 <input
 type="text"
 required
 value={expName}
 onChange={(e) => setExpName(e.target.value)}
 placeholder="Experiment Title"
 className="w-full p-2 border border-slate-200 rounded text-sm"
 />
 <textarea
 required
 value={expObjective}
 onChange={(e) => setExpObjective(e.target.value)}
 placeholder="Objective"
 className="w-full p-2 border border-slate-200 rounded text-sm"
 />
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setExperimentModalOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded text-sm font-medium text-slate-700">Cancel</button>
 <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium">Save</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
