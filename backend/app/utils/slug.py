"""
Utility for slug generation.
"""

from slugify import slugify

def generate_slug(text: str) -> str:
    """Generate a URL-safe lowercase slug from text."""
    return slugify(text)
