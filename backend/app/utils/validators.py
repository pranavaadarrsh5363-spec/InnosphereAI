import re
import ipaddress
import urllib.parse
from typing import Optional

# Disallowed internal & link-local networks
DISALLOWED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"), # Cloud metadata
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def is_safe_external_url(url: Optional[str]) -> bool:
    """
    Validates that a URL is safe to query externally.
    Blocks SSRF attempts to localhost, private IP subnets, and cloud metadata endpoints.
    """
    if not url or not isinstance(url, str):
        return False

    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        return False

    try:
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False

        # Disallow localhost hostnames
        if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "instance-data", "metadata.google.internal"):
            return False

        # Check if hostname is an IP address
        try:
            ip = ipaddress.ip_address(hostname)
            for net in DISALLOWED_NETWORKS:
                if ip in net:
                    return False
        except ValueError:
            # Not an IP literal, domain name is acceptable
            pass

        return True
    except Exception:
        return False

def sanitize_text(text: Optional[str], max_length: int = 5000) -> str:
    """
    Sanitizes arbitrary user text: strips null bytes, non-printable control chars, and caps length.
    """
    if not text:
        return ""
    # Strip null bytes and control characters except common whitespace
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', str(text))
    cleaned = cleaned.strip()
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned

def wrap_untrusted_prompt_data(label: str, content: str) -> str:
    """
    Wraps untrusted student / external research content in explicit XML boundary tags
    to resist prompt injection and clarify context to LLM models.
    """
    sanitized = sanitize_text(content, max_length=10000)
    # Neutralize closing boundary tags
    safe_content = sanitized.replace(f"</{label}>", f"<\_/{label}>")
    return f"<{label}>\n{safe_content}\n</{label}>"
