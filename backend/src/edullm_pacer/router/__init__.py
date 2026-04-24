"""Strategy router subpackage.

Public API::

    from edullm_pacer.router import RuleBasedRouter, ROUTING_TABLE
    from edullm_pacer.classifier import RuleBasedClassifier

    router = RuleBasedRouter(classifier=RuleBasedClassifier())
    strategy = router.route(document)
"""
from edullm_pacer.router.base import BaseRouter
from edullm_pacer.router.rule_based import ROUTING_TABLE, RuleBasedRouter

__all__ = ["BaseRouter", "RuleBasedRouter", "ROUTING_TABLE"]
