"""Tests for the rule-based document-type classifier."""
from __future__ import annotations

import pytest

from edullm_pacer.classifier import RuleBasedClassifier
from edullm_pacer.schemas import Document, DocumentMetadata, DocumentType

clf = RuleBasedClassifier()

# ---------------------------------------------------------------------------
# Sample texts
# ---------------------------------------------------------------------------

PAST_PAPER_TEXT = """
CBSE Board Examination 2024
Subject: Mathematics  Class: X
Time Allowed: 3 Hours    Maximum Marks: 80

General Instructions:
Answer all questions in Section A.

Section A
Q.1  What is the HCF of 16 and 24?   (2 marks)
Q.2  Solve: 2x + 3 = 11               (2 marks)
Q.3  Find the roots of x²-5x+6=0.     (3 marks)
"""

LESSON_PLAN_TEXT = """
Lesson Plan — Grade 8 Science
Teacher: Ms. Priya Sharma
Duration: 45 minutes
Topic: Photosynthesis

Learning Objectives:
Students will be able to describe the process of photosynthesis.

Materials Needed: Chart paper, markers, textbook.

Prior Knowledge: Students are familiar with plant cells.

Teacher Activity: Explain light and dark reactions with diagram.
Student Activity: Fill in the flowchart.

Assessment Criteria: Exit-ticket quiz on the process steps.
"""

SYLLABUS_TEXT = """
NCERT Science Syllabus — Grade 9
Board: CBSE

Unit 1: Matter in Our Surroundings          Periods: 25
Unit 2: Is Matter Around Us Pure?           Periods: 18
Unit 3: Atoms and Molecules                 Periods: 25

Marks Distribution:
Theory Paper: 80  Internal Assessment: 20

Prescribed Books: NCERT Science Textbook Grade 9
Reference Books: S. Chand Science
"""

WORKED_EXAMPLE_TEXT = """
Example 3: A train travels 360 km in 4 hours.  Find its speed.

Given: Distance = 360 km, Time = 4 hours
Find: Speed

Solution:
Step 1: Use the formula Speed = Distance / Time
Step 2: Speed = 360 / 4
∴ Speed = 90 km/h

Answer: The speed of the train is 90 km/h.
"""

TEXTBOOK_CHAPTER_TEXT = """
Chapter 5: Gravitation

Introduction
In this chapter we study the force of attraction between masses.

Definition: The gravitational force between two bodies is directly proportional
to the product of their masses and inversely proportional to the square of the
distance between them.

Theorem: Newton's Law of Universal Gravitation
F = G × m₁ × m₂ / r²

Summary
- Gravity acts between all masses.
- g = 9.8 m/s² on Earth's surface.

Exercises
1. Calculate the force between two 10 kg masses 1 m apart.
"""

LECTURE_NOTES_TEXT = """
Lecture 3: Electrochemistry
Slide 1: Today's Agenda
  - Recap of last lecture
  - Galvanic cells
  - Nernst equation

Slide 2: Key Takeaway
• Reduction occurs at cathode
• Oxidation occurs at anode
• EMF depends on concentration

References: [1] Atkins Physical Chemistry, [2] NCERT Chemistry Part 1
"""


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_past_paper():
    assert clf.classify(PAST_PAPER_TEXT) == DocumentType.PAST_PAPER


def test_lesson_plan():
    assert clf.classify(LESSON_PLAN_TEXT) == DocumentType.LESSON_PLAN


def test_syllabus():
    assert clf.classify(SYLLABUS_TEXT) == DocumentType.SYLLABUS


def test_worked_example():
    assert clf.classify(WORKED_EXAMPLE_TEXT) == DocumentType.WORKED_EXAMPLE


def test_textbook_chapter():
    assert clf.classify(TEXTBOOK_CHAPTER_TEXT) == DocumentType.TEXTBOOK_CHAPTER


def test_lecture_notes():
    assert clf.classify(LECTURE_NOTES_TEXT) == DocumentType.LECTURE_NOTES


def test_empty_text_returns_unknown():
    assert clf.classify("") == DocumentType.UNKNOWN


def test_gibberish_returns_unknown():
    assert clf.classify("xyz abc 123 foo bar baz") == DocumentType.UNKNOWN


def test_metadata_hint_overrides_text():
    """When metadata already has a type, the classifier should honour it."""
    meta = DocumentMetadata(doc_type=DocumentType.SYLLABUS)
    # Even though the text looks like a past paper, metadata wins.
    result = clf.classify(PAST_PAPER_TEXT, metadata=meta)
    assert result == DocumentType.SYLLABUS


def test_classify_document_convenience():
    doc = Document(doc_id="d1", text=TEXTBOOK_CHAPTER_TEXT)
    assert clf.classify_document(doc) == DocumentType.TEXTBOOK_CHAPTER


def test_scores_returns_all_types():
    scores = clf.scores(TEXTBOOK_CHAPTER_TEXT)
    assert set(scores.keys()) == set(DocumentType) - {DocumentType.UNKNOWN}


def test_scores_textbook_highest_for_textbook():
    scores = clf.scores(TEXTBOOK_CHAPTER_TEXT)
    assert scores[DocumentType.TEXTBOOK_CHAPTER] == max(scores.values())
