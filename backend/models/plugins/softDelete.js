/**
 * @file Reusable Mongoose soft-delete plugin.
 */
import mongoose from "mongoose";
import { SOFT_DELETE_QUERY_OPTIONS } from "../../utils/constants.js";

const readOperations = ["countDocuments", "find", "findOne", "findOneAndUpdate"];
const aggregateOptionKey = SOFT_DELETE_QUERY_OPTIONS.WITH_DELETED;

const hasIsDeletedFilter = (filter = {}) => {
  return Object.prototype.hasOwnProperty.call(filter, "isDeleted");
};

const hasIndex = (schema, fields) => {
  return schema.indexes().some(([indexFields]) => {
    return JSON.stringify(indexFields) === JSON.stringify(fields);
  });
};

const applyQueryScope = (query) => {
  const options = query.getOptions();
  const filter = query.getFilter();
  const withDeleted = Boolean(options?.[SOFT_DELETE_QUERY_OPTIONS.WITH_DELETED]);
  const onlyDeleted = Boolean(options?.[SOFT_DELETE_QUERY_OPTIONS.ONLY_DELETED]);

  if (onlyDeleted) {
    query.where({ isDeleted: true });
    return;
  }

  if (!withDeleted && !hasIsDeletedFilter(filter)) {
    query.where({ isDeleted: false });
  }
};

const getDocumentSession = (document) => {
  return typeof document?.$session === "function" ? document.$session() : null;
};

const applySessionToQuery = (query, session = null) => {
  if (session) {
    query.session(session);
  }

  return query;
};

/**
 * Adds canonical soft-delete fields, query helpers, and document/static helpers.
 *
 * @param {import("mongoose").Schema} schema - Target schema.
 * @param {{ deletedTtlSeconds?: number | null }} [options={}] - Plugin options.
 * @returns {void} Mutates schema in place.
 * @throws {TypeError} Throws when schema is not a valid Mongoose schema.
 */
const softDeletePlugin = (schema, options = {}) => {
  if (!(schema instanceof mongoose.Schema)) {
    throw new TypeError("softDeletePlugin requires a valid mongoose Schema instance");
  }

  if (!schema.path("isDeleted")) {
    schema.add({
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
      deletedAt: {
        type: Date,
        default: null,
      },
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    });
  }

  if (
    options.deletedTtlSeconds &&
    Number.isFinite(options.deletedTtlSeconds) &&
    options.deletedTtlSeconds > 0 &&
    !hasIndex(schema, { deletedAt: 1 })
  ) {
    schema.index(
      { deletedAt: 1 },
      {
        expireAfterSeconds: options.deletedTtlSeconds,
        partialFilterExpression: {
          isDeleted: true,
          deletedAt: { $type: "date" },
        },
      }
    );
  }

  /**
   * Includes deleted and non-deleted records in query results.
   *
   * @returns {import("mongoose").Query} Mongoose query instance.
   * @throws {never} This helper does not throw.
   */
  schema.query.withDeleted = function withDeleted() {
    this.setOptions({ [SOFT_DELETE_QUERY_OPTIONS.WITH_DELETED]: true });
    this.setOptions({ [SOFT_DELETE_QUERY_OPTIONS.ONLY_DELETED]: false });
    return this;
  };

  /**
   * Restricts query results to deleted records only.
   *
   * @returns {import("mongoose").Query} Mongoose query instance.
   * @throws {never} This helper does not throw.
   */
  schema.query.onlyDeleted = function onlyDeleted() {
    this.setOptions({ [SOFT_DELETE_QUERY_OPTIONS.WITH_DELETED]: true });
    this.setOptions({ [SOFT_DELETE_QUERY_OPTIONS.ONLY_DELETED]: true });
    return this;
  };

  for (const operation of readOperations) {
    schema.pre(operation, function softDeleteReadScope() {
      applyQueryScope(this);
    });
  }

  schema.pre("aggregate", function softDeleteAggregateScope() {
    const options = this.options || {};
    if (options[aggregateOptionKey]) {
      return;
    }

    const pipeline = this.pipeline();
    const hasExplicitDeleteFilter = pipeline.some((stage) => {
      return Boolean(stage?.$match && hasIsDeletedFilter(stage.$match));
    });

    if (!hasExplicitDeleteFilter) {
      pipeline.unshift({ $match: { isDeleted: false } });
    }
  });

  /**
   * Marks the current document as softly deleted.
   *
   * @param {mongoose.Types.ObjectId | string | null} [deletedBy=null] - Actor id.
   * @param {import("mongoose").ClientSession | null} [session=null] - Optional transaction session.
   * @returns {Promise<import("mongoose").Document>} Saved document.
   * @throws {Error} Throws when persistence fails.
   */
  schema.methods.softDelete = async function softDelete(deletedBy = null, session = null) {
    const activeSession = session || getDocumentSession(this);
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy || null;

    if (activeSession) {
      return this.save({ session: activeSession });
    }

    return this.save();
  };

  /**
   * Restores the current soft-deleted document.
   *
   * @param {import("mongoose").ClientSession | null} [session=null] - Optional transaction session.
   * @returns {Promise<import("mongoose").Document>} Saved document.
   * @throws {Error} Throws when persistence fails.
   */
  schema.methods.restore = async function restore(session = null) {
    const activeSession = session || getDocumentSession(this);
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;

    if (activeSession) {
      return this.save({ session: activeSession });
    }

    return this.save();
  };

  /**
   * Creates a query that includes soft-deleted documents.
   *
   * @param {Record<string, unknown>} [filter={}] - Query filter.
   * @param {Record<string, unknown> | null} [projection=null] - Projection document.
   * @param {{ session?: import("mongoose").ClientSession | null }} [options={}] - Query options.
   * @returns {import("mongoose").Query} Mongoose query instance.
   * @throws {never} This helper does not throw.
   */
  schema.statics.withDeleted = function withDeleted(filter = {}, projection = null, options = {}) {
    const query = this.find(filter, projection, options).withDeleted();
    return applySessionToQuery(query, options.session || null);
  };

  /**
   * Creates a query for deleted documents only.
   *
   * @param {Record<string, unknown>} [filter={}] - Query filter.
   * @param {Record<string, unknown> | null} [projection=null] - Projection document.
   * @param {{ session?: import("mongoose").ClientSession | null }} [options={}] - Query options.
   * @returns {import("mongoose").Query} Mongoose query instance.
   * @throws {never} This helper does not throw.
   */
  schema.statics.onlyDeleted = function onlyDeleted(filter = {}, projection = null, options = {}) {
    const query = this.find(filter, projection, options).onlyDeleted();
    return applySessionToQuery(query, options.session || null);
  };

  /**
   * Finds records including deleted documents (for pagination `customFind` support).
   *
   * @param {Record<string, unknown>} [filter={}] - Query filter.
   * @param {Record<string, unknown> | null} [projection=null] - Projection document.
   * @param {{ session?: import("mongoose").ClientSession | null }} [options={}] - Query options.
   * @returns {import("mongoose").Query} Mongoose query instance.
   * @throws {never} This helper does not throw.
   */
  schema.statics.findWithDeleted = function findWithDeleted(
    filter = {},
    projection = null,
    options = {}
  ) {
    const query = this.find(filter, projection, options).withDeleted();
    return applySessionToQuery(query, options.session || null);
  };

  /**
   * Finds only deleted records (for pagination `customFind` support).
   *
   * @param {Record<string, unknown>} [filter={}] - Query filter.
   * @param {Record<string, unknown> | null} [projection=null] - Projection document.
   * @param {{ session?: import("mongoose").ClientSession | null }} [options={}] - Query options.
   * @returns {import("mongoose").Query} Mongoose query instance.
   * @throws {never} This helper does not throw.
   */
  schema.statics.findOnlyDeleted = function findOnlyDeleted(
    filter = {},
    projection = null,
    options = {}
  ) {
    const query = this.find(filter, projection, options).onlyDeleted();
    return applySessionToQuery(query, options.session || null);
  };

  /**
   * Soft-deletes a document by id.
   *
   * @param {mongoose.Types.ObjectId | string} id - Target id.
   * @param {mongoose.Types.ObjectId | string | null} [deletedBy=null] - Actor id.
   * @param {import("mongoose").ClientSession | null} [session=null] - Optional transaction session.
   * @returns {Promise<import("mongoose").Document | null>} Updated document or null if missing.
   * @throws {Error} Throws when persistence fails.
   */
  schema.statics.softDeleteById = async function softDeleteById(
    id,
    deletedBy = null,
    session = null
  ) {
    const query = this.findById(id).withDeleted();
    applySessionToQuery(query, session);

    const doc = await query;
    if (!doc) {
      return null;
    }

    return doc.softDelete(deletedBy, session);
  };

  /**
   * Restores a document by id.
   *
   * @param {mongoose.Types.ObjectId | string} id - Target id.
   * @param {import("mongoose").ClientSession | null} [session=null] - Optional transaction session.
   * @returns {Promise<import("mongoose").Document | null>} Restored document or null if missing.
   * @throws {Error} Throws when persistence fails.
   */
  schema.statics.restoreById = async function restoreById(id, session = null) {
    const query = this.findById(id).withDeleted();
    applySessionToQuery(query, session);

    const doc = await query;
    if (!doc) {
      return null;
    }

    return doc.restore(session);
  };

  /**
   * Validates whether a document can be softly deleted.
   *
   * @param {import("mongoose").Document | null} _document - Target document.
   * @param {import("mongoose").ClientSession | null} [_session=null] - Optional transaction session.
   * @returns {Promise<boolean>} Always returns true in the base plugin.
   * @throws {never} This default implementation does not throw.
   */
  schema.statics.validateDeletion = async function validateDeletion(_document, _session = null) {
    return true;
  };

  /**
   * Validates whether a document can be restored.
   *
   * @param {import("mongoose").Document | null} _document - Target document.
   * @param {import("mongoose").ClientSession | null} [_session=null] - Optional transaction session.
   * @returns {Promise<boolean>} Always returns true in the base plugin.
   * @throws {never} This default implementation does not throw.
   */
  schema.statics.validateRestoration = async function validateRestoration(
    _document,
    _session = null
  ) {
    return true;
  };

  /**
   * Cascades soft delete from a root entity.
   *
   * @param {mongoose.Types.ObjectId | string} id - Root document id.
   * @param {mongoose.Types.ObjectId | string | null} [deletedBy=null] - Actor id.
   * @param {import("mongoose").ClientSession | null} [session=null] - Optional transaction session.
   * @param {Record<string, unknown>} [_options={}] - Cascade options.
   * @returns {Promise<import("mongoose").Document | null>} Soft-deleted root document.
   * @throws {Error} Throws when persistence fails.
   */
  schema.statics.cascadeDelete = async function cascadeDelete(
    id,
    deletedBy = null,
    session = null,
    _options = {}
  ) {
    return this.softDeleteById(id, deletedBy, session);
  };

  /**
   * Cascades restoration from a root entity.
   *
   * @param {mongoose.Types.ObjectId | string} id - Root document id.
   * @param {import("mongoose").ClientSession | null} [session=null] - Optional transaction session.
   * @param {Record<string, unknown>} [_options={}] - Cascade options.
   * @returns {Promise<import("mongoose").Document | null>} Restored root document.
   * @throws {Error} Throws when persistence fails.
   */
  schema.statics.cascadeRestore = async function cascadeRestore(
    id,
    session = null,
    _options = {}
  ) {
    return this.restoreById(id, session);
  };
};

export default softDeletePlugin;
