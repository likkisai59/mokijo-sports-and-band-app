"""
Pagination helper functions to ensure consistent paginated response formats.
"""

from typing import Any, Dict, List

def paginate_results(
    items: List[Any],
    total: int,
    page: int,
    page_size: int
) -> Dict[str, Any]:
    """
    Formulate a standard paginated response object.
    Matches Section 8.5 standard paginated response structures.
    """
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_prev": has_prev
    }
