import re
from typing import List, Dict, Any, Optional, Set, Tuple
from urllib.parse import urlparse, urlunparse

class DeduplicationService:
    """
    Intelligent multi-source deduplication and entity resolution.
    Merges duplicate records from arXiv, OpenAlex, Semantic Scholar, Crossref,
    GitHub, and Hugging Face without losing source provenance.
    """

    @staticmethod
    def normalize_url(raw_url: str) -> str:
        """
        Normalizes URLs by lowercasing scheme/host, removing tracking parameters (utm_*, ref, etc.),
        and stripping trailing slashes.
        """
        if not raw_url:
            return ""
        try:
            parsed = urlparse(raw_url.strip())
            scheme = parsed.scheme.lower() or "https"
            netloc = parsed.netloc.lower()
            path = parsed.path.rstrip("/")
            if not path:
                path = "/"
            
            # Filter query params
            filtered_query = []
            if parsed.query:
                for pair in parsed.query.split("&"):
                    if "=" in pair:
                        k, v = pair.split("=", 1)
                        if not k.lower().startswith("utm_") and k.lower() not in ["ref", "fbclid", "gclid"]:
                            filtered_query.append(pair)
            
            clean_query = "&".join(filtered_query)
            return urlunparse((scheme, netloc, path, parsed.params, clean_query, ""))
        except Exception:
            return raw_url.strip().rstrip("/")

    @staticmethod
    def extract_doi(resource: Dict[str, Any]) -> Optional[str]:
        """Extracts and normalizes standard DOI if present in URL, metadata, or external_id."""
        url = resource.get("url", "")
        meta = resource.get("metadata_json", {}) or {}
        doi_val = meta.get("doi") or resource.get("doi") or ""

        if doi_val:
            return doi_val.strip().lower()

        # Search in URL (e.g. doi.org/10.1000/182)
        match = re.search(r'10\.\d{4,9}/[-._;()/:A-Za-z0-9]+', url)
        if match:
            return match.group(0).lower()
        return None

    @staticmethod
    def extract_arxiv_id(resource: Dict[str, Any]) -> Optional[str]:
        """Extracts standard arXiv identifier from URL or metadata."""
        url = resource.get("url", "")
        meta = resource.get("metadata_json", {}) or {}
        arxiv_val = meta.get("arxiv_id") or resource.get("external_id") or ""
        if arxiv_val and "arxiv" in str(arxiv_val).lower():
            return str(arxiv_val).lower()

        match = re.search(r'arxiv\.org/(?:abs|pdf)/([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)', url, re.IGNORECASE)
        if match:
            return match.group(1).lower()
        return None

    @staticmethod
    def extract_github_repo(resource: Dict[str, Any]) -> Optional[str]:
        """Extracts owner/repo format for GitHub projects."""
        url = resource.get("url", "")
        match = re.search(r'github\.com/([a-zA-Z0-9\-_]+/[a-zA-Z0-9\-_]+)', url, re.IGNORECASE)
        if match:
            return match.group(1).lower()
        return None

    @staticmethod
    def compute_title_similarity(title_a: str, title_b: str) -> float:
        """Computes character and token Jaccard similarity between two titles."""
        if not title_a or not title_b:
            return 0.0
        
        words_a = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', title_a.lower()))
        words_b = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', title_b.lower()))
        
        if not words_a or not words_b:
            return 0.0
            
        intersection = len(words_a.intersection(words_b))
        union = len(words_a.union(words_b))
        return intersection / union if union > 0 else 0.0

    def are_duplicates(self, res_a: Dict[str, Any], res_b: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Determines if two resource records represent the same underlying entity.
        Returns (is_duplicate, reason).
        """
        # 1. Exact normalized URL match
        url_a = self.normalize_url(res_a.get("url", ""))
        url_b = self.normalize_url(res_b.get("url", ""))
        if url_a and url_b and url_a == url_b:
            return True, "Identical canonical URL"

        # 2. DOI Match
        doi_a = self.extract_doi(res_a)
        doi_b = self.extract_doi(res_b)
        if doi_a and doi_b and doi_a == doi_b:
            return True, f"Matching DOI ({doi_a})"

        # 3. ArXiv ID Match
        arxiv_a = self.extract_arxiv_id(res_a)
        arxiv_b = self.extract_arxiv_id(res_b)
        if arxiv_a and arxiv_b and arxiv_a == arxiv_b:
            return True, f"Matching arXiv identifier ({arxiv_a})"

        # 4. GitHub repo identifier match
        gh_a = self.extract_github_repo(res_a)
        gh_b = self.extract_github_repo(res_b)
        if gh_a and gh_b and gh_a == gh_b:
            return True, f"Matching GitHub repository ({gh_a})"

        # 5. Very high title similarity (> 0.85) in same resource type
        type_a = res_a.get("resource_type", "")
        type_b = res_b.get("resource_type", "")
        if type_a and type_b and type_a == type_b:
            title_sim = self.compute_title_similarity(res_a.get("title", ""), res_b.get("title", ""))
            if title_sim >= 0.85:
                return True, f"High title similarity ({round(title_sim*100)}%)"

        return False, "Distinct resources"

    def deduplicate_and_merge(self, resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Deduplicates a list of multi-source resources, merging complementary metadata.
        """
        if not resources:
            return []

        merged_results: List[Dict[str, Any]] = []

        for item in resources:
            is_dup = False
            for existing in merged_results:
                matched, reason = self.are_duplicates(item, existing)
                if matched:
                    is_dup = True
                    # Merge complementary metadata
                    existing_meta = existing.setdefault("metadata_json", {})
                    new_meta = item.get("metadata_json", {}) or {}

                    # Merge citation count / stars to highest
                    if "citations" in new_meta:
                        curr_cit = existing_meta.get("citations", 0)
                        if isinstance(curr_cit, int) and isinstance(new_meta["citations"], int):
                            existing_meta["citations"] = max(curr_cit, new_meta["citations"])
                        elif curr_cit in [0, "", None]:
                            existing_meta["citations"] = new_meta["citations"]

                    if "stars" in new_meta:
                        curr_stars = existing_meta.get("stars", 0)
                        if isinstance(curr_stars, int) and isinstance(new_meta["stars"], int):
                            existing_meta["stars"] = max(curr_stars, new_meta["stars"])

                    # Merge authors
                    existing_authors = existing.get("authors", [])
                    for a in item.get("authors", []):
                        if a and a not in existing_authors:
                            existing_authors.append(a)
                    existing["authors"] = existing_authors

                    # Merge technologies
                    existing_techs = existing.get("technologies", [])
                    for t in item.get("technologies", []):
                        if t and t not in existing_techs:
                            existing_techs.append(t)
                    existing["technologies"] = existing_techs

                    # Add cross-source attribution
                    alt_sources = existing.setdefault("alternate_sources", [])
                    src = item.get("source", "")
                    if src and src != existing.get("source") and src not in alt_sources:
                        alt_sources.append(src)

                    break

            if not is_dup:
                # Ensure canonical URL
                item_copy = dict(item)
                item_copy["url"] = self.normalize_url(item_copy.get("url", ""))
                merged_results.append(item_copy)

        return merged_results

deduplication_service = DeduplicationService()
