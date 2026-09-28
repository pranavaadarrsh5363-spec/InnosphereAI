import logging
from typing import List, Dict, Any, Tuple, Optional
from app.models.resource_matchmaker import ResourceMatchProfile, StudentOwnedHardware, StudentSkillItem

logger = logging.getLogger("inno_sphere")


class ResourceCompatibilityService:
    """
    Evaluates multi-dimensional compatibility across:
    1. Technical & Interface Compatibility (Hardware <-> Software <-> Runtimes)
    2. Compute Sizing (CPU, RAM, GPU, Edge)
    3. Skill Fit & Learning Curve
    4. Open-Source & Low-Cost Alternative Generation
    """

    HARDWARE_COMPATIBILITY_MATRIX = {
        "ESP32 Development Board": {
            "TensorFlow Lite Micro": "COMPATIBLE",
            "MicroPython": "COMPATIBLE",
            "Arduino C++ Core": "COMPATIBLE",
            "FastAPI": "INCOMPATIBLE", # Run on laptop/server, not on MCU
            "PyTorch Full": "INCOMPATIBLE",
            "SQLite": "PARTIAL",
            "LoRaWAN SX1276 Module": "COMPATIBLE",
            "DHT22 Sensor": "COMPATIBLE",
            "Capacitive Soil Moisture Probe": "COMPATIBLE",
            "OV2640 Camera": "COMPATIBLE",
        },
        "Raspberry Pi 4 / 5": {
            "TensorFlow Lite": "COMPATIBLE",
            "ONNX Runtime": "COMPATIBLE",
            "OpenCV Python": "COMPATIBLE",
            "FastAPI": "COMPATIBLE",
            "PyTorch CPU": "COMPATIBLE",
            "PostgreSQL": "COMPATIBLE",
            "SQLite": "COMPATIBLE",
            "USB Camera": "COMPATIBLE",
        },
        "Student Laptop": {
            "FastAPI": "COMPATIBLE",
            "PyTorch": "COMPATIBLE",
            "Scikit-Learn": "COMPATIBLE",
            "TensorFlow": "COMPATIBLE",
            "PostgreSQL": "COMPATIBLE",
            "Docker": "COMPATIBLE",
            "Jupyter / Google Colab": "COMPATIBLE",
        },
    }

    OPEN_SOURCE_ALTERNATIVES_REGISTRY = [
        {
            "target_expensive_resource": "Commercial Cloud GPU (NVIDIA A100 / H100)",
            "alternative_name": "Google Colab Free Tier / Local CPU Quantized Inference",
            "category": "CLOUD_COMPUTE",
            "substitute_reason": "TOO_EXPENSIVE",
            "estimated_cost": 0.0,
            "cost_savings": 5000.0,
            "tradeoffs": [
                "Session timeout on free notebook tier",
                "Longer training duration for large batches (CPU/T4 vs A100)",
            ],
            "performance_comparison": "Adequate for small-to-medium datasets (<50,000 samples) and INT8 quantized models.",
            "compatibility_status": "COMPATIBLE",
        },
        {
            "target_expensive_resource": "Industrial Multi-Parameter Water Sonde ($1,500+)",
            "alternative_name": "Analog Optical Turbidity & DFRobot pH Probe Array",
            "category": "HARDWARE",
            "substitute_reason": "TOO_EXPENSIVE",
            "estimated_cost": 1800.0,
            "cost_savings": 90000.0,
            "tradeoffs": [
                "Requires periodic manual buffer calibration",
                "Lower operational lifespan under harsh field conditions",
            ],
            "performance_comparison": "Maintains R^2 > 0.92 correlation with laboratory standards after 2-point calibration.",
            "compatibility_status": "COMPATIBLE",
        },
        {
            "target_expensive_resource": "Proprietary Commercial LLM API",
            "alternative_name": "Hugging Face Quantized Open-Source Model (e.g. TinyLlama / Phi-2)",
            "category": "AI_ML",
            "substitute_reason": "OPEN_SOURCE_PREFERENCE",
            "estimated_cost": 0.0,
            "cost_savings": 2500.0,
            "tradeoffs": [
                "Requires local memory (~2GB RAM for 4-bit GGUF)",
                "More focused domain context required",
            ],
            "performance_comparison": "Zero recurring API costs and total offline operational independence.",
            "compatibility_status": "COMPATIBLE",
        },
        {
            "target_expensive_resource": "Paid Cloud Database Service",
            "alternative_name": "Embedded SQLite / Self-Hosted PostgreSQL",
            "category": "SOFTWARE",
            "substitute_reason": "TOO_EXPENSIVE",
            "estimated_cost": 0.0,
            "cost_savings": 1200.0,
            "tradeoffs": [
                "Manual backup and schema migration required",
            ],
            "performance_comparison": "Sub-millisecond query latency for local time-series records.",
            "compatibility_status": "COMPATIBLE",
        },
    ]

    @classmethod
    def evaluate_hardware_compatibility(
        cls, resource_name: str, owned_hardware: List[StudentOwnedHardware]
    ) -> Tuple[float, str, List[str]]:
        """
        Determines hardware compatibility score (0-100), status, and notes.
        """
        notes = []
        if not owned_hardware:
            return 80.0, "UNKNOWN", ["No student hardware registered; general specification applied."]

        hw_names = [h.name for h in owned_hardware]
        
        # Check matching
        for hw in owned_hardware:
            matrix = cls.HARDWARE_COMPATIBILITY_MATRIX.get(hw.name) or cls.HARDWARE_COMPATIBILITY_MATRIX.get("ESP32 Development Board", {})
            for key, status in matrix.items():
                if key.lower() in resource_name.lower() or resource_name.lower() in key.lower():
                    if status == "COMPATIBLE":
                        notes.append(f"Fully compatible with your owned {hw.name}")
                        return 95.0, "COMPATIBLE", notes
                    elif status == "PARTIAL":
                        notes.append(f"Partially compatible with {hw.name} with minor memory optimizations")
                        return 75.0, "PARTIALLY_COMPATIBLE", notes
                    elif status == "INCOMPATIBLE":
                        notes.append(f"Incompatible with direct execution on {hw.name} (Requires host laptop/server)")
                        return 40.0, "INCOMPATIBLE", notes

        # Fallback heuristic
        if any("esp32" in h.lower() for h in hw_names) and any(w in resource_name.lower() for w in ["sensor", "probe", "adc", "gpio", "dht", "lora"]):
            notes.append("Standard 3.3V/5V GPIO interface compatible with ESP32 pinouts.")
            return 92.0, "COMPATIBLE", notes

        if any("laptop" in h.lower() for h in hw_names) and any(w in resource_name.lower() for w in ["python", "pytorch", "fastapi", "scikit", "colab"]):
            notes.append("Fully runnable on student host laptop.")
            return 95.0, "COMPATIBLE", notes

        return 85.0, "COMPATIBLE", ["Standard technical compatibility across prototype architectures."]

    @classmethod
    def evaluate_skill_fit(
        cls, resource_name: str, resource_difficulty: str, student_skills: List[StudentSkillItem]
    ) -> Tuple[float, str, List[str]]:
        """
        Evaluates student skill compatibility and learning difficulty.
        """
        skill_map = {s.skill_name.lower(): s.proficiency_level.upper() for s in student_skills}
        notes = []

        # Check Python
        if "python" in resource_name.lower() or "fastapi" in resource_name.lower() or "pytorch" in resource_name.lower():
            py_level = skill_map.get("python", "INTERMEDIATE")
            if py_level in ["ADVANCED", "EXPERT"]:
                notes.append("Matches student's Advanced Python proficiency.")
                return 95.0, "READY", notes
            elif py_level == "INTERMEDIATE":
                notes.append("Well within student's Intermediate Python capability.")
                return 88.0, "READY", notes
            else:
                notes.append("Requires introductory Python concepts (Beginner friendly tutorials available).")
                return 70.0, "LEARNING_REQUIRED", notes

        # Check Embedded C / Arduino
        if "c++" in resource_name.lower() or "embedded" in resource_name.lower() or "microcontroller" in resource_name.lower():
            c_level = skill_map.get("embedded c / arduino", skill_map.get("embedded c", "BEGINNER"))
            if c_level in ["ADVANCED", "EXPERT"]:
                notes.append("Matches student's Embedded C proficiency.")
                return 95.0, "READY", notes
            elif c_level == "INTERMEDIATE":
                notes.append("Good fit for student's Embedded programming skills.")
                return 85.0, "READY", notes
            else:
                notes.append("Beginner level: Easy start with standard Arduino IDE / PlatformIO libraries.")
                return 75.0, "LEARNING_REQUIRED", notes

        return 85.0, "READY", ["Standard developer learning curve; accessible documentation."]

    @classmethod
    def find_alternatives(cls, resource_name: str, estimated_cost: float) -> List[Dict[str, Any]]:
        """
        Searches for open-source or low-cost substitutes.
        """
        results = []
        for alt in cls.OPEN_SOURCE_ALTERNATIVES_REGISTRY:
            if alt["target_expensive_resource"].lower() in resource_name.lower() or resource_name.lower() in alt["target_expensive_resource"].lower():
                results.append(alt)

        if not results and estimated_cost > 3000.0:
            # Generate smart heuristic alternative for expensive generic item
            results.append({
                "target_expensive_resource": resource_name,
                "alternative_name": f"Open-Source / Community Edition {resource_name}",
                "category": "SOFTWARE",
                "substitute_reason": "TOO_EXPENSIVE",
                "estimated_cost": 0.0,
                "cost_savings": estimated_cost,
                "tradeoffs": ["Self-hosted maintenance", "Community forum support"],
                "performance_comparison": "Delivers core functionality at zero licensing expense.",
                "compatibility_status": "COMPATIBLE",
            })

        return results
