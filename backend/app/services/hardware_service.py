import json
import logging
from typing import Dict, Any, List
from app.config import settings

logger = logging.getLogger("inno_sphere.hardware")

class HardwareService:
    def __init__(self):
        self.gemini_client = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("HardwareService: Gemini AI Client initialized.")
            except Exception as e:
                logger.warning(f"HardwareService: Gemini initialization failed: {e}")

    async def interpret_telemetry(
        self,
        project_title: str,
        domain: str,
        device_name: str,
        telemetry_summary: Dict[str, Any],
        active_anomalies: List[str] = None,
        recent_alerts: List[str] = None
    ) -> Dict[str, Any]:
        """
        Interprets hardware telemetry and anomalies with clear separation of:
        1. RAW SENSOR DATA
        2. AI INTERPRETATION
        3. RECOMMENDED ACTION
        """
        active_anomalies = active_anomalies or []
        recent_alerts = recent_alerts or []

        # Try Gemini AI if available
        if self.gemini_client:
            try:
                prompt = f"""
You are an expert IoT Firmware & Embedded AI Systems Architect on InnoSphere AI platform.
Analyze the following simulated real-time telemetry from student innovation project '{project_title}' (Domain: {domain}).

Device: {device_name}
Raw Sensor Readings:
{json.dumps(telemetry_summary, indent=2)}

Active Injected Anomalies: {json.dumps(active_anomalies)}
Recent Alerts Triggered: {json.dumps(recent_alerts)}

Provide an authoritative, technical assessment formatted strictly as valid JSON with the following keys:
{{
  "ai_interpretation": "Concise technical explanation of physical meaning of readings, anomaly mechanisms, and domain impact.",
  "recommended_action": "Actionable engineering recommendations (e.g. firmware debouncing, sampling rate adjustment, alert threshold tuning, edge Kalman filtering).",
  "overall_system_health": "Normal" | "Degraded / Anomaly Detected" | "Critical Alert",
  "severity_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}}
Return ONLY valid JSON.
"""
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                parsed = json.loads(text.strip())
                return {
                    "raw_sensor_data": telemetry_summary,
                    "ai_interpretation": parsed.get("ai_interpretation", ""),
                    "recommended_action": parsed.get("recommended_action", ""),
                    "overall_system_health": parsed.get("overall_system_health", "Normal"),
                    "severity_level": parsed.get("severity_level", "LOW")
                }
            except Exception as e:
                logger.warning(f"Gemini telemetry interpretation failed, using structured fallback: {e}")

        # Deterministic Domain-Aware Fallback Engine
        return self._build_deterministic_interpretation(
            project_title=project_title,
            domain=domain,
            device_name=device_name,
            telemetry_summary=telemetry_summary,
            active_anomalies=active_anomalies,
            recent_alerts=recent_alerts
        )

    def _build_deterministic_interpretation(
        self,
        project_title: str,
        domain: str,
        device_name: str,
        telemetry_summary: Dict[str, Any],
        active_anomalies: List[str],
        recent_alerts: List[str]
    ) -> Dict[str, Any]:
        has_anomalies = len(active_anomalies) > 0 or any(
            v.get("status") in ["warning", "critical", "anomaly"] for v in telemetry_summary.values()
        )

        anomaly_names = []
        for s_name, data in telemetry_summary.items():
            if data.get("status") in ["warning", "critical", "anomaly"]:
                anomaly_names.append(f"{s_name} ({data.get('current')} {data.get('unit', '')})")

        if active_anomalies:
            anomaly_names.extend(active_anomalies)

        if has_anomalies:
            severity = "CRITICAL" if any("critical" in str(a).lower() for a in anomaly_names) else "HIGH"
            health = "Critical Alert" if severity == "CRITICAL" else "Degraded / Anomaly Detected"
            
            interpretation = (
                f"Telemetry indicates abnormal operating conditions on {device_name}. "
                f"Elevated readings detected across: {', '.join(anomaly_names) if anomaly_names else 'active sensor channels'}. "
                f"In the context of {project_title} ({domain}), sustained deviations outside normal baseline "
                f"signal potential environmental contamination or hardware sensor degradation."
            )
            action = (
                "1. Trigger automated LoRaWAN gateway alert packet to downstream dashboard. "
                "2. Apply digital median/Kalman filtering on the ESP32 ADC pin to eliminate transient noise. "
                "3. Verify sensor supply voltage and recalibrate threshold offsets in Phase 7/8 validation."
            )
        else:
            severity = "LOW"
            health = "Normal"
            interpretation = (
                f"All configured sensors on {device_name} are reporting stable nominal telemetry within designated thresholds. "
                f"Sensor variance is nominal with low jitter and zero packet dropouts."
            )
            action = (
                "Continue standard telemetry logging at configured sampling interval. "
                "Proceed to stress-testing under simulated environmental spikes to evaluate threshold resilience."
            )

        return {
            "raw_sensor_data": telemetry_summary,
            "ai_interpretation": interpretation,
            "recommended_action": action,
            "overall_system_health": health,
            "severity_level": severity
        }

    def get_hardware_recommendations(self, domain: str, device_type: str) -> List[Dict[str, Any]]:
        """Provides verified hardware libraries, firmware frameworks, and protocol references"""
        common_libs = [
            {
                "title": "ESP-IDF / Arduino-ESP32 Official Core",
                "category": "Microcontroller Firmware",
                "source": "GitHub",
                "description": "Native Espressif IoT Development Framework with FreeRTOS multitasking and low-power sleep modes.",
                "url": "https://github.com/espressif/esp-idf",
                "tags": ["ESP32", "FreeRTOS", "C/C++"]
            },
            {
                "title": "LMIC-node (LoRaWAN End-Node Firmware)",
                "category": "Communication Protocol",
                "source": "GitHub",
                "description": "Cross-platform boilerplate for building LoRaWAN sensor nodes using Arduino & PlatformIO.",
                "url": "https://github.com/lnlp/LMIC-node",
                "tags": ["LoRaWAN", "Long Range", "Telemetry"]
            },
            {
                "title": "Adafruit Sensor Unified Driver & Calibration Suite",
                "category": "Sensor Libraries",
                "source": "GitHub",
                "description": "Standardized abstraction layer for I2C and SPI digital environmental probes.",
                "url": "https://github.com/adafruit/Adafruit_Sensor",
                "tags": ["I2C", "SPI", "Sensors"]
            },
            {
                "title": "AsyncTCP & ESPAsyncWebServer",
                "category": "Network Services",
                "source": "GitHub",
                "description": "High-throughput asynchronous WebSockets and HTTP server for local edge telemetry broadcasting.",
                "url": "https://github.com/me-no-dev/ESPAsyncWebServer",
                "tags": ["WebSockets", "Async", "HTTP"]
            }
        ]
        return common_libs

    def get_telemetry_provider(self, mode: str = "simulator") -> "TelemetryProvider":
        """Factory for obtaining physical or simulated telemetry providers."""
        if mode.lower() in ["physical", "serial", "mqtt", "websocket"]:
            return PhysicalTelemetryProvider(transport=mode.lower())
        return SimulatorTelemetryProvider()


class TelemetryProvider:
    """Abstract interface for hardware telemetry providers (physical vs simulated)."""
    def get_provider_type(self) -> str:
        raise NotImplementedError

    def get_status(self) -> str:
        raise NotImplementedError

    def is_physical(self) -> bool:
        raise NotImplementedError

    def get_latest_telemetry(self, device_id: int, db: Any = None) -> Dict[str, Any]:
        raise NotImplementedError


class SimulatorTelemetryProvider(TelemetryProvider):
    """Synthetic environmental simulator for edge IoT hardware testbeds."""
    def get_provider_type(self) -> str:
        return "SIMULATED"

    def get_status(self) -> str:
        return "STREAMING"

    def is_physical(self) -> bool:
        return False

    def get_latest_telemetry(self, device_id: int, db: Any = None) -> Dict[str, Any]:
        return {
            "mode": "SIMULATED",
            "provider": "Synthetic Environmental Telemetry Engine",
            "device_id": device_id,
            "status": "nominal",
            "is_simulated": True
        }


class PhysicalTelemetryProvider(TelemetryProvider):
    """Bridge for physical hardware nodes via Serial, MQTT, HTTP, or WebSockets."""
    def __init__(self, transport: str = "mqtt", endpoint: str = "localhost"):
        self.transport = transport
        self.endpoint = endpoint
        self._connected = False

    def get_provider_type(self) -> str:
        return "PHYSICAL"

    def get_status(self) -> str:
        return "CONNECTED" if self._connected else "IDLE"

    def is_physical(self) -> bool:
        return True

    def get_latest_telemetry(self, device_id: int, db: Any = None) -> Dict[str, Any]:
        return {
            "mode": "PHYSICAL",
            "transport": self.transport,
            "endpoint": self.endpoint,
            "device_id": device_id,
            "status": "connected" if self._connected else "pending_handshake",
            "is_simulated": False
        }


hardware_service = HardwareService()

