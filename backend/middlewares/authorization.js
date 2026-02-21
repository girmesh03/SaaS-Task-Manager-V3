/**
 * @file Authorization middleware factory backed by the canonical matrix.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UnauthenticatedError, UnauthorizedError } from "../utils/errors.js";
import { normalizeId } from "../utils/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const matrixPath = path.resolve(__dirname, "../config/authorizationMatrix.json");
const authorizationMatrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));

const parseRequires = (rule, user) => {
  const requirements = rule.requires || [];

  return requirements.every((requirement) => {
    if (requirement.startsWith("!")) {
      const key = requirement.replace("!", "");
      return !Boolean(user[key]);
    }

    return Boolean(user[requirement]);
  });
};

const parseResourceType = (req, target, options) => {
  if (typeof options.getResourceType === "function") {
    return options.getResourceType(req, target);
  }

  return (
    req.validated?.body?.type ||
    req.validated?.body?.resourceType ||
    target?.type ||
    null
  );
};

const normalizeScope = (scope) => {
  if (!scope) {
    return null;
  }

  return String(scope);
};

const matchesScope = (rule, user, target) => {
  const scope = normalizeScope(rule.scope);
  if (!scope || scope === "any") {
    return true;
  }

  const userOrgId = normalizeId(user.organization);
  const userDeptId = normalizeId(user.department);
  const targetOrgId = normalizeId(target?.organization);
  const targetDeptId = normalizeId(target?.department);

  const sameOrg = !targetOrgId || userOrgId === targetOrgId;
  const sameDept = !targetDeptId || userDeptId === targetDeptId;

  if (scope === "crossOrg") {
    if (!user.isPlatformOrgUser) {
      return false;
    }

    if (!targetOrgId) {
      return true;
    }

    return targetOrgId !== userOrgId;
  }

  if (scope === "ownOrg") {
    return sameOrg;
  }

  if (scope === "ownOrg.crossDept") {
    return sameOrg;
  }

  if (scope === "ownOrg.ownDept") {
    return sameOrg && sameDept;
  }

  return false;
};

const checkArrayOwnership = (values, userId) => {
  if (!Array.isArray(values)) {
    return false;
  }

  return values.some((value) => normalizeId(value) === userId);
};

const checkOwnershipKey = (ownerKey, user, target, req) => {
  const userId = normalizeId(user.id);
  const params = req.validated?.params || {};
  const paramUserId = normalizeId(params.userId);

  if (ownerKey === "self") {
    if (paramUserId) {
      return paramUserId === userId;
    }

    return normalizeId(target?._id || target?.id) === userId;
  }

  if (ownerKey === "manager") {
    return normalizeId(target?.manager) === userId;
  }

  if (["assignees", "watchers", "mentioned", "mentions"].includes(ownerKey)) {
    return checkArrayOwnership(target?.[ownerKey], userId);
  }

  if (["createdBy", "uploadedBy"].includes(ownerKey)) {
    return normalizeId(target?.[ownerKey]) === userId;
  }

  return normalizeId(target?.[ownerKey]) === userId;
};

const matchesOwnership = (rule, user, target, req) => {
  const ownership = rule.ownership || [];
  if (ownership.length === 0) {
    return true;
  }

  return ownership.some((ownerKey) => checkOwnershipKey(ownerKey, user, target, req));
};

const getTargetResource = async (req, options) => {
  if (typeof options.getTarget === "function") {
    return options.getTarget(req);
  }

  return req.authorizationTarget || null;
};

/**
 * Builds an authorization middleware for a resource/operation pair.
 *
 * @param {string} resource - Canonical resource key.
 * @param {string} operation - Canonical operation key.
 * @param {{
 *   getResourceType?: (req: import("express").Request, target: unknown) => string | null;
 *   getTarget?: (req: import("express").Request) => Promise<unknown> | unknown;
 * }} [options={}] - Optional target/resource resolvers.
 * @returns {import("express").RequestHandler} Express middleware function.
 * @throws {never} Errors are forwarded to Express through `next`.
 */
export const authorize = (resource, operation, options = {}) => {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        throw new UnauthenticatedError();
      }

      const rules = authorizationMatrix?.[resource]?.[operation] || [];
      if (rules.length === 0) {
        throw new UnauthorizedError(
          `No authorization rules found for ${resource}.${operation}`
        );
      }

      const target = await getTargetResource(req, options);
      const resourceType = parseResourceType(req, target, options);

      const candidates = rules.filter((rule) => {
        const roleMatch = rule.roles?.includes(req.user.role);
        const resourceTypeMatch = !rule.resourceType || rule.resourceType === resourceType;
        const requiresMatch = parseRequires(rule, req.user);

        return roleMatch && resourceTypeMatch && requiresMatch;
      });

      const allowed = candidates.some((rule) => {
        return matchesScope(rule, req.user, target) && matchesOwnership(rule, req.user, target, req);
      });

      if (!allowed) {
        throw new UnauthorizedError();
      }

      req.authorization = {
        resource,
        operation,
        resourceType,
        rulesEvaluated: candidates.length,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorize;
