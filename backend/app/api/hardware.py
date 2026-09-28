from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.hardware import (
    HardwareDevice, HardwareSensor, TelemetryRecord, HardwareAlert, HardwareExperiment
)
from app.schemas.hardware import (
    HardwareDeviceCreate, HardwareDeviceResponse,
    HardwareSensorCreate, HardwareSensorResponse,
    TelemetryBatchCreate, TelemetryRecordResponse,
    AnomalyInjectRequest, HardwareAlertResponse,
    HardwareExperimentCreate, HardwareExperimentResponse,
    TelemetryInterpretationRequest, TelemetryInterpretationResponse,
    HardwareProjectOverviewResponse
)
from app.services.hardware_service import hardware_service
from app.utils.security import get_optional_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.config import settings

router = APIRouter(prefix="/hardware", tags=["Hardware Lab & Telemetry Simulator"])

def _provision_default_hardware_for_project(project: Project, db: Session) -> HardwareDevice:
    """Provisions default domain-matched hardware & sensors if none exist"""
    domain = (project.domain or "").lower()
    
    if "health" in domain or "water" in domain or "medical" in domain:
        device_name = "ESP32-Community-Water-Node-01"
        device_type = "ESP32"
        protocol = "LoRaWAN / MQTT"
        sensors_config = [
            {"name": "Water Turbidity Sensor", "sensor_type": "turbidity", "unit": "NTU", "min_val": 0.0, "max_val": 100.0, "normal_min": 0.0, "normal_max": 5.0, "warn": 15.0, "crit": 25.0, "current": 3.4, "pin": "ADC1_CH0 (GPIO 36)"},
            {"name": "pH Chemical Probe", "sensor_type": "ph", "unit": "pH", "min_val": 0.0, "max_val": 14.0, "normal_min": 6.5, "normal_max": 8.5, "warn": 9.0, "crit": 10.5, "current": 7.3, "pin": "ADC1_CH3 (GPIO 39)"},
            {"name": "Water Temperature Sensor", "sensor_type": "temperature", "unit": "°C", "min_val": -10.0, "max_val": 60.0, "normal_min": 18.0, "normal_max": 28.0, "warn": 35.0, "crit": 45.0, "current": 23.6, "pin": "OneWire (GPIO 4)"},
            {"name": "Conductivity / TDS Meter", "sensor_type": "custom", "unit": "ppm", "min_val": 0.0, "max_val": 2000.0, "normal_min": 50.0, "normal_max": 300.0, "warn": 500.0, "crit": 800.0, "current": 180.0, "pin": "ADC1_CH6 (GPIO 34)"},
        ]
    elif "agri" in domain:
        device_name = "ESP32-AgriSense-Field-Node"
        device_type = "ESP32"
        protocol = "LoRaWAN / Wi-Fi"
        sensors_config = [
            {"name": "Capacitive Soil Moisture", "sensor_type": "soil_moisture", "unit": "%", "min_val": 0.0, "max_val": 100.0, "normal_min": 40.0, "normal_max": 80.0, "warn": 30.0, "crit": 15.0, "current": 62.0, "pin": "ADC1_CH0 (GPIO 36)"},
            {"name": "Ambient Air Temperature", "sensor_type": "temperature", "unit": "°C", "min_val": -20.0, "max_val": 60.0, "normal_min": 15.0, "normal_max": 32.0, "warn": 38.0, "crit": 45.0, "current": 27.8, "pin": "I2C SDA/SCL"},
            {"name": "Relative Humidity (DHT22)", "sensor_type": "humidity", "unit": "%", "min_val": 0.0, "max_val": 100.0, "normal_min": 45.0, "normal_max": 85.0, "warn": 90.0, "crit": 95.0, "current": 68.4, "pin": "GPIO 15"},
            {"name": "Soil pH & Salinity Probe", "sensor_type": "ph", "unit": "pH", "min_val": 0.0, "max_val": 14.0, "normal_min": 6.0, "normal_max": 7.5, "warn": 8.5, "crit": 9.5, "current": 6.8, "pin": "RS485 Modbus (GPIO 16/17)"},
        ]
    elif "environment" in domain or "waste" in domain:
        device_name = "RPi5-Edge-Waste-Scanner"
        device_type = "Raspberry Pi 5"
        protocol = "MQTT over Wi-Fi"
        sensors_config = [
            {"name": "Optical Material Cam", "sensor_type": "optical", "unit": "fps", "min_val": 0.0, "max_val": 60.0, "normal_min": 25.0, "normal_max": 45.0, "warn": 15.0, "crit": 5.0, "current": 30.0, "pin": "CSI Camera Port"},
            {"name": "Conveyor Load Cell Weight", "sensor_type": "custom", "unit": "kg", "min_val": 0.0, "max_val": 50.0, "normal_min": 0.5, "normal_max": 20.0, "warn": 35.0, "crit": 45.0, "current": 8.2, "pin": "HX711 (GPIO 5/6)"},
            {"name": "Ultrasonic Fill Level", "sensor_type": "distance", "unit": "cm", "min_val": 2.0, "max_val": 400.0, "normal_min": 50.0, "normal_max": 300.0, "warn": 20.0, "crit": 10.0, "current": 140.0, "pin": "HC-SR04 (GPIO 23/24)"},
            {"name": "Methane / VOC Gas Sensor", "sensor_type": "air_quality", "unit": "ppm", "min_val": 0.0, "max_val": 1000.0, "normal_min": 10.0, "normal_max": 100.0, "warn": 250.0, "crit": 500.0, "current": 42.0, "pin": "MQ-4 (I2C ADC)"},
        ]
    else:
        device_name = "IoT-Edge-Micro-Gateway-01"
        device_type = "ESP32"
        protocol = "LoRaWAN / MQTT"
        sensors_config = [
            {"name": "Core Environmental Temp", "sensor_type": "temperature", "unit": "°C", "min_val": -10.0, "max_val": 60.0, "normal_min": 15.0, "normal_max": 35.0, "warn": 40.0, "crit": 50.0, "current": 25.4, "pin": "GPIO 4"},
            {"name": "Atmospheric Pressure", "sensor_type": "pressure", "unit": "hPa", "min_val": 800.0, "max_val": 1200.0, "normal_min": 980.0, "normal_max": 1030.0, "warn": 1050.0, "crit": 1080.0, "current": 1013.2, "pin": "BMP280 (I2C)"},
            {"name": "Telemetry Jitter / Latency", "sensor_type": "custom", "unit": "ms", "min_val": 0.0, "max_val": 500.0, "normal_min": 10.0, "normal_max": 80.0, "warn": 150.0, "crit": 300.0, "current": 42.0, "pin": "Ping Timer"},
        ]

    dev = HardwareDevice(
        project_id=project.id,
        name=device_name,
        device_type=device_type,
        network_protocol=protocol,
        location_label=f"Pilot Field Station ({project.domain})",
        status="online",
        battery_level=94.5,
        signal_strength_dbm=-62,
        packet_loss_rate=0.7,
        device_temp_c=31.2,
        uptime_seconds=8400,
        firmware_version="v1.4.2-idf",
        is_simulating=True
    )
    db.add(dev)
    db.flush()

    for sc in sensors_config:
        sensor = HardwareSensor(
            device_id=dev.id,
            name=sc["name"],
            sensor_type=sc["sensor_type"],
            unit=sc["unit"],
            min_val=sc["min_val"],
            max_val=sc["max_val"],
            sampling_interval_ms=1000,
            normal_range_min=sc["normal_min"],
            normal_range_max=sc["normal_max"],
            warning_threshold=sc["warn"],
            critical_threshold=sc["crit"],
            current_val=sc["current"],
            status="normal",
            pin_interface=sc["pin"]
        )
        db.add(sensor)

    # Initial historical experiment
    exp = HardwareExperiment(
        project_id=project.id,
        name=f"Baseline Telemetry & Packet Loss Benchmark ({device_name})",
        objective=f"Validate LoRaWAN payload framing and verify baseline jitter across {len(sensors_config)} active sensors.",
        status="completed",
        duration_seconds=300,
        sensors_tested=[sc["name"] for sc in sensors_config],
        anomalies_detected=0,
        packets_transmitted=298,
        packet_loss_pct=0.67,
        observations="Nominal RSSI stability with -62 dBm average signal. No buffer overflows detected on ESP32 FreeRTOS telemetry queue.",
        ai_evaluation="Hardware firmware baseline established. Telemetry pipeline ready for Phase 7 edge-to-cloud integration.",
        result_summary="Verified Nominal Baseline"
    )
    db.add(exp)
    db.commit()
    db.refresh(dev)
    return dev


@router.get("/projects/{project_id}", response_model=HardwareProjectOverviewResponse)
def get_hardware_project_overview(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    devices = db.query(HardwareDevice).filter(HardwareDevice.project_id == project_id).all()
    if not devices:
        _provision_default_hardware_for_project(project, db)
        devices = db.query(HardwareDevice).filter(HardwareDevice.project_id == project_id).all()

    alerts = db.query(HardwareAlert).filter(
        HardwareAlert.project_id == project_id
    ).order_by(HardwareAlert.timestamp.desc()).limit(15).all()

    experiments = db.query(HardwareExperiment).filter(
        HardwareExperiment.project_id == project_id
    ).order_by(HardwareExperiment.created_at.desc()).all()

    recommendations = hardware_service.get_hardware_recommendations(
        domain=project.domain,
        device_type=devices[0].device_type if devices else "ESP32"
    )

    return {
        "project_id": project.id,
        "project_title": project.title,
        "domain": project.domain,
        "devices": devices,
        "recent_alerts": alerts,
        "experiments": experiments,
        "recommended_hardware_resources": recommendations
    }


@router.post("/devices", response_model=HardwareDeviceResponse)
def create_hardware_device(dev_in: HardwareDeviceCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == dev_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    dev = HardwareDevice(
        project_id=dev_in.project_id,
        name=dev_in.name,
        device_type=dev_in.device_type,
        network_protocol=dev_in.network_protocol,
        location_label=dev_in.location_label or "Field Sensor Node",
        firmware_version=dev_in.firmware_version or "v1.0.0",
        status="online",
        battery_level=98.0,
        signal_strength_dbm=-60,
        packet_loss_rate=0.5,
        device_temp_c=30.0,
        uptime_seconds=0
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev


@router.post("/sensors", response_model=HardwareSensorResponse)
def create_hardware_sensor(s_in: HardwareSensorCreate, db: Session = Depends(get_db)):
    device = db.query(HardwareDevice).filter(HardwareDevice.id == s_in.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    sensor = HardwareSensor(
        device_id=s_in.device_id,
        name=s_in.name,
        sensor_type=s_in.sensor_type,
        unit=s_in.unit,
        min_val=s_in.min_val,
        max_val=s_in.max_val,
        sampling_interval_ms=s_in.sampling_interval_ms,
        normal_range_min=s_in.normal_range_min,
        normal_range_max=s_in.normal_range_max,
        warning_threshold=s_in.warning_threshold,
        critical_threshold=s_in.critical_threshold,
        pin_interface=s_in.pin_interface or "GPIO Pin",
        current_val=s_in.normal_range_min + (s_in.normal_range_max - s_in.normal_range_min) * 0.5,
        status="normal"
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.delete("/sensors/{sensor_id}")
def delete_hardware_sensor(sensor_id: int, db: Session = Depends(get_db)):
    sensor = db.query(HardwareSensor).filter(HardwareSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    db.delete(sensor)
    db.commit()
    return {"status": "deleted", "sensor_id": sensor_id}


@router.post("/telemetry/batch")
def record_telemetry_batch(batch: TelemetryBatchCreate, db: Session = Depends(get_db)):
    device = db.query(HardwareDevice).filter(HardwareDevice.id == batch.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if batch.battery_level is not None:
        device.battery_level = batch.battery_level
    if batch.signal_strength_dbm is not None:
        device.signal_strength_dbm = batch.signal_strength_dbm
    if batch.packet_loss_rate is not None:
        device.packet_loss_rate = batch.packet_loss_rate
    if batch.device_temp_c is not None:
        device.device_temp_c = batch.device_temp_c

    records_created = 0
    new_alerts = []

    for pt in batch.points:
        sensor = db.query(HardwareSensor).filter(HardwareSensor.id == pt.sensor_id).first()
        if sensor:
            sensor.current_val = pt.value
            
            # Determine status
            if pt.is_anomaly or pt.value >= sensor.critical_threshold:
                sensor.status = "critical"
                alert = HardwareAlert(
                    project_id=device.project_id,
                    device_id=device.id,
                    sensor_id=sensor.id,
                    alert_level="CRITICAL",
                    message=f"{sensor.name} exceeded critical threshold: {pt.value:.2f} {sensor.unit} (Limit: {sensor.critical_threshold} {sensor.unit})",
                    sensor_name=sensor.name,
                    recorded_value=pt.value,
                    threshold_exceeded=sensor.critical_threshold,
                    is_resolved=False
                )
                db.add(alert)
                new_alerts.append(alert)
            elif pt.value >= sensor.warning_threshold:
                sensor.status = "warning"
                alert = HardwareAlert(
                    project_id=device.project_id,
                    device_id=device.id,
                    sensor_id=sensor.id,
                    alert_level="WARNING",
                    message=f"{sensor.name} exceeded warning threshold: {pt.value:.2f} {sensor.unit} (Limit: {sensor.warning_threshold} {sensor.unit})",
                    sensor_name=sensor.name,
                    recorded_value=pt.value,
                    threshold_exceeded=sensor.warning_threshold,
                    is_resolved=False
                )
                db.add(alert)
                new_alerts.append(alert)
            else:
                sensor.status = "normal"

            rec = TelemetryRecord(
                device_id=device.id,
                sensor_id=sensor.id,
                value=pt.value,
                is_anomaly=pt.is_anomaly,
                anomaly_type=pt.anomaly_type
            )
            db.add(rec)
            records_created += 1

    db.commit()
    return {"status": "success", "records_ingested": records_created, "alerts_triggered": len(new_alerts)}


@router.get("/telemetry/{device_id}", response_model=List[TelemetryRecordResponse])
def get_device_telemetry(device_id: int, limit: int = 60, db: Session = Depends(get_db)):
    records = db.query(TelemetryRecord).filter(
        TelemetryRecord.device_id == device_id
    ).order_by(TelemetryRecord.timestamp.desc()).limit(limit).all()
    return records


@router.post("/anomalies/inject")
def inject_hardware_anomaly(req: AnomalyInjectRequest, db: Session = Depends(get_db)):
    device = db.query(HardwareDevice).filter(HardwareDevice.id == req.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    sensor = db.query(HardwareSensor).filter(HardwareSensor.id == req.sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    # Compute anomalous value
    if req.custom_value is not None:
        val = req.custom_value
    else:
        if req.anomaly_type == "sudden_spike":
            val = sensor.critical_threshold * (req.spike_multiplier or 1.8)
        elif req.anomaly_type == "sensor_failure":
            val = 0.0
        elif req.anomaly_type == "out_of_range":
            val = sensor.max_val * 1.25
        elif req.anomaly_type == "battery_drop":
            device.battery_level = max(device.battery_level - 35.0, 12.0)
            val = sensor.current_val
        elif req.anomaly_type == "packet_loss_burst":
            device.packet_loss_rate = 18.5
            val = sensor.current_val
        else:
            val = sensor.critical_threshold * 1.5

    sensor.current_val = val
    sensor.status = "critical" if val >= sensor.critical_threshold else "anomaly"

    # Create record
    rec = TelemetryRecord(
        device_id=device.id,
        sensor_id=sensor.id,
        value=val,
        is_anomaly=True,
        anomaly_type=req.anomaly_type,
        raw_payload={"injected_at": datetime.utcnow().isoformat(), "anomaly": req.anomaly_type}
    )
    db.add(rec)

    # Trigger Alert
    alert = HardwareAlert(
        project_id=device.project_id,
        device_id=device.id,
        sensor_id=sensor.id,
        alert_level="CRITICAL",
        message=f"[INJECTED ANOMALY] {sensor.name} triggered {req.anomaly_type.replace('_', ' ').upper()}: {val:.2f} {sensor.unit}",
        sensor_name=sensor.name,
        recorded_value=val,
        threshold_exceeded=sensor.critical_threshold,
        is_resolved=False
    )
    db.add(alert)
    db.commit()

    return {
        "status": "anomaly_injected",
        "sensor_name": sensor.name,
        "injected_value": val,
        "anomaly_type": req.anomaly_type,
        "alert_id": alert.id
    }


@router.get("/alerts/{project_id}", response_model=List[HardwareAlertResponse])
def get_project_alerts(project_id: int, db: Session = Depends(get_db)):
    alerts = db.query(HardwareAlert).filter(
        HardwareAlert.project_id == project_id
    ).order_by(HardwareAlert.timestamp.desc()).limit(30).all()
    return alerts


@router.post("/alerts/{alert_id}/resolve")
def resolve_hardware_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(HardwareAlert).filter(HardwareAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    db.commit()
    return {"status": "resolved", "alert_id": alert_id}


@router.post("/experiments", response_model=HardwareExperimentResponse)
def create_hardware_experiment(exp_in: HardwareExperimentCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == exp_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clean_name = sanitize_text(exp_in.name, max_length=200)
    clean_obj = sanitize_text(exp_in.objective, max_length=1000)
    clean_obs = sanitize_text(exp_in.observations or "", max_length=5000)
    clean_summary = sanitize_text(exp_in.result_summary or "Validated successfully", max_length=500)
    clean_sensors = [sanitize_text(s, max_length=100) for s in (exp_in.sensors_tested or []) if s]

    exp = HardwareExperiment(
        project_id=exp_in.project_id,
        name=clean_name,
        objective=clean_obj,
        status="completed",
        duration_seconds=min(max(1, exp_in.duration_seconds), 86400),
        sensors_tested=clean_sensors,
        anomalies_detected=exp_in.anomalies_detected or 0,
        packets_transmitted=exp_in.packets_transmitted or 300,
        packet_loss_pct=min(max(0.0, exp_in.packet_loss_pct or 0.8), 100.0),
        observations=clean_obs,
        ai_evaluation="Hardware experiment parameters logged into project roadmap evidence.",
        result_summary=clean_summary,
        completed_at=datetime.utcnow()
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/experiments/{project_id}", response_model=List[HardwareExperimentResponse])
def get_project_experiments(project_id: int, db: Session = Depends(get_db)):
    return db.query(HardwareExperiment).filter(
        HardwareExperiment.project_id == project_id
    ).order_by(HardwareExperiment.created_at.desc()).limit(settings.MAX_EXPERIMENTS_PER_PROJECT).all()


@router.post(
    "/interpret",
    response_model=TelemetryInterpretationResponse,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AI_PER_MIN, category="telemetry_interpret"))]
)
async def interpret_telemetry(req: TelemetryInterpretationRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clean_device_name = sanitize_text(req.device_name, max_length=150)
    clean_anomalies = [sanitize_text(a, max_length=100) for a in (req.active_anomalies or []) if a]
    clean_alerts = [sanitize_text(a, max_length=200) for a in (req.recent_alerts or []) if a]

    result = await hardware_service.interpret_telemetry(
        project_title=project.title,
        domain=project.domain,
        device_name=clean_device_name,
        telemetry_summary=req.telemetry_summary,
        active_anomalies=clean_anomalies,
        recent_alerts=clean_alerts
    )
    return result
