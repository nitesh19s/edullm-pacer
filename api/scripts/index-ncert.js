#!/usr/bin/env node
/**
 * NCERT Q&A Indexer
 *
 * Reads ncert_qa_with_answers.json, generates embeddings via Ollama,
 * and stores everything in the shared vector store.
 *
 * Usage:
 *   node backend/scripts/index-ncert.js           # index all answered Q&A
 *   node backend/scripts/index-ncert.js --status  # show current index stats
 *   node backend/scripts/index-ncert.js --clear   # clear index and re-index
 */

require('dotenv').config({ path: `${__dirname}/../.env` });

const fs          = require('fs');
const path        = require('path');
const { v4: uuidv4 } = require('uuid');
const ollama      = require('../services/ollama');
const { collections: dbCollections, documents: dbDocuments } = require('../services/db');

const QA_FILE         = path.resolve(__dirname, '../../ncert_qa_with_answers.json');
const COLLECTION_NAME = 'ncert-qa';
const BATCH_SIZE      = 10;
const PROGRESS_FILE   = path.resolve(__dirname, '../.index-progress.json');

// ── helpers ───────────────────────────────────────────────────────────────────

function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
    return { indexedIds: [] };
}

function saveProgress(indexedIds) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ indexedIds }, null, 2));
}

function getOrCreateCollection() {
    const existing = dbCollections.getByName(COLLECTION_NAME);
    if (existing) return existing;
    const now = new Date().toISOString();
    return dbCollections.create({
        id:          uuidv4(),
        name:        COLLECTION_NAME,
        description: 'NCERT textbook Q&A pairs with AI-generated answers',
        metadata:    { source: 'ncert', version: '1.0' },
        createdAt:   now,
        updatedAt:   now
    });
}

function buildDocText(qa) {
    // Combine question + answer into a single searchable text
    return `Question: ${qa.input}\n\nAnswer: ${qa.output}`;
}

function buildDocId(qa, idx) {
    // Stable ID based on source file + question number
    return `ncert-${qa.metadata.source_file}-q${qa.metadata.question_number || idx}`;
}

// ── status ────────────────────────────────────────────────────────────────────

function showStatus() {
    const cols  = dbCollections.all();
    const ncert = dbCollections.getByName(COLLECTION_NAME);
    const total = cols.reduce((s, c) => s + (c.documentCount || 0), 0);

    console.log('\n📊 Vector Store Status');
    console.log('='.repeat(50));
    console.log(`Collections : ${cols.length}`);
    console.log(`Total docs  : ${total}`);
    console.log(`NCERT docs  : ${ncert?.documentCount || 0}`);

    if (ncert) {
        const docs = dbDocuments.byCollection(ncert.id, 10000);
        const subjects = {};
        for (const d of docs) {
            const s = d.metadata?.subject || 'unknown';
            subjects[s] = (subjects[s] || 0) + 1;
        }
        if (Object.keys(subjects).length) {
            console.log('\nBy Subject:');
            for (const [s, n] of Object.entries(subjects)) {
                console.log(`  ${s.padEnd(22)}: ${n}`);
            }
        }
    }
    console.log();
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
    const args = process.argv.slice(2);

    if (args.includes('--status')) {
        showStatus();
        return;
    }

    const clearFirst = args.includes('--clear');

    // Check Ollama
    const available = await ollama.isAvailable();
    if (!available) {
        console.error('❌ Ollama is not available at', process.env.OLLAMA_URL || 'http://localhost:11434');
        process.exit(1);
    }
    console.log(`✅ Ollama connected | embed model: ${ollama.OLLAMA_EMBED_MODEL}`);

    // Load Q&A data
    if (!fs.existsSync(QA_FILE)) {
        console.error('❌ Q&A file not found:', QA_FILE);
        process.exit(1);
    }
    const allQA = JSON.parse(fs.readFileSync(QA_FILE, 'utf8'));
    const answered = allQA.filter(q => q.output && q.output.length > 20);
    console.log(`📚 ${allQA.length} total Q&A | ${answered.length} with answers`);

    // Collection
    if (clearFirst) {
        const existing = dbCollections.getByName(COLLECTION_NAME);
        if (existing) {
            dbDocuments.deleteByCollection(existing.id);
            dbCollections.delete(existing.id);
        }
        if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
        console.log('🗑️  Cleared existing index');
    }

    const collection = getOrCreateCollection();
    console.log(`📁 Collection: "${COLLECTION_NAME}" (id: ${collection.id})\n`);

    // Resume support — check both progress file AND existing DB docs
    const progress    = loadProgress();
    const existingIds = new Set(dbDocuments.byCollection(collection.id, 100000).map(d => d.id));
    const indexed     = new Set([...progress.indexedIds, ...existingIds]);
    const toIndex     = answered.filter((_, i) => !indexed.has(buildDocId(answered[i], i)));

    console.log(`Already indexed : ${indexed.size}`);
    console.log(`To index now    : ${toIndex.length}`);
    if (toIndex.length === 0) {
        console.log('✅ Nothing to do.');
        showStatus();
        return;
    }
    console.log(`\n🚀 Starting... (${BATCH_SIZE} docs per progress update)\n`);

    let done = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < toIndex.length; i++) {
        const qa    = toIndex[i];
        const docId = buildDocId(qa, i);
        const text  = buildDocText(qa);

        try {
            const embedding = await ollama.generateEmbedding(text);

            const doc = {
                id:           docId,
                collectionId: collection.id,
                text,
                embedding,
                metadata: {
                    subject:  qa.metadata.subject,
                    grade:    qa.metadata.grade,
                    chapter:  qa.metadata.chapter,
                    topic:    qa.metadata.topic || '',
                    source:   qa.metadata.source_file,
                    question: qa.input,
                    difficulty: qa.metadata.difficulty || 'medium'
                },
                createdAt: new Date().toISOString()
            };

            dbDocuments.add(doc);
            dbCollections.incrementDocCount(collection.id, 1);

            indexed.add(docId);
            done++;

            if (done % BATCH_SIZE === 0) {
                saveProgress([...indexed]);
                const elapsed  = (Date.now() - startTime) / 1000;
                const rate     = done / elapsed;
                const remaining = toIndex.length - done;
                const eta      = remaining / rate;
                console.log(
                    `[${done}/${toIndex.length}] ` +
                    `${((done / toIndex.length) * 100).toFixed(1)}% | ` +
                    `${rate.toFixed(1)} docs/s | ` +
                    `ETA: ${Math.round(eta)}s`
                );
            }
        } catch (err) {
            failed++;
            console.warn(`  ⚠️  Failed to embed doc ${docId}: ${err.message}`);
        }
    }

    // Final save
    saveProgress([...indexed]);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Indexed ${done} documents in ${totalTime}s (${failed} failed)`);
    showStatus();
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
