import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.resource_matchmaker import (
    ResourceMatchProfile,
    ProjectResourceRequirement,
    StudentOwnedHardware,
    StudentSkillItem,
)
from app.models.hardware import HardwareDevice
from app.models.insight import AIInsight

logger = logging.getLogger("inno_sphere")


class ResourceRequirementService:
    """
    Extracts, standardizes, and manages project requirements across
    Hardware, Software, AI/ML, Cloud/Compute, Datasets, Services, and Research.
    """

    @classmethod
    def get_or_create_profile(cls, db: Session, project_id: int) -> ResourceMatchProfile:
        profile = db.query(ResourceMatchProfile).filter(ResourceMatchProfile.project_id == project_id).first()
        if not profile:
            profile = ResourceMatchProfile(
                project_id=project_id,
                total_budget=10000.0,
                currency="INR",
                hardware_budget=6000.0,
                software_budget=0.0,
                cloud_budget=1000.0,
                dataset_budget=0.0,
                monthly_recurring_budget=500.0,
                project_stage="PROTOTYPING",
                location_country="India",
                open_source_preference="PREFERRED",
                offline_preference="PREFERRED",
                learning_willingness="HIGH",
                compute_preferences_json={
                    "has_gpu": False,
                    "local_ram_gb": 16,
                    "allow_free_cloud": True,
                    "target_deployment": "EDGE_DEVICE",
                },
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

            # Auto-seed baseline hardware if none exists
            default_hw = StudentOwnedHardware(
                profile_id=profile.id,
                name="ESP32 Development Board",
                category="Microcontroller",
                quantity=1,
                condition="GOOD",
                ownership_status="OWNED",
                interfaces_json=["Wi-Fi", "Bluetooth", "GPIO", "ADC", "I2C", "SPI"],
                specs_json={"clock_speed": "240MHz", "ram": "520KB", "flash": "4MB"},
                availability_status="AVAILABLE",
                notes="Personal development board available for telemetry and edge sensing",
            )
            laptop_hw = StudentOwnedHardware(
                profile_id=profile.id,
                name="Student Laptop (Intel i5, 16GB RAM)",
                category="Laptop/PC",
                quantity=1,
                condition="GOOD",
                ownership_status="OWNED",
                interfaces_json=["USB 3.0", "Wi-Fi", "Bluetooth"],
                specs_json={"cpu": "Intel i5", "ram": "16GB", "gpu": "Integrated Intel Iris Xe"},
                availability_status="AVAILABLE",
                notes="Main development machine for Python training and IDE",
            )
            db.add_all([default_hw, laptop_hw])

            # Auto-seed baseline student skills
            skills = [
                StudentSkillItem(profile_id=profile.id, skill_name="Python", proficiency_level="ADVANCED", willing_to_learn=True),
                StudentSkillItem(profile_id=profile.id, skill_name="IoT & Telemetry", proficiency_level="INTERMEDIATE", willing_to_learn=True),
                StudentSkillItem(profile_id=profile.id, skill_name="Embedded C / Arduino", proficiency_level="BEGINNER", willing_to_learn=True),
                StudentSkillItem(profile_id=profile.id, skill_name="Machine Learning", proficiency_level="INTERMEDIATE", willing_to_learn=True),
            ]
            db.add_all(skills)
            db.commit()
            db.refresh(profile)

        return profile

    @classmethod
    def extract_and_sync_requirements(cls, db: Session, project: Project) -> List[ProjectResourceRequirement]:
        """
        Deeply extracts project requirements from title, problem, solution, technologies, and hardware.
        """
        existing = db.query(ProjectResourceRequirement).filter(ProjectResourceRequirement.project_id == project.id).all()
        if existing:
            return existing

        inferred_reqs: List[ProjectResourceRequirement] = []
        domain_lower = (project.domain or "").lower()
        text_corpus = f"{project.title} {project.problem_statement or ''} {project.proposed_solution or ''}".lower()

        # 1. Hardware Requirements
        if any(w in text_corpus for w in ["sensor", "soil", "water", "temperature", "camera", "probe", "hardware", "iot"]):
            if "water" in text_corpus or "soil" in text_corpus or "moisture" in text_corpus:
                inferred_reqs.append(
                    ProjectResourceRequirement(
                        project_id=project.id,
                        name="Environmental & Soil Moisture Sensors",
                        category="HARDWARE",
                        description="Analog/Digital soil moisture and environmental probe array for real-time field telemetry.",
                        priority="CRITICAL",
                        is_hard_constraint=True,
                        status="AI_INFERRED",
                        specs_json={"interface": "ADC/GPIO", "voltage": "3.3V-5V", "sampling_rate": "1Hz"},
                    )
                )
            if "camera" in text_corpus or "vision" in text_corpus or "image" in text_corpus:
                inferred_reqs.append(
                    ProjectResourceRequirement(
                        project_id=project.id,
                        name="Low-Power Optical Camera Module",
                        category="HARDWARE",
                        description="OV2640 or USB webcam interface for edge visual inspection.",
                        priority="HIGH",
                        is_hard_constraint=True,
                        status="AI_INFERRED",
                        specs_json={"resolution": "2MP/1080p", "interface": "DVP/USB"},
                    )
                )

            # Microcontroller requirement
            inferred_reqs.append(
                ProjectResourceRequirement(
                    project_id=project.id,
                    name="Edge Microcontroller Unit (MCU)",
                    category="HARDWARE",
                    description="Low-power MCU capable of ADC sampling, wireless telemetry, and lightweight TinyML inference.",
                    priority="CRITICAL",
                    is_hard_constraint=True,
                    status="AI_INFERRED",
                    specs_json={"architecture": "Xtensa/ARM Cortex", "connectivity": "Wi-Fi/BLE/LoRa", "flash": ">=4MB"},
                )
            )

        # 2. Software Frameworks
        inferred_reqs.append(
            ProjectResourceRequirement(
                project_id=project.id,
                name="Python Backend & REST API Framework",
                category="SOFTWARE",
                description="FastAPI or Flask framework for local/cloud telemetry ingestion and inference serving.",
                priority="HIGH",
                is_hard_constraint=False,
                status="AI_INFERRED",
                specs_json={"language": "Python 3.10+", "framework": "FastAPI"},
            )
        )

        # 3. AI / ML Model & Runtime
        if any(w in text_corpus for w in ["ai", "ml", "detection", "model", "neural", "predict", "classifier", "ppo"]):
            inferred_reqs.append(
                ProjectResourceRequirement(
                    project_id=project.id,
                    name="Pretrained TinyML Anomaly / Classification Model",
                    category="AI_ML",
                    description="Lightweight quantized neural network (TFLite/ONNX) suitable for resource-constrained edge execution.",
                    priority="HIGH",
                    is_hard_constraint=True,
                    status="AI_INFERRED",
                    specs_json={"framework": "TensorFlow Lite Micro / ONNX", "model_size_max_mb": 2.0},
                )
            )

        # 4. Dataset Requirement
        inferred_reqs.append(
            ProjectResourceRequirement(
                project_id=project.id,
                name="Open Scientific Benchmark Dataset",
                category="DATA",
                description=f"Publicly accessible domain dataset for baseline training and reproducible empirical validation in {project.domain or 'Engineering'}.",
                priority="HIGH",
                is_hard_constraint=True,
                status="AI_INFERRED",
                specs_json={"format": "CSV/Parquet/JSON", "license": "Open Access/CC-BY"},
            )
        )

        # 5. Cloud / Compute Requirement
        inferred_reqs.append(
            ProjectResourceRequirement(
                project_id=project.id,
                name="Zero-Cost Development Compute Environment",
                category="CLOUD_COMPUTE",
                description="Local CPU runtime or Google Colab / Kaggle free notebook tier for exploratory model development without recurring GPU billing.",
                priority="MEDIUM",
                is_hard_constraint=False,
                status="AI_INFERRED",
                specs_json={"tier": "Free / Local CPU", "gpu_required": False},
            )
        )

        db.add_all(inferred_reqs)
        db.commit()
        return db.query(ProjectResourceRequirement).filter(ProjectResourceRequirement.project_id == project.id).all()
