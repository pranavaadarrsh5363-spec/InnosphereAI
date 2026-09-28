from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class HardwareDevice(Base):
    __tablename__ = "hardware_devices"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False) # e.g. "ESP32-Water-Telemetry-Node-01"
    device_type = Column(String, nullable=False, default="ESP32") # ESP32, Arduino, Raspberry Pi, LoRaWAN Node, Gateway
    status = Column(String, default="online") # online, standby, error, offline
    is_simulating = Column(Boolean, default=False)
    battery_level = Column(Float, default=92.5) # in %
    signal_strength_dbm = Column(Integer, default=-64) # in dBm
    packet_loss_rate = Column(Float, default=0.8) # in %
    device_temp_c = Column(Float, default=31.5) # in °C
    uptime_seconds = Column(Integer, default=7200) # seconds
    firmware_version = Column(String, default="v1.4.2-idf")
    network_protocol = Column(String, default="LoRaWAN / MQTT") # LoRaWAN, MQTT, HTTP REST, BLE Mesh
    location_label = Column(String, default="Field Sensor Node A")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="hardware_devices")
    sensors = relationship("HardwareSensor", back_populates="device", cascade="all, delete-orphan")
    telemetry_records = relationship("TelemetryRecord", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("HardwareAlert", back_populates="device", cascade="all, delete-orphan")


class HardwareSensor(Base):
    __tablename__ = "hardware_sensors"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("hardware_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False) # Turbidity Sensor, pH Probe, Ambient Temperature, etc.
    sensor_type = Column(String, nullable=False) # turbidity, ph, temperature, humidity, air_quality, pressure, soil_moisture, motion, custom
    unit = Column(String, nullable=False, default="NTU") # NTU, pH, °C, %, ppm, hPa, lux
    min_val = Column(Float, default=0.0)
    max_val = Column(Float, default=100.0)
    sampling_interval_ms = Column(Integer, default=1000) # ms
    normal_range_min = Column(Float, default=0.0)
    normal_range_max = Column(Float, default=10.0)
    warning_threshold = Column(Float, default=15.0)
    critical_threshold = Column(Float, default=25.0)
    current_val = Column(Float, default=3.2)
    status = Column(String, default="normal") # normal, warning, critical, anomaly, offline
    pin_interface = Column(String, default="ADC1_CH0 (GPIO 36)")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    device = relationship("HardwareDevice", back_populates="sensors")
    telemetry_records = relationship("TelemetryRecord", back_populates="sensor", cascade="all, delete-orphan")
    alerts = relationship("HardwareAlert", back_populates="sensor", cascade="all, delete-orphan")


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("hardware_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("hardware_sensors.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_type = Column(String, nullable=True) # sudden_spike, sensor_failure, out_of_range, missing_packet
    raw_payload = Column(JSON, default=dict)

    # Relationships
    device = relationship("HardwareDevice", back_populates="telemetry_records")
    sensor = relationship("HardwareSensor", back_populates="telemetry_records")


class HardwareAlert(Base):
    __tablename__ = "hardware_alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("hardware_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("hardware_sensors.id", ondelete="CASCADE"), nullable=True)
    alert_level = Column(String, default="WARNING") # INFO, WARNING, CRITICAL
    message = Column(String, nullable=False)
    sensor_name = Column(String, default="")
    recorded_value = Column(Float, default=0.0)
    threshold_exceeded = Column(Float, default=0.0)
    is_resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="hardware_alerts")
    device = relationship("HardwareDevice", back_populates="alerts")
    sensor = relationship("HardwareSensor", back_populates="alerts")


class HardwareExperiment(Base):
    __tablename__ = "hardware_experiments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False) # "Water Quality Pathogen Spike & LoRa Retransmission Test"
    objective = Column(Text, nullable=False)
    status = Column(String, default="completed") # draft, running, completed, archived
    duration_seconds = Column(Integer, default=300)
    sensors_tested = Column(JSON, default=list) # ["Turbidity", "pH Probe", "Temperature"]
    anomalies_detected = Column(Integer, default=0)
    packets_transmitted = Column(Integer, default=0)
    packet_loss_pct = Column(Float, default=0.0)
    observations = Column(Text, default="")
    ai_evaluation = Column(Text, default="")
    result_summary = Column(String, default="Validated successfully")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="hardware_experiments")
