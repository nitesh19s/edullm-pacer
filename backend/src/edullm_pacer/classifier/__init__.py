"""Document-type classifier subpackage.

Public API::

    from edullm_pacer.classifier import RuleBasedClassifier

    clf = RuleBasedClassifier()
    doc_type = clf.classify(text)
"""
from edullm_pacer.classifier.base import BaseClassifier
from edullm_pacer.classifier.rule_based import RuleBasedClassifier

__all__ = ["BaseClassifier", "RuleBasedClassifier"]
