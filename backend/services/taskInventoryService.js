/**
 * @file Task inventory helpers (materials stock deltas).
 */

import Material from "../models/Material.js";
import { MATERIAL_STATUS } from "../utils/constants.js";
import { ConflictError, ValidationError } from "../utils/errors.js";
import { normalizeId } from "../utils/helpers.js";

/**
 * Applies inventory deltas (materialId -> quantity delta) within a transaction.
 *
 * Positive delta consumes stock (decrements). Negative delta returns stock (increments).
 *
 * @param {{
 *   deltas: Map<string, number>;
 *   organizationId: string;
 *   departmentId: string;
 *   session: import("mongoose").ClientSession;
 *   requireActive?: boolean;
 * }} options - Inventory application options.
 * @returns {Promise<void>} Resolves when updates are applied.
 * @throws {ValidationError|ConflictError} Throws when materials are invalid, inactive (when consuming), or stock is insufficient.
 */
export const applyMaterialInventoryDeltas = async ({
  deltas,
  organizationId,
  departmentId,
  session,
  requireActive = true,
}) => {
  const entries = deltas instanceof Map ? Array.from(deltas.entries()) : [];
  if (entries.length === 0) {
    return;
  }

  const ids = entries
    .map(([id]) => normalizeId(id))
    .filter(Boolean);

  const materials = await Material.find({
    _id: { $in: ids },
    organization: organizationId,
    department: departmentId,
  })
    .withDeleted()
    .select("_id status inventory.stockOnHand isDeleted")
    .session(session);

  if (materials.length !== ids.length) {
    throw new ValidationError("materials contains invalid materials");
  }

  const byId = new Map(
    materials.map((material) => [normalizeId(material._id), material])
  );

  for (const [rawMaterialId, rawDelta] of entries) {
    const materialId = normalizeId(rawMaterialId);
    const record = byId.get(materialId);
    if (!record || record.isDeleted) {
      throw new ValidationError("materials contains invalid materials");
    }

    const delta = Number(rawDelta || 0);
    if (!Number.isFinite(delta) || delta === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (delta > 0) {
      if (requireActive && record.status !== MATERIAL_STATUS.ACTIVE) {
        throw new ConflictError(
          "Cannot use inactive materials. Set material status to ACTIVE first."
        );
      }

      const updated = await Material.findOneAndUpdate(
        {
          _id: record._id,
          organization: organizationId,
          department: departmentId,
          isDeleted: false,
          ...(requireActive ? { status: MATERIAL_STATUS.ACTIVE } : {}),
          "inventory.stockOnHand": { $gte: delta },
        },
        { $inc: { "inventory.stockOnHand": -delta } },
        { new: true, session }
      );

      if (!updated) {
        throw new ConflictError("Insufficient stock");
      }

      // eslint-disable-next-line no-continue
      continue;
    }

    await Material.findOneAndUpdate(
      {
        _id: record._id,
        organization: organizationId,
        department: departmentId,
        isDeleted: false,
      },
      { $inc: { "inventory.stockOnHand": Math.abs(delta) } },
      { session }
    );
  }
};

export default {
  applyMaterialInventoryDeltas,
};

