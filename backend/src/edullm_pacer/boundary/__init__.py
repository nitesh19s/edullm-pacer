"""Pedagogical boundary subpackage.

Public API::

    from edullm_pacer.boundary import BoundaryPostProcessor
    from edullm_pacer.boundary.detector import detect_boundary_violations, ends_mid_unit

    processor = BoundaryPostProcessor(merge=True)
    chunks = processor.process(chunks)
"""
from edullm_pacer.boundary.detector import detect_boundary_violations, ends_mid_unit
from edullm_pacer.boundary.post_processor import BoundaryPostProcessor

__all__ = ["BoundaryPostProcessor", "detect_boundary_violations", "ends_mid_unit"]
