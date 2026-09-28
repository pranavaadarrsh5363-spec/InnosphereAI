from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class InnovationClaim(Base):
    __tablename__ = "project_innovation_claims"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String, nullable=False) # e.g. "Sub-30ms Real-Time Edge Anomaly Detection"
    claim = Column(Text, nullable=False) # Detailed scientific claim
    category = Column(String, nullable=False, default="Performance") # Technical, Performance, Cost, Accessibility, Sustainability, Usability, Scalability, Accuracy, Speed, Resource Efficiency, Hardware, Research Novelty
    description = Column(Text, default="")
    
    existing_solution = Column(Text, default="")
    proposed_solution = Column(Text, default="")
    expected_advantage = Column(Text, default="")
    
    validation_question = Column(Text, nullable=False) # e.g. "Does the proposed model achieve <30ms latency on ESP32 without degrading F1?"
    evidence_requirement = Column(Text, default="") # e.g. "Empirical latency profile on ESP32 microcontroller with 10-fold cross validation"
    
    # Statuses: VALIDATED, PARTIALLY_VALIDATED, INCONCLUSIVE, NOT_VALIDATED, NOT_TESTED
    status = Column(String, default="NOT_TESTED", index=True)
    confidence_indicator = Column(String, default="PRELIMINARY") # HIGH, MEDIUM, LOW, PRELIMINARY
    
    # Validation Types: SIMULATED, DIGITAL_TESTBED, PHYSICAL_HARDWARE, SOFTWARE_PROTOTYPE, FIELD_TEST, USER_STUDY, LITERATURE_SUPPORTED
    validation_type = Column(String, default="SIMULATED")
    
    linked_experiment_id = Column(Integer, ForeignKey("project_experiments.id", ondelete="SET NULL"), nullable=True, index=True)
    linked_benchmark_id = Column(Integer, ForeignKey("benchmark_references.id", ondelete="SET NULL"), nullable=True, index=True)
    
    observed_result = Column(Text, default="")
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="innovation_claims")
    experiment = relationship("Experiment", foreign_keys=[linked_experiment_id])
    benchmark = relationship("BenchmarkReference", foreign_keys=[linked_benchmark_id])
    evidence_items = relationship("ValidationEvidence", back_populates="claim", cascade="all, delete-orphan")
    gaps = relationship("ValidationGap", back_populates="claim", cascade="all, delete-orphan")


class ValidationEvidence(Base):
    __tablename__ = "project_validation_evidence"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_id = Column(Integer, ForeignKey("project_innovation_claims.id", ondelete="CASCADE"), nullable=True, index=True)
    
    evidence_type = Column(String, nullable=False, default="experiment_run") # experiment_run, benchmark_comparison, hardware_telemetry, published_paper, user_feedback, cost_audit, code_artifact
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    source_uri = Column(String, default="")
    source_reference_id = Column(String, default="")
    
    verification_status = Column(String, default="VERIFIED") # VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED
    validation_type = Column(String, default="SIMULATED") # SIMULATED, DIGITAL_TESTBED, PHYSICAL_HARDWARE, SOFTWARE_PROTOTYPE, FIELD_TEST, USER_STUDY, LITERATURE_SUPPORTED
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    claim = relationship("InnovationClaim", back_populates="evidence_items")


class ValidationGap(Base):
    __tablename__ = "project_validation_gaps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_id = Column(Integer, ForeignKey("project_innovation_claims.id", ondelete="SET NULL"), nullable=True, index=True)
    
    gap_title = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    required_evidence = Column(Text, nullable=False)
    severity = Column(String, default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW
    suggested_action = Column(Text, default="")
    linked_experiment_id = Column(Integer, nullable=True)
    is_resolved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    claim = relationship("InnovationClaim", back_populates="gaps")


class CompetitionChecklistItem(Base):
    __tablename__ = "project_competition_checklists"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String, nullable=False, default="Problem") # Problem, Innovation, Technology, Evidence, Impact, Demonstration, Research, Presentation
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(String, default="MISSING") # READY, PARTIAL, MISSING
    is_custom = Column(Boolean, default=False)
    evidence_link = Column(String, nullable=True)
    order_idx = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class ProjectCostItem(Base):
    __tablename__ = "project_cost_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String, nullable=False, default="Hardware") # Hardware, Software, Infrastructure, Maintenance
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float, default=0.0)
    is_recurring = Column(Boolean, default=False)
    recurring_period = Column(String, default="monthly") # monthly, yearly, one_time
    is_estimated = Column(Boolean, default=True)
    source_or_vendor = Column(String, default="")
    currency = Column(String, default="INR")
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)


class StakeholderReview(Base):
    __tablename__ = "project_stakeholder_reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    reviewer_name = Column(String, nullable=False)
    reviewer_role = Column(String, nullable=False, default="mentor") # mentor, faculty, target_user, industry_expert, student_peer
    review_date = Column(DateTime, default=datetime.utcnow)
    
    problem_clarity_score = Column(Float, nullable=True)
    solution_feasibility_score = Column(Float, nullable=True)
    innovation_score = Column(Float, nullable=True)
    usability_score = Column(Float, nullable=True)
    
    feedback_text = Column(Text, nullable=False)
    recommendations = Column(JSON, default=list)
    evidence_attachment_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
