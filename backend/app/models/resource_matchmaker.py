from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ResourceMatchProfile(Base):
    """
    Project-specific resource constraint and student capability profile.
    Captures budget, owned hardware, skills, location, stage, and compute preferences.
    """
    __tablename__ = "resource_match_profiles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Budget Constraints
    total_budget = Column(Float, default=10000.0)
    currency = Column(String, default="INR") # INR, USD, EUR, GBP
    hardware_budget = Column(Float, default=6000.0)
    software_budget = Column(Float, default=0.0)
    cloud_budget = Column(Float, default=1000.0)
    dataset_budget = Column(Float, default=0.0)
    monthly_recurring_budget = Column(Float, default=500.0)

    # Project Stage & Location
    project_stage = Column(String, default="PROTOTYPING") # IDEATION, RESEARCH, PROTOTYPING, EXPERIMENTATION, VALIDATION, FIELD_TESTING, COMPETITION, DEPLOYMENT
    location_country = Column(String, default="India")
    location_region = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    institution_name = Column(String, nullable=True)

    # Strategic Preferences
    open_source_preference = Column(String, default="PREFERRED") # REQUIRED, PREFERRED, NEUTRAL
    offline_preference = Column(String, default="PREFERRED") # REQUIRED, PREFERRED, NEUTRAL
    learning_willingness = Column(String, default="HIGH") # HIGH, MODERATE, LOW
    compute_preferences_json = Column(JSON, default=dict) # {"has_gpu": False, "local_ram_gb": 16, "allow_free_cloud": True, "target_deployment": "EDGE_DEVICE"}

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", backref="resource_match_profile")
    owned_hardware = relationship("StudentOwnedHardware", back_populates="profile", cascade="all, delete-orphan")
    skills = relationship("StudentSkillItem", back_populates="profile", cascade="all, delete-orphan")


class StudentOwnedHardware(Base):
    """
    Hardware components, dev boards, sensors, or laptops already owned, borrowed,
    or available in maker labs to prevent unnecessary purchases.
    """
    __tablename__ = "student_owned_hardware"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("resource_match_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String, nullable=False, index=True) # e.g. "ESP32", "Raspberry Pi 4", "Laptop"
    category = Column(String, default="Microcontroller") # Microcontroller, Single Board Computer, Sensor, Camera, Gateway, Laptop/PC
    quantity = Column(Integer, default=1)
    condition = Column(String, default="GOOD") # NEW, GOOD, FAIR
    ownership_status = Column(String, default="OWNED") # OWNED, BORROWED, LAB_AVAILABLE
    interfaces_json = Column(JSON, default=list) # ["Wi-Fi", "Bluetooth", "GPIO", "ADC", "I2C", "SPI"]
    specs_json = Column(JSON, default=dict) # {"clock_speed": "240MHz", "ram": "520KB", "flash": "4MB"}
    availability_status = Column(String, default="AVAILABLE") # AVAILABLE, IN_USE, NEEDS_SETUP
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("ResourceMatchProfile", back_populates="owned_hardware")


class StudentSkillItem(Base):
    """
    Student skill inventory and proficiency levels for resource fit calculations.
    """
    __tablename__ = "student_match_skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("resource_match_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    skill_name = Column(String, nullable=False, index=True) # Python, IoT, Embedded C, PyTorch
    proficiency_level = Column(String, default="INTERMEDIATE") # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    willing_to_learn = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("ResourceMatchProfile", back_populates="skills")


class ProjectResourceRequirement(Base):
    """
    Structured project requirements extracted from idea understanding or manually added.
    Distinguishes hard constraints from soft preferences.
    """
    __tablename__ = "project_resource_requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String, nullable=False, index=True) # e.g. "Water Quality Sensor", "Edge Classifier", "LoRa Transceiver"
    category = Column(String, nullable=False, index=True) # HARDWARE, SOFTWARE, AI_ML, CLOUD_COMPUTE, DATA, SERVICE, RESEARCH
    description = Column(Text, nullable=True)
    priority = Column(String, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    is_hard_constraint = Column(Boolean, default=True)
    status = Column(String, default="AI_INFERRED") # AI_INFERRED, USER_CONFIRMED, EDITED, REJECTED
    specs_json = Column(JSON, default=dict) # {"voltage": "3.3V", "interface": "Analog/I2C", "compute_target": "Microcontroller"}

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResourceMatchRecord(Base):
    """
    Evaluated match for a candidate resource against project constraints and requirements.
    Contains multi-dimensional scores, explainable rationales, and trade-offs.
    """
    __tablename__ = "resource_match_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="SET NULL"), nullable=True, index=True)
    requirement_id = Column(Integer, ForeignKey("project_resource_requirements.id", ondelete="SET NULL"), nullable=True, index=True)

    resource_name = Column(String, nullable=False, index=True)
    resource_category = Column(String, nullable=False, index=True) # HARDWARE, SOFTWARE, AI_ML, CLOUD_COMPUTE, DATA, SERVICE, RESEARCH
    match_category = Column(String, default="GOOD_MATCH", index=True) # BEST_MATCH, GOOD_MATCH, POSSIBLE_MATCH, CONDITIONAL_MATCH, NOT_RECOMMENDED, INSUFFICIENT_DATA

    # Multi-Dimensional Compatibility Scores (0.0 - 100.0)
    overall_match_score = Column(Float, default=85.0)
    project_relevance_score = Column(Float, default=90.0)
    budget_fit_score = Column(Float, default=90.0)
    hardware_fit_score = Column(Float, default=85.0)
    skill_fit_score = Column(Float, default=80.0)
    availability_score = Column(Float, default=85.0)
    compute_fit_score = Column(Float, default=85.0)
    open_source_score = Column(Float, default=100.0)

    # Cost & Pricing
    estimated_cost = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    cost_type = Column(String, default="ESTIMATE") # FREE, ONE_TIME, RECURRING, ESTIMATE, UNAVAILABLE
    price_evidence_status = Column(String, default="ESTIMATED") # SOURCE_VERIFIED, USER_PROVIDED, ESTIMATED, UNVERIFIED
    availability_status = Column(String, default="AVAILABILITY_UNKNOWN") # USER_OWNED, USER_BORROWED, INSTITUTION_AVAILABLE, ONLINE_AVAILABLE, PURCHASE_REQUIRED, AVAILABILITY_VERIFIED, AVAILABILITY_UNKNOWN, UNAVAILABLE

    # Explainability & Evidence
    why_matched_json = Column(JSON, default=list) # ["Fits within hardware budget", "Compatible with ESP32 GPIO/I2C"]
    tradeoffs_json = Column(JSON, default=list) # ["Lower precision than industrial grade sensor"]
    confidence = Column(String, default="HIGH") # HIGH, MEDIUM, LOW, UNKNOWN
    confidence_reason = Column(Text, nullable=True)
    is_shortlisted = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    resource = relationship("Resource")
    requirement = relationship("ProjectResourceRequirement")
    alternatives = relationship("ResourceAlternativeRecord", back_populates="match_record", cascade="all, delete-orphan")


class ResourceAlternativeRecord(Base):
    """
    Identified cheaper, open-source, or simpler alternatives for expensive or complex resources.
    """
    __tablename__ = "resource_alternative_records"

    id = Column(Integer, primary_key=True, index=True)
    match_record_id = Column(Integer, ForeignKey("resource_match_records.id", ondelete="CASCADE"), nullable=False, index=True)

    alternative_name = Column(String, nullable=False)
    alternative_category = Column(String, nullable=False)
    substitute_reason = Column(String, default="TOO_EXPENSIVE") # TOO_EXPENSIVE, UNAVAILABLE, INCOMPATIBLE, TOO_COMPLEX, OPEN_SOURCE_PREFERENCE
    estimated_cost = Column(Float, default=0.0)
    cost_savings = Column(Float, default=0.0)
    tradeoffs_json = Column(JSON, default=list)
    performance_comparison = Column(Text, nullable=True)
    compatibility_status = Column(String, default="COMPATIBLE") # COMPATIBLE, PARTIAL, WORKAROUND_REQUIRED

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    match_record = relationship("ResourceMatchRecord", back_populates="alternatives")


class ResourceBundleRecord(Base):
    """
    Curated resource bundles (Low Cost, Balanced, High Performance) tailored to project budget.
    """
    __tablename__ = "resource_bundle_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    bundle_type = Column(String, nullable=False) # LOW_COST, BALANCED, HIGH_PERFORMANCE
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    total_estimated_cost = Column(Float, default=0.0)
    monthly_recurring_cost = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    items_json = Column(JSON, default=list) # [{"name": "ESP32", "category": "Hardware", "cost": 700, "source": "Owned/Lab"}, ...]
    suitable_for_stage = Column(String, default="PROTOTYPING")
    tradeoff_summary = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class ProjectResourcePlanItem(Base):
    """
    Actionable project resource plan items connecting matched resources to
    Roadmap milestones, Experiments, Hardware Lab configurations, and Validation claims.
    """
    __tablename__ = "project_resource_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    resource_name = Column(String, nullable=False, index=True)
    resource_category = Column(String, nullable=False) # HARDWARE, SOFTWARE, AI_ML, CLOUD_COMPUTE, DATA, SERVICE, RESEARCH
    purpose = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, nullable=True)
    currency = Column(String, default="INR")
    source_name = Column(String, nullable=True) # e.g. "Maker Lab", "Hugging Face", "GitHub", "Local Vendor"
    source_url = Column(String, nullable=True)
    availability_status = Column(String, default="PURCHASE_REQUIRED") # USER_OWNED, USER_BORROWED, INSTITUTION_AVAILABLE, ONLINE_AVAILABLE, PURCHASE_REQUIRED, AVAILABILITY_VERIFIED, AVAILABILITY_UNKNOWN, UNAVAILABLE
    plan_status = Column(String, default="RECOMMENDED", index=True) # RECOMMENDED, SHORTLISTED, AVAILABLE, OWNED, BORROWED, PURCHASE_REQUIRED, UNAVAILABLE, REPLACED, IMPLEMENTED

    # Traceable Cross-System Integrations
    linked_roadmap_phase_id = Column(Integer, nullable=True)
    linked_experiment_id = Column(Integer, nullable=True)
    linked_hardware_device_id = Column(Integer, nullable=True)
    linked_validation_claim_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
