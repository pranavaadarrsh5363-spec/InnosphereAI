import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.resource_matchmaker import (
    ResourceMatchProfile,
    ResourceMatchRecord,
    ProjectResourcePlanItem,
    StudentOwnedHardware,
)

logger = logging.getLogger("inno_sphere")


class ResourceCostService:
    """
    Budget allocation, cost tracking, currency management, and resource waste detection.
    """

    @classmethod
    def calculate_budget_summary(
        cls,
        profile: ResourceMatchProfile,
        plan_items: List[ProjectResourcePlanItem],
        match_records: List[ResourceMatchRecord],
    ) -> Dict[str, Any]:
        """
        Computes total, allocated, and remaining budget across categories.
        """
        total_budget = profile.total_budget or 10000.0
        currency = profile.currency or "INR"

        allocated_total = 0.0
        breakdown = {
            "HARDWARE": 0.0,
            "SOFTWARE": 0.0,
            "AI_ML": 0.0,
            "CLOUD_COMPUTE": 0.0,
            "DATA": 0.0,
            "SERVICE": 0.0,
            "RESEARCH": 0.0,
        }
        recurring_monthly = 0.0

        # Sum from active plan items
        if plan_items:
            for item in plan_items:
                cost = item.actual_cost if item.actual_cost is not None else item.estimated_cost
                cat = item.resource_category.upper()
                breakdown[cat] = breakdown.get(cat, 0.0) + cost
                allocated_total += cost
                if "monthly" in (item.purpose or "").lower() or "recurring" in (item.purpose or "").lower():
                    recurring_monthly += cost
        else:
            # Estimate from top recommended matches
            for m in match_records:
                if m.match_category in ["BEST_MATCH", "GOOD_MATCH"] and m.availability_status in ["PURCHASE_REQUIRED", "AVAILABILITY_UNKNOWN"]:
                    cat = m.resource_category.upper()
                    cost = m.estimated_cost or 0.0
                    breakdown[cat] = breakdown.get(cat, 0.0) + cost
                    allocated_total += cost
                    if m.cost_type == "RECURRING":
                        recurring_monthly += cost

        remaining = max(0.0, total_budget - allocated_total)
        utilization = round((allocated_total / total_budget) * 100, 1) if total_budget > 0 else 0.0

        potential_savings = 0.0
        for m in match_records:
            if m.alternatives:
                for alt in m.alternatives:
                    potential_savings += alt.cost_savings or 0.0

        return {
            "total_budget": total_budget,
            "allocated_budget": allocated_total,
            "remaining_budget": remaining,
            "currency": currency,
            "utilization_percentage": utilization,
            "breakdown_by_category": breakdown,
            "recurring_monthly_total": recurring_monthly,
            "potential_savings_via_alternatives": potential_savings,
        }

    @classmethod
    def detect_resource_waste(
        cls,
        owned_hardware: List[StudentOwnedHardware],
        match_records: List[ResourceMatchRecord],
        plan_items: List[ProjectResourcePlanItem],
    ) -> Tuple[List[str], List[str]]:
        """
        Detects potential resource waste and generates optimization insights.
        """
        waste_warnings: List[str] = []
        insights: List[str] = []

        owned_names = [h.name.lower() for h in owned_hardware]

        # 1. Duplicate Hardware Check
        has_esp32_owned = any("esp32" in name for name in owned_names)
        for m in match_records:
            if "esp32" in m.resource_name.lower() and m.availability_status == "PURCHASE_REQUIRED":
                if has_esp32_owned:
                    waste_warnings.append(
                        "Potential Duplicate Hardware: You already own an ESP32 board. Recommending using existing board rather than purchasing an extra unit."
                    )
            if "raspberry pi" in m.resource_name.lower() and has_esp32_owned:
                insights.append(
                    "Architecture Optimization: Your owned ESP32 is sufficient for the telemetry pipeline. A Raspberry Pi may be unnecessary for initial prototype milestones."
                )

        # 2. Overpowered GPU Compute Check
        for m in match_records:
            if "a100" in m.resource_name.lower() or "h100" in m.resource_name.lower():
                waste_warnings.append(
                    "Overpowered Compute: Commercial A100 GPU is disproportionate for lightweight sensor anomaly classification. Local CPU or Google Colab free tier is recommended."
                )

        # 3. Paid Software with Open-Source Alternatives
        for m in match_records:
            if m.estimated_cost > 1000.0 and m.resource_category in ["SOFTWARE", "AI_ML"] and m.open_source_score < 80.0:
                insights.append(
                    f"Cost Optimization: Consider open-source substitutes for {m.resource_name} to preserve project budget for essential physical sensors."
                )

        if not waste_warnings:
            waste_warnings.append("No critical resource waste detected. Resource allocations are optimized for student prototype scope.")

        if not insights:
            insights.append("Current resource configuration achieves high hardware and software efficiency.")

        return waste_warnings, insights
