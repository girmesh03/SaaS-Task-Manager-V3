/**
 * @file Authorization helper utilities based on canonical matrix.
 */
import authorizationMatrix from "./authorizationMatrix.json";

const normalizeId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    const candidate = value?.id ?? value?._id ?? value?.value;
    if (
      candidate !== undefined &&
      candidate !== null &&
      (typeof candidate === "string" || typeof candidate === "number")
    ) {
      return String(candidate);
    }

    if (
      typeof value.toString === "function" &&
      value.toString !== Object.prototype.toString
    ) {
      return value.toString();
    }
  }

  return String(value);
};

const parseRequires = (rule, user) => {
  const requirements = rule.requires || [];

  return requirements.every((requirement) => {
    if (requirement.startsWith("!")) {
      const key = requirement.slice(1);
      return !user?.[key];
    }

    return !!user?.[requirement];
  });
};

const matchesScope = (rule, user, target) => {
  const scope = rule.scope;
  if (!scope || scope === "any") {
    return true;
  }

  const userOrg = normalizeId(user?.organization);
  const userDept = normalizeId(user?.department);
  const targetOrg = normalizeId(target?.organization);
  const targetDept = normalizeId(target?.department);

  const sameOrg = !targetOrg || userOrg === targetOrg;
  const sameDept = !targetDept || userDept === targetDept;

  if (scope === "crossOrg") {
    if (!user?.isPlatformOrgUser) {
      return false;
    }

    if (!targetOrg) {
      return true;
    }

    return userOrg !== targetOrg;
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

const hasArrayOwnership = (values, userId) => {
  if (!Array.isArray(values)) {
    return false;
  }

  return values.some((value) => normalizeId(value) === userId);
};

const matchesOwnership = (rule, user, target, params = {}) => {
  const ownership = rule.ownership || [];
  if (ownership.length === 0) {
    return true;
  }

  const userId = normalizeId(user?.id || user?._id);

  return ownership.some((owner) => {
    if (owner === "self") {
      const paramUserId = normalizeId(params.userId);
      if (paramUserId) {
        return paramUserId === userId;
      }

      return normalizeId(target?._id || target?.id) === userId;
    }

    if (owner === "manager") {
      return normalizeId(target?.manager) === userId;
    }

    if (["assignees", "watchers", "mentioned", "mentions"].includes(owner)) {
      return hasArrayOwnership(target?.[owner], userId);
    }

    return normalizeId(target?.[owner]) === userId;
  });
};

/**
 * Checks whether a user can perform an operation on a resource.
 *
 * @param {{
 *   id?: string;
 *   _id?: string;
 *   role?: string;
 *   organization?: string;
 *   department?: string;
 *   isPlatformOrgUser?: boolean;
 * }} user - Current user context.
 * @param {string} resource - Resource key in authorization matrix.
 * @param {string} operation - Operation key in authorization matrix.
 * @param {{
 *   target?: Record<string, unknown> | null;
 *   resourceType?: string | null;
 *   params?: Record<string, unknown>;
 * }} [options={}] - Authorization options.
 * @returns {boolean} True when any matrix rule passes.
 * @throws {never} This helper does not throw.
 */
export const hasPermission = (user, resource, operation, options = {}) => {
  if (!user?.role) {
    return false;
  }

  const rules = authorizationMatrix?.[resource]?.[operation] || [];
  if (rules.length === 0) {
    return false;
  }

  const target = options.target || null;
  const resourceType = options.resourceType || null;
  const params = options.params || {};

  const candidateRules = rules.filter((rule) => {
    const roleMatch = rule.roles?.includes(user.role);
    const requiresMatch = parseRequires(rule, user);
    const resourceTypeMatch = !rule.resourceType || rule.resourceType === resourceType;

    return roleMatch && requiresMatch && resourceTypeMatch;
  });

  return candidateRules.some((rule) => {
    return matchesScope(rule, user, target) && matchesOwnership(rule, user, target, params);
  });
};

export default hasPermission;
