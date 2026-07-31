/**
 * Shared in-memory vector store.
 * Both vector.js and rag.js import this so they work on the same data.
 * In the SQLite phase, this module is replaced with DB-backed equivalents.
 */

const collections = new Map(); // id → { id, name, description, metadata, documentCount, ... }
const documents   = new Map(); // id → { id, collectionId, text, embedding, metadata, ... }

module.exports = { collections, documents };
