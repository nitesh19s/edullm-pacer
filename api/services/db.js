/**
 * SQLite Database Service
 *
 * Single source of truth for all persistent data:
 *   - vector collections & documents (with embeddings)
 *   - RAG chat sessions & messages
 *   - experiments & runs
 *
 * Uses better-sqlite3 (synchronous, zero-config, file-based).
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = path.resolve(
    process.env.DB_PATH || path.join(__dirname, '../../edullm.db')
);

// Ensure parent directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── schema ────────────────────────────────────────────────────────────────────

db.exec(`
    -- Vector collections
    CREATE TABLE IF NOT EXISTS collections (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL UNIQUE,
        description  TEXT,
        metadata     TEXT DEFAULT '{}',
        doc_count    INTEGER DEFAULT 0,
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL
    );

    -- Vector documents (embeddings stored as JSON-encoded float array)
    CREATE TABLE IF NOT EXISTS documents (
        id            TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        text          TEXT NOT NULL,
        embedding     TEXT,           -- JSON array of floats
        metadata      TEXT DEFAULT '{}',
        created_at    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection_id);

    -- RAG chat sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id             TEXT PRIMARY KEY,
        context        TEXT DEFAULT '{}',
        message_count  INTEGER DEFAULT 0,
        last_activity  TEXT,
        created_at     TEXT NOT NULL
    );

    -- RAG chat messages
    CREATE TABLE IF NOT EXISTS chat_messages (
        id                TEXT PRIMARY KEY,
        session_id        TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role              TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content           TEXT NOT NULL,
        retrieved_context TEXT DEFAULT '[]',
        metadata          TEXT DEFAULT '{}',
        created_at        TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);

    -- Experiments
    CREATE TABLE IF NOT EXISTS experiments (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT,
        status      TEXT DEFAULT 'pending',
        config      TEXT DEFAULT '{}',
        metrics     TEXT DEFAULT '{}',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
    );

    -- Experiment runs
    CREATE TABLE IF NOT EXISTS experiment_runs (
        id            TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        status        TEXT DEFAULT 'running',
        metrics       TEXT DEFAULT '{}',
        error         TEXT,
        started_at    TEXT NOT NULL,
        completed_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_runs_experiment ON experiment_runs(experiment_id);

    -- Research: per-student progression (one row per student)
    CREATE TABLE IF NOT EXISTS student_progression (
        student_id      TEXT PRIMARY KEY,
        interactions    TEXT DEFAULT '[]',   -- JSON array
        concept_mastery TEXT DEFAULT '{}',   -- JSON object
        metrics         TEXT DEFAULT '{}',   -- JSON object
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL
    );

    -- Research: gap analysis reports
    CREATE TABLE IF NOT EXISTS gap_analyses (
        id          TEXT PRIMARY KEY,
        student_id  TEXT NOT NULL,
        report      TEXT NOT NULL,           -- JSON object
        created_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_gaps_student ON gap_analyses(student_id);

    -- Research: cross-subject analysis reports
    CREATE TABLE IF NOT EXISTS cross_subject_analyses (
        id          TEXT PRIMARY KEY,
        student_id  TEXT NOT NULL,
        report      TEXT NOT NULL,           -- JSON object
        created_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cross_student ON cross_subject_analyses(student_id);
`);

// ── collections ───────────────────────────────────────────────────────────────

const collections = {
    all() {
        return db.prepare('SELECT * FROM collections ORDER BY created_at DESC').all()
            .map(parseRow);
    },

    get(id) {
        const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
        return row ? parseRow(row) : null;
    },

    getByName(name) {
        const row = db.prepare('SELECT * FROM collections WHERE name = ?').get(name);
        return row ? parseRow(row) : null;
    },

    create(col) {
        db.prepare(`
            INSERT INTO collections (id, name, description, metadata, doc_count, created_at, updated_at)
            VALUES (@id, @name, @description, @metadata, @doc_count, @created_at, @updated_at)
        `).run({
            id:          col.id,
            name:        col.name,
            description: col.description || null,
            metadata:    JSON.stringify(col.metadata || {}),
            doc_count:   col.documentCount || 0,
            created_at:  col.createdAt,
            updated_at:  col.updatedAt
        });
        return this.get(col.id);
    },

    incrementDocCount(id, delta = 1) {
        db.prepare(`
            UPDATE collections SET doc_count = doc_count + ?, updated_at = ?
            WHERE id = ?
        `).run(delta, new Date().toISOString(), id);
    },

    delete(id) {
        db.prepare('DELETE FROM collections WHERE id = ?').run(id);
    }
};

// ── documents ─────────────────────────────────────────────────────────────────

const documents = {
    add(doc) {
        db.prepare(`
            INSERT OR REPLACE INTO documents
                (id, collection_id, text, embedding, metadata, created_at)
            VALUES (@id, @collection_id, @text, @embedding, @metadata, @created_at)
        `).run({
            id:            doc.id,
            collection_id: doc.collectionId,
            text:          doc.text,
            embedding:     doc.embedding ? JSON.stringify(doc.embedding) : null,
            metadata:      JSON.stringify(doc.metadata || {}),
            created_at:    doc.createdAt || new Date().toISOString()
        });
    },

    addMany(docs) {
        const insert = db.prepare(`
            INSERT OR REPLACE INTO documents
                (id, collection_id, text, embedding, metadata, created_at)
            VALUES (@id, @collection_id, @text, @embedding, @metadata, @created_at)
        `);
        const insertMany = db.transaction(rows => {
            for (const row of rows) insert.run(row);
        });
        insertMany(docs.map(doc => ({
            id:            doc.id,
            collection_id: doc.collectionId,
            text:          doc.text,
            embedding:     doc.embedding ? JSON.stringify(doc.embedding) : null,
            metadata:      JSON.stringify(doc.metadata || {}),
            created_at:    doc.createdAt || new Date().toISOString()
        })));
    },

    byCollection(collectionId, limit = 50, offset = 0) {
        return db.prepare(`
            SELECT * FROM documents WHERE collection_id = ?
            ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(collectionId, limit, offset).map(parseDocRow);
    },

    allWithEmbeddings(collectionId = null) {
        const sql = collectionId
            ? 'SELECT * FROM documents WHERE collection_id = ? AND embedding IS NOT NULL'
            : 'SELECT * FROM documents WHERE embedding IS NOT NULL';
        const rows = collectionId
            ? db.prepare(sql).all(collectionId)
            : db.prepare(sql).all();
        return rows.map(parseDocRow);
    },

    get(id) {
        const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
        return row ? parseDocRow(row) : null;
    },

    count(collectionId) {
        return db.prepare('SELECT COUNT(*) as n FROM documents WHERE collection_id = ?')
            .get(collectionId).n;
    },

    deleteByCollection(collectionId) {
        db.prepare('DELETE FROM documents WHERE collection_id = ?').run(collectionId);
    }
};

// ── chat sessions ─────────────────────────────────────────────────────────────

const sessions = {
    all() {
        return db.prepare('SELECT * FROM chat_sessions ORDER BY created_at DESC').all()
            .map(parseRow);
    },

    get(id) {
        const row = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id);
        return row ? parseRow(row) : null;
    },

    create(session) {
        db.prepare(`
            INSERT INTO chat_sessions (id, context, message_count, last_activity, created_at)
            VALUES (@id, @context, @message_count, @last_activity, @created_at)
        `).run({
            id:            session.id,
            context:       JSON.stringify(session.context || {}),
            message_count: 0,
            last_activity: null,
            created_at:    session.createdAt
        });
        return this.get(session.id);
    },

    touch(id, delta = 2) {
        db.prepare(`
            UPDATE chat_sessions
            SET message_count = message_count + ?, last_activity = ?
            WHERE id = ?
        `).run(delta, new Date().toISOString(), id);
    },

    delete(id) {
        db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(id);
    }
};

// ── chat messages ─────────────────────────────────────────────────────────────

const messages = {
    add(msg) {
        db.prepare(`
            INSERT INTO chat_messages
                (id, session_id, role, content, retrieved_context, metadata, created_at)
            VALUES (@id, @session_id, @role, @content, @retrieved_context, @metadata, @created_at)
        `).run({
            id:                msg.id,
            session_id:        msg.sessionId,
            role:              msg.role,
            content:           msg.content,
            retrieved_context: JSON.stringify(msg.retrievedContext || []),
            metadata:          JSON.stringify(msg.metadata || {}),
            created_at:        msg.timestamp || new Date().toISOString()
        });
    },

    bySession(sessionId) {
        return db.prepare(`
            SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC
        `).all(sessionId).map(parseRow);
    },

    countTotal() {
        return db.prepare('SELECT COUNT(*) as n FROM chat_messages').get().n;
    }
};

// ── experiments ───────────────────────────────────────────────────────────────

const experiments = {
    all({ status, limit = 20, offset = 0 } = {}) {
        const sql = status
            ? 'SELECT * FROM experiments WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
            : 'SELECT * FROM experiments ORDER BY created_at DESC LIMIT ? OFFSET ?';
        const rows = status
            ? db.prepare(sql).all(status, limit, offset)
            : db.prepare(sql).all(limit, offset);
        return rows.map(parseRow);
    },

    count(status = null) {
        const sql = status
            ? 'SELECT COUNT(*) as n FROM experiments WHERE status = ?'
            : 'SELECT COUNT(*) as n FROM experiments';
        return (status ? db.prepare(sql).get(status) : db.prepare(sql).get()).n;
    },

    get(id) {
        const row = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id);
        return row ? parseRow(row) : null;
    },

    create(exp) {
        db.prepare(`
            INSERT INTO experiments (id, name, description, status, config, metrics, created_at, updated_at)
            VALUES (@id, @name, @description, @status, @config, @metrics, @created_at, @updated_at)
        `).run({
            id:          exp.id,
            name:        exp.name,
            description: exp.description || null,
            status:      exp.status || 'pending',
            config:      JSON.stringify(exp.config || {}),
            metrics:     JSON.stringify(exp.metrics || {}),
            created_at:  exp.createdAt,
            updated_at:  exp.updatedAt
        });
        return this.get(exp.id);
    },

    update(id, fields) {
        const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
        db.prepare(`UPDATE experiments SET ${sets}, updated_at = @updated_at WHERE id = @id`)
            .run({ ...fields, updated_at: new Date().toISOString(), id });
        return this.get(id);
    },

    delete(id) {
        db.prepare('DELETE FROM experiments WHERE id = ?').run(id);
    },

    // Runs
    addRun(run) {
        db.prepare(`
            INSERT INTO experiment_runs (id, experiment_id, status, metrics, error, started_at, completed_at)
            VALUES (@id, @experiment_id, @status, @metrics, @error, @started_at, @completed_at)
        `).run({
            id:            run.id,
            experiment_id: run.experimentId,
            status:        run.status || 'running',
            metrics:       JSON.stringify(run.metrics || {}),
            error:         run.error || null,
            started_at:    run.startedAt,
            completed_at:  run.completedAt || null
        });
        return this.getRun(run.id);
    },

    getRun(id) {
        const row = db.prepare('SELECT * FROM experiment_runs WHERE id = ?').get(id);
        return row ? parseRow(row) : null;
    },

    runsByExperiment(experimentId) {
        return db.prepare(
            'SELECT * FROM experiment_runs WHERE experiment_id = ? ORDER BY started_at DESC'
        ).all(experimentId).map(parseRow);
    },

    updateRun(id, fields) {
        const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
        db.prepare(`UPDATE experiment_runs SET ${sets} WHERE id = @id`)
            .run({ ...fields, id });
        return this.getRun(id);
    }
};

// ── row parsers ───────────────────────────────────────────────────────────────

function parseRow(row) {
    const result = { ...row };
    // Parse JSON fields
    for (const key of ['metadata', 'context', 'config', 'metrics', 'retrieved_context']) {
        if (typeof result[key] === 'string') {
            try { result[key] = JSON.parse(result[key]); } catch { /* leave as string */ }
        }
    }
    // Normalize snake_case → camelCase for common fields
    if ('doc_count'      in result) { result.documentCount  = result.doc_count;      delete result.doc_count; }
    if ('collection_id'  in result) { result.collectionId   = result.collection_id;  delete result.collection_id; }
    if ('session_id'     in result) { result.sessionId      = result.session_id;     delete result.session_id; }
    if ('experiment_id'  in result) { result.experimentId   = result.experiment_id;  delete result.experiment_id; }
    if ('message_count'  in result) { result.messageCount   = result.message_count;  delete result.message_count; }
    if ('last_activity'  in result) { result.lastActivity   = result.last_activity;  delete result.last_activity; }
    if ('created_at'     in result) { result.createdAt      = result.created_at;     delete result.created_at; }
    if ('updated_at'     in result) { result.updatedAt      = result.updated_at;     delete result.updated_at; }
    if ('started_at'     in result) { result.startedAt      = result.started_at;     delete result.started_at; }
    if ('completed_at'   in result) { result.completedAt    = result.completed_at;   delete result.completed_at; }
    if ('retrieved_context' in result) { result.retrievedContext = result.retrieved_context; delete result.retrieved_context; }
    return result;
}

function parseDocRow(row) {
    const result = parseRow(row);
    if (typeof result.embedding === 'string') {
        try { result.embedding = JSON.parse(result.embedding); } catch { result.embedding = null; }
    }
    return result;
}

// ── research ──────────────────────────────────────────────────────────────────

const research = {
    // ── progression ──────────────────────────────────────────────────────────

    getProgression(studentId) {
        const row = db.prepare('SELECT * FROM student_progression WHERE student_id = ?').get(studentId);
        if (!row) return null;
        return {
            studentId:      row.student_id,
            interactions:   JSON.parse(row.interactions),
            conceptMastery: JSON.parse(row.concept_mastery),
            metrics:        JSON.parse(row.metrics),
            createdAt:      row.created_at,
            updatedAt:      row.updated_at
        };
    },

    saveProgression(progression) {
        const exists = db.prepare('SELECT 1 FROM student_progression WHERE student_id = ?')
            .get(progression.studentId);
        if (exists) {
            db.prepare(`
                UPDATE student_progression
                SET interactions = ?, concept_mastery = ?, metrics = ?, updated_at = ?
                WHERE student_id = ?
            `).run(
                JSON.stringify(progression.interactions),
                JSON.stringify(progression.conceptMastery),
                JSON.stringify(progression.metrics),
                progression.updatedAt,
                progression.studentId
            );
        } else {
            db.prepare(`
                INSERT INTO student_progression
                    (student_id, interactions, concept_mastery, metrics, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                progression.studentId,
                JSON.stringify(progression.interactions),
                JSON.stringify(progression.conceptMastery),
                JSON.stringify(progression.metrics),
                progression.createdAt,
                progression.updatedAt
            );
        }
    },

    allStudents() {
        return db.prepare('SELECT student_id, metrics, concept_mastery, updated_at FROM student_progression')
            .all()
            .map(row => {
                const metrics  = JSON.parse(row.metrics);
                const mastery  = JSON.parse(row.concept_mastery);
                return {
                    studentId:        row.student_id,
                    totalInteractions: metrics.totalInteractions || 0,
                    successRate:      metrics.successRate || 0,
                    totalConcepts:    Object.keys(mastery).length,
                    lastActivity:     row.updated_at
                };
            });
    },

    // ── gap analyses ──────────────────────────────────────────────────────────

    saveGapAnalysis(id, studentId, report) {
        db.prepare(`
            INSERT INTO gap_analyses (id, student_id, report, created_at)
            VALUES (?, ?, ?, ?)
        `).run(id, studentId, JSON.stringify(report), new Date().toISOString());
    },

    getGapAnalyses(studentId) {
        return db.prepare(
            'SELECT * FROM gap_analyses WHERE student_id = ? ORDER BY created_at DESC'
        ).all(studentId).map(r => JSON.parse(r.report));
    },

    // ── cross-subject analyses ────────────────────────────────────────────────

    saveCrossSubjectAnalysis(id, studentId, report) {
        db.prepare(`
            INSERT INTO cross_subject_analyses (id, student_id, report, created_at)
            VALUES (?, ?, ?, ?)
        `).run(id, studentId, JSON.stringify(report), new Date().toISOString());
    },

    getCrossSubjectAnalyses(studentId) {
        return db.prepare(
            'SELECT * FROM cross_subject_analyses WHERE student_id = ? ORDER BY created_at DESC'
        ).all(studentId).map(r => JSON.parse(r.report));
    }
};

module.exports = { db, collections, documents, sessions, messages, experiments, research };
