/**
 * Research Features API Routes
 * Backed by SQLite via services/db.js
 */

const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { v4: uuidv4 }  = require('uuid');
const { APIError }    = require('../middleware/errorHandler');
const { research }    = require('../services/db');

// ── validation ────────────────────────────────────────────────────────────────

const interactionSchema = Joi.object({
    studentId:    Joi.string().default('default_student'),
    conceptId:    Joi.string().required(),
    conceptName:  Joi.string().required(),
    subject:      Joi.string().required(),
    grade:        Joi.number().integer().min(1).max(12),
    difficulty:   Joi.number().min(1).max(10),
    success:      Joi.boolean().required(),
    responseTime: Joi.number().min(0),
    confidence:   Joi.number().min(0).max(1),
    context:      Joi.object()
});

// ── progression ───────────────────────────────────────────────────────────────

router.get('/progression/:studentId', (req, res, next) => {
    const data = research.getProgression(req.params.studentId);
    if (!data) return next(new APIError('Progression data not found', 404));
    res.json({ success: true, data });
});

router.post('/progression/track', (req, res, next) => {
    const { error, value } = interactionSchema.validate(req.body);
    if (error) return next(new APIError('Validation failed', 400, error.details));

    const { studentId } = value;
    const now = new Date().toISOString();

    let progression = research.getProgression(studentId) || {
        studentId,
        interactions:   [],
        conceptMastery: {},
        metrics: { totalInteractions: 0, successRate: 0, currentLevel: 0, learningVelocity: 0 },
        createdAt: now,
        updatedAt: now
    };

    const interaction = { ...value, timestamp: now };
    progression.interactions.push(interaction);

    // Update concept mastery
    const { conceptId, conceptName, success } = value;
    if (!progression.conceptMastery[conceptId]) {
        progression.conceptMastery[conceptId] = {
            conceptId, conceptName, attempts: 0, successes: 0, masteryLevel: 0, lastSeen: Date.now()
        };
    }
    const concept = progression.conceptMastery[conceptId];
    concept.attempts++;
    if (success) concept.successes++;
    concept.masteryLevel = (concept.successes / concept.attempts) * 100;
    concept.lastSeen     = Date.now();

    // Update metrics
    const total   = progression.interactions.length;
    const successes = progression.interactions.filter(i => i.success).length;
    progression.metrics.totalInteractions = total;
    progression.metrics.successRate       = (successes / total) * 100;
    progression.updatedAt                 = now;

    research.saveProgression(progression);

    res.status(201).json({
        success: true,
        data: { interaction, updatedMastery: concept, metrics: progression.metrics },
        message: 'Interaction tracked successfully'
    });
});

router.get('/progression/:studentId/analytics', (req, res, next) => {
    const progression = research.getProgression(req.params.studentId);
    if (!progression) return next(new APIError('Progression data not found', 404));

    const concepts  = Object.values(progression.conceptMastery);
    res.json({
        success: true,
        data: {
            studentId: progression.studentId,
            mastery: {
                mastered:   concepts.filter(c => c.masteryLevel >= 80),
                learning:   concepts.filter(c => c.masteryLevel >= 40 && c.masteryLevel < 80),
                struggling: concepts.filter(c => c.masteryLevel < 40)
            },
            metrics:       progression.metrics,
            learningPath:  progression.interactions.slice(-20),
            totalConcepts: concepts.length
        }
    });
});

// ── gap analysis ──────────────────────────────────────────────────────────────

router.post('/gaps/analyze', (req, res, next) => {
    const { studentId, targetGrade, targetSubject } = req.body;
    if (!studentId) return next(new APIError('studentId is required', 400));

    const progression = research.getProgression(studentId);
    if (!progression) return next(new APIError('No progression data for student', 404));

    const concepts = Object.values(progression.conceptMastery);
    const gaps     = concepts.filter(c => c.masteryLevel < 60);

    const report = {
        studentId, targetGrade, targetSubject,
        timestamp: new Date().toISOString(),
        coverage: {
            total:      concepts.length,
            covered:    concepts.filter(c => c.masteryLevel > 0).length,
            mastered:   concepts.filter(c => c.masteryLevel >= 80).length,
            notCovered: 0
        },
        gaps: {
            concepts: gaps.map(g => ({
                conceptId:      g.conceptId,
                conceptName:    g.conceptName,
                currentMastery: g.masteryLevel,
                severity:       100 - g.masteryLevel,
                attempts:       g.attempts
            })),
            total: gaps.length
        },
        recommendations: gaps.slice(0, 5).map(g => ({
            conceptId:   g.conceptId,
            conceptName: g.conceptName,
            priority:    100 - g.masteryLevel,
            reason:      `Current mastery: ${g.masteryLevel.toFixed(1)}%`
        }))
    };

    research.saveGapAnalysis(uuidv4(), studentId, report);
    res.json({ success: true, data: report });
});

router.get('/gaps/:studentId', (req, res) => {
    res.json({ success: true, data: research.getGapAnalyses(req.params.studentId) });
});

// ── cross-subject ─────────────────────────────────────────────────────────────

router.post('/cross-subject/analyze', (req, res, next) => {
    const { studentId } = req.body;
    if (!studentId) return next(new APIError('studentId is required', 400));

    const progression = research.getProgression(studentId);
    if (!progression) return next(new APIError('No progression data for student', 404));

    const bySubject = {};
    progression.interactions.forEach(i => {
        const s = i.subject || 'Unknown';
        if (!bySubject[s]) bySubject[s] = [];
        bySubject[s].push(i);
    });

    const subjectPerformance = {};
    Object.keys(bySubject).forEach(subject => {
        const ints      = bySubject[subject];
        const successes = ints.filter(i => i.success).length;
        const concepts  = Object.values(progression.conceptMastery)
            .filter(c => ints.some(i => i.conceptId === c.conceptId));

        subjectPerformance[subject] = {
            subject,
            totalInteractions: ints.length,
            successRate:       successes / ints.length,
            averageMastery:    concepts.length > 0
                ? concepts.reduce((s, c) => s + c.masteryLevel, 0) / concepts.length : 0,
            totalConcepts:     concepts.length,
            masteredConcepts:  concepts.filter(c => c.masteryLevel >= 80).length,
            learningConcepts:  concepts.filter(c => c.masteryLevel >= 40 && c.masteryLevel < 80).length,
            strugglingConcepts: concepts.filter(c => c.masteryLevel < 40).length
        };
    });

    const analysis = {
        studentId,
        timestamp: new Date().toISOString(),
        subjectPerformance,
        patterns: {
            strengths:  Object.values(subjectPerformance).filter(s => s.averageMastery >= 70).map(s => s.subject),
            weaknesses: Object.values(subjectPerformance).filter(s => s.averageMastery < 50).map(s => s.subject)
        },
        totalSubjects: Object.keys(subjectPerformance).length
    };

    research.saveCrossSubjectAnalysis(uuidv4(), studentId, analysis);
    res.json({ success: true, data: analysis });
});

router.get('/cross-subject/:studentId', (req, res) => {
    res.json({ success: true, data: research.getCrossSubjectAnalyses(req.params.studentId) });
});

// ── students ──────────────────────────────────────────────────────────────────

router.get('/students', (req, res) => {
    res.json({ success: true, data: research.allStudents() });
});

module.exports = router;
