import re
from typing import Dict, Any, Tuple, Optional

class RankingService:
    """
    Computes intelligent multi-factor relevance scores and contextual explanations
    grounded in idea domain, target technologies, and problem formulation.
    """

    @staticmethod
    def calculate_score_and_explanation(
        resource: Dict[str, Any],
        idea_title: str,
        idea_domain: str,
        problem_desc: str,
        technologies_interested: list = None
    ) -> Tuple[int, str]:
        base_score = 65
        reasons = []

        res_title = resource.get("title", "").lower()
        res_desc = resource.get("description", "").lower()
        res_domain = resource.get("domain", "").lower()
        res_techs = [t.lower() for t in resource.get("technologies", [])]
        res_type = resource.get("resource_type", "")

        # 1. Domain Match
        if idea_domain and (idea_domain.lower() in res_domain or res_domain in idea_domain.lower()):
            base_score += 15
            reasons.append(f"Directly matches the target domain of {idea_domain}")

        # 2. Technology Intersection
        if technologies_interested:
            matched_techs = []
            for tech in technologies_interested:
                t_lower = tech.lower()
                if t_lower in res_title or t_lower in res_desc or any(t_lower in rt for rt in res_techs):
                    matched_techs.append(tech)
            if matched_techs:
                boost = min(15, len(matched_techs) * 6)
                base_score += boost
                reasons.append(f"Provides implementations & benchmarks using your desired stack: {', '.join(matched_techs)}")

        # 3. Problem Keywords Similarity
        problem_tokens = [w.lower() for w in re.findall(r'\b[A-Za-z]{4,}\b', problem_desc or idea_title)]
        matched_keywords = []
        for token in set(problem_tokens):
            if token in res_title or token in res_desc:
                matched_keywords.append(token)

        if matched_keywords:
            boost = min(12, len(matched_keywords) * 3)
            base_score += boost
            if len(matched_keywords) > 2:
                reasons.append(f"Directly addresses key challenges regarding {', '.join(matched_keywords[:3])}")

        # 4. Open Source & Quality Bonus
        if resource.get("is_open_source", False):
            base_score += 3
        if resource.get("is_free", False):
            base_score += 2

        # Clamp between 60% and 98%
        final_score = max(60, min(98, base_score))

        # Generate clear rationale
        if not reasons:
            explanation = f"This {res_type.replace('_', ' ')} offers foundational tools and standard algorithmic methods applicable to your architectural pipeline."
        else:
            explanation = f"Highly relevant because it {' and '.join(reasons)}."

        return final_score, explanation
