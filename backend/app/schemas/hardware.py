from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Sensor Schemas
class HardwareSensorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sensor_type: str = Field(..., max_length=50)
    unit: str = Field(..., max_length=30)
    min_val: float = 0.0
    max_val: float = 100.0
    sampling_interval_ms: int = Field(1000, ge=100, le=60000)
    normal_range_min: float = 0.0
    normal_range_max: float = 10.0
    warning_threshold: float = 15.0
    critical_threshold: float = 25.0
    pin_interface: Optional[str] = Field("ADC1_CH0 (GPIO 36)", max_length=100)

class HardwareSensorCreate(HardwareSensorBase):
    device_id: int

class HardwareSensorResponse(HardwareSensorBase):
    id: int
    device_id: int
    current_val: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Device Schemas
class HardwareDeviceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    device_type: str = Field("ESP32", max_length=100)
    network_protocol: str = Field("LoRaWAN / MQTT", max_length=100)
    location_label: Optional[str] = Field("Field Sensor Node A", max_length=150)
    firmware_version: Optional[str] = Field("v1.4.2-idf", max_length=50)

class HardwareDeviceCreate(HardwareDeviceBase):
    project_id: int

class HardwareDeviceResponse(HardwareDeviceBase):
    id: int
    project_id: int
    status: str
    is_simulating: bool
    battery_level: float
    signal_strength_dbm: int
    packet_loss_rate: float
    device_temp_c: float
    uptime_seconds: int
    sensors: List[HardwareSensorResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Telemetry Ingestion Schemas
class TelemetryPoint(BaseModel):
    sensor_id: int
    value: float
    is_anomaly: bool = False
    anomaly_type: Optional[str] = Field(None, max_length=100)

class TelemetryBatchCreate(BaseModel):
    device_id: int
    points: List[TelemetryPoint] = Field(..., max_length=100)
    battery_level: Optional[float] = Field(None, ge=0.0, le=100.0)
    signal_strength_dbm: Optional[int] = Field(None, ge=-120, le=0)
    packet_loss_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    device_temp_c: Optional[float] = Field(None, ge=-40.0, le=125.0)

class TelemetryRecordResponse(BaseModel):
    id: int
    device_id: int
    sensor_id: int
    value: float
    timestamp: datetime
    is_anomaly: bool
    anomaly_type: Optional[str] = None

    class Config:
        from_attributes = True


# Anomaly Injection Schema
class AnomalyInjectRequest(BaseModel):
    device_id: int
    sensor_id: int
    anomaly_type: str = Field(..., max_length=100) # sudden_spike, sensor_failure, out_of_range, battery_drop, packet_loss_burst
    spike_multiplier: Optional[float] = Field(3.5, ge=0.1, le=50.0)
    custom_value: Optional[float] = None


# Alerts Schemas
class HardwareAlertResponse(BaseModel):
    id: int
    project_id: int
    device_id: int
    sensor_id: Optional[int] = None
    alert_level: str # INFO, WARNING, CRITICAL
    message: str
    sensor_name: str
    recorded_value: float
    threshold_exceeded: float
    is_resolved: bool
    timestamp: datetime

    class Config:
        from_attributes = True


# Experiments Schemas
class HardwareExperimentCreate(BaseModel):
    project_id: int
    name: str = Field(..., min_length=2, max_length=200)
    objective: str = Field(..., min_length=2, max_length=1000)
    duration_seconds: int = Field(300, ge=1, le=86400)
    sensors_tested: List[str] = Field(default_factory=list)
    observations: Optional[str] = Field("", max_length=5000)
    anomalies_detected: Optional[int] = Field(0, ge=0)
    packets_transmitted: Optional[int] = Field(0, ge=0)
    packet_loss_pct: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    result_summary: Optional[str] = Field("Validated successfully", max_length=500)

class HardwareExperimentResponse(BaseModel):
    id: int
    project_id: int
    name: str
    objective: str
    status: str
    duration_seconds: int
    sensors_tested: List[str]
    anomalies_detected: int
    packets_transmitted: int
    packet_loss_pct: float
    observations: Optional[str] = ""
    ai_evaluation: Optional[str] = ""
    result_summary: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# AI Telemetry Interpretation Schema
class TelemetryInterpretationRequest(BaseModel):
    project_id: int
    device_name: str = Field(..., max_length=150)
    telemetry_summary: Dict[str, Any] = Field(default_factory=dict)
    active_anomalies: List[str] = Field(default_factory=list)
    recent_alerts: List[str] = Field(default_factory=list)

class TelemetryInterpretationResponse(BaseModel):
    raw_sensor_data: Dict[str, Any]
    ai_interpretation: str
    recommended_action: str
    overall_system_health: str # "Normal", "Degraded / Anomaly Detected", "Critical Alert"
    severity_level: str # "LOW", "MEDIUM", "HIGH", "CRITICAL"


# Project Overview Schema
class HardwareProjectOverviewResponse(BaseModel):
    project_id: int
    project_title: str
    domain: str
    devices: List[HardwareDeviceResponse]
    recent_alerts: List[HardwareAlertResponse]
    experiments: List[HardwareExperimentResponse]
    recommended_hardware_resources: List[Dict[str, Any]]
