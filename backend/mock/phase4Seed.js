/**
 * @file Phase 4 mock data seed (materials, vendors, tasks, activities, comments, files, notifications).
 */

import mongoose from "mongoose";
import {
  Attachment,
  AssignedTask,
  Material,
  Notification,
  ProjectTask,
  RoutineTask,
  TaskActivity,
  TaskComment,
  Vendor,
} from "../models/index.js";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  VENDOR_STATUS,
} from "../utils/constants.js";
import { normalizeEmailLocalPart, normalizeId } from "../utils/helpers.js";
import { applyMaterialInventoryDeltas } from "../services/taskInventoryService.js";

const CLOUDINARY_CLOUD_NAME = "taskmanager";
const CLOUDINARY_VERSION = "1700000000";

const buildCloudinaryUrl = ({ resourceType, path }) => {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/v${CLOUDINARY_VERSION}/${path}`;
};

const buildAttachmentPayload = ({ filename, fileType, path, fileSize }) => {
  const normalizedType = String(fileType || "").trim();
  const resourceType =
    normalizedType === "Video"
      ? "video"
      : normalizedType === "Image"
        ? "image"
        : "raw";

  return {
    filename,
    fileType: normalizedType,
    fileSize,
    fileUrl: buildCloudinaryUrl({ resourceType, path }),
  };
};

const uniqueIds = (values = []) => {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeId(value))
        .filter(Boolean)
    )
  );
};

const slugify = (value) => {
  return normalizeEmailLocalPart(String(value || "")).slice(0, 24) || "org";
};

const daysFromNow = (offsetDays) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + Number(offsetDays || 0));
  return date;
};

const pickUserByRole = (users = [], role) => {
  return (Array.isArray(users) ? users : []).find((user) => user?.role === role) || null;
};

const pickHod = (users = []) => {
  return (Array.isArray(users) ? users : []).find((user) => Boolean(user?.isHod)) || null;
};

const pickUsers = ({ users = [], count = 1, exclude = [] }) => {
  const excluded = new Set(uniqueIds(exclude));
  const pool = (Array.isArray(users) ? users : []).filter(
    (user) => user && !excluded.has(normalizeId(user._id))
  );

  const selected = [];
  for (const entry of pool) {
    selected.push(entry);
    if (selected.length >= count) {
      break;
    }
  }

  return selected;
};

const buildVendors = ({ organizationId, createdById }) => {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Abyssinia HVAC Services",
      email: "contact@abyssinia-hvac.com",
      phone: "+251911000001",
      website: "https://abyssinia-hvac.com",
      location: "Addis Ababa",
      address: "Bole, Addis Ababa",
      status: VENDOR_STATUS.ACTIVE,
      isVerifiedPartner: true,
      rating: 4.5,
      description: "Commercial HVAC maintenance and parts supplier.",
      organization: organizationId,
      createdBy: createdById,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Ethio Electric Supply Co.",
      email: "sales@ethio-electric.com",
      phone: "+251911000002",
      website: "https://ethio-electric.com",
      location: "Addis Ababa",
      address: "Megenagna, Addis Ababa",
      status: VENDOR_STATUS.ACTIVE,
      isVerifiedPartner: false,
      rating: 4,
      description: "Electrical components and safety devices supplier.",
      organization: organizationId,
      createdBy: createdById,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Blue Nile Plumbing Works",
      email: "support@bluenileplumbing.com",
      phone: "+251911000003",
      website: "https://bluenileplumbing.com",
      location: "Addis Ababa",
      address: "Kazanchis, Addis Ababa",
      status: VENDOR_STATUS.ACTIVE,
      isVerifiedPartner: true,
      rating: 4.5,
      description: "Hotel plumbing maintenance and emergency response.",
      organization: organizationId,
      createdBy: createdById,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "GreenClean Chemicals Ltd.",
      email: "hello@greencleanchemicals.com",
      phone: "+251911000004",
      website: "https://greencleanchemicals.com",
      location: "Addis Ababa",
      address: "Gerji, Addis Ababa",
      status: VENDOR_STATUS.ACTIVE,
      isVerifiedPartner: false,
      rating: 3.5,
      description: "Cleaning chemicals and consumables supplier.",
      organization: organizationId,
      createdBy: createdById,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Addis Safety Systems",
      email: "info@addissafety.com",
      phone: "+251911000005",
      website: "https://addissafety.com",
      location: "Addis Ababa",
      address: "CMC, Addis Ababa",
      status: VENDOR_STATUS.ACTIVE,
      isVerifiedPartner: true,
      rating: 4,
      description: "Fire and safety systems installation and inspection.",
      organization: organizationId,
      createdBy: createdById,
    },
  ];
};

const buildDepartmentMaterials = ({
  organizationId,
  departmentId,
  createdById,
  departmentName,
}) => {
  const departmentSlug = slugify(departmentName);

  const engineering = !String(departmentName || "").toLowerCase().includes("house");

  const templates = engineering
    ? [
        {
          name: "Circuit Breaker 32A",
          sku: `${departmentSlug.toUpperCase()}-CB-32A`,
          unit: "pcs",
          category: "Electrical",
          price: 450,
          stockOnHand: 120,
          lowStockThreshold: 20,
          reorderQuantity: 50,
          description: "32A MCB for distribution panels.",
        },
        {
          name: "Copper Wire 2.5mm",
          sku: `${departmentSlug.toUpperCase()}-CW-25`,
          unit: "meter",
          category: "Electrical",
          price: 35,
          stockOnHand: 500,
          lowStockThreshold: 100,
          reorderQuantity: 200,
          description: "2.5mm copper wire for general-purpose wiring.",
        },
        {
          name: "Silicone Sealant",
          sku: `${departmentSlug.toUpperCase()}-SEAL-01`,
          unit: "tube",
          category: "Hardware",
          price: 180,
          stockOnHand: 80,
          lowStockThreshold: 15,
          reorderQuantity: 40,
          description: "Weather-resistant silicone sealant for joints and leaks.",
        },
        {
          name: "HVAC Air Filter (MERV 13)",
          sku: `${departmentSlug.toUpperCase()}-FILTER-13`,
          unit: "pcs",
          category: "Mechanical",
          price: 320,
          stockOnHand: 60,
          lowStockThreshold: 10,
          reorderQuantity: 30,
          description: "Replacement filter for AHU units.",
        },
        {
          name: "PVC Pipe 20mm",
          sku: `${departmentSlug.toUpperCase()}-PVC-20`,
          unit: "meter",
          category: "Plumbing",
          price: 55,
          stockOnHand: 300,
          lowStockThreshold: 50,
          reorderQuantity: 120,
          description: "20mm PVC pipe used for cold water lines.",
        },
      ]
    : [
        {
          name: "Neutral Floor Cleaner",
          sku: `${departmentSlug.toUpperCase()}-CLEAN-FLR`,
          unit: "liter",
          category: "Cleaning",
          price: 140,
          stockOnHand: 200,
          lowStockThreshold: 30,
          reorderQuantity: 80,
          description: "pH-neutral floor cleaner for daily housekeeping.",
        },
        {
          name: "Disinfectant Concentrate",
          sku: `${departmentSlug.toUpperCase()}-DISINF-01`,
          unit: "liter",
          category: "Cleaning",
          price: 220,
          stockOnHand: 150,
          lowStockThreshold: 25,
          reorderQuantity: 60,
          description: "Concentrated disinfectant for high-touch areas.",
        },
        {
          name: "Microfiber Cloth",
          sku: `${departmentSlug.toUpperCase()}-MICRO-01`,
          unit: "pcs",
          category: "Textiles",
          price: 35,
          stockOnHand: 400,
          lowStockThreshold: 80,
          reorderQuantity: 200,
          description: "Reusable microfiber cloth for cleaning and polishing.",
        },
        {
          name: "Laundry Detergent",
          sku: `${departmentSlug.toUpperCase()}-DETER-01`,
          unit: "kg",
          category: "Consumables",
          price: 260,
          stockOnHand: 120,
          lowStockThreshold: 20,
          reorderQuantity: 60,
          description: "Commercial laundry detergent for linens and uniforms.",
        },
        {
          name: "Trash Bags (Large)",
          sku: `${departmentSlug.toUpperCase()}-TRASH-L`,
          unit: "pack",
          category: "Consumables",
          price: 95,
          stockOnHand: 250,
          lowStockThreshold: 40,
          reorderQuantity: 120,
          description: "Large trash bags for room and public area waste.",
        },
      ];

  return templates.map((entry) => ({
    _id: new mongoose.Types.ObjectId(),
    name: entry.name,
    sku: entry.sku,
    status: MATERIAL_STATUS.ACTIVE,
    description: entry.description,
    unit: entry.unit,
    category: MATERIAL_CATEGORIES.includes(entry.category) ? entry.category : "Other",
    price: entry.price,
    inventory: {
      stockOnHand: entry.stockOnHand,
      lowStockThreshold: entry.lowStockThreshold,
      reorderQuantity: entry.reorderQuantity,
      lastRestockedAt: daysFromNow(-2),
    },
    organization: organizationId,
    department: departmentId,
    createdBy: createdById,
  }));
};

const buildTaskTemplates = ({ departmentName, vendorIds, materialIds }) => {
  const engineering = !String(departmentName || "").toLowerCase().includes("house");

  if (engineering) {
    return {
      project: [
        {
          title: "Generator Preventive Maintenance (500hr)",
          description:
            "Perform a 500-hour preventive maintenance on the standby generator, including oil/filter replacement, cooling system checks, and load testing.",
          tags: ["maintenance", "generator", "safety"],
          priority: TASK_PRIORITY.HIGH,
          status: TASK_STATUS.IN_PROGRESS,
          vendor: vendorIds[0],
          startOffsetDays: -7,
          dueOffsetDays: 10,
        },
        {
          title: "Replace Faulty Breakers - Panel L2",
          description:
            "Replace identified faulty breakers in Panel L2 and verify protection coordination. Include insulation resistance test after replacement.",
          tags: ["electrical", "safety", "compliance"],
          priority: TASK_PRIORITY.URGENT,
          status: TASK_STATUS.PENDING,
          vendor: vendorIds[1],
          startOffsetDays: -3,
          dueOffsetDays: 5,
        },
        {
          title: "Chiller #2 Control Board Replacement",
          description:
            "Replace the control board for Chiller #2, validate sensor calibration, and confirm stable chilled-water supply to guest floors.",
          tags: ["hvac", "parts", "guest-comfort"],
          priority: TASK_PRIORITY.HIGH,
          status: TASK_STATUS.TODO,
          vendor: vendorIds[0],
          startOffsetDays: 0,
          dueOffsetDays: 14,
        },
      ],
      assigned: [
        {
          title: "Fix Water Leak - Room 512 Bathroom",
          description:
            "Investigate and fix reported water leak in Room 512 bathroom. Verify no further leakage and restore wall/ceiling finish if needed.",
          tags: ["plumbing", "guest-room"],
          priority: TASK_PRIORITY.HIGH,
          status: TASK_STATUS.IN_PROGRESS,
          startOffsetDays: -1,
          dueOffsetDays: 2,
        },
        {
          title: "Weekly Fire Alarm Panel Test",
          description:
            "Run the weekly fire alarm panel functional test, log results, and follow up on any active faults with corrective actions.",
          tags: ["safety", "fire"],
          priority: TASK_PRIORITY.MEDIUM,
          status: TASK_STATUS.TODO,
          startOffsetDays: 0,
          dueOffsetDays: 3,
        },
        {
          title: "Inspect Water Pump Pressure - Basement",
          description:
            "Inspect basement water pumps, confirm stable pressure, check for vibration/noise, and document readings in the engineering log.",
          tags: ["mechanical", "preventive"],
          priority: TASK_PRIORITY.LOW,
          status: TASK_STATUS.COMPLETED,
          startOffsetDays: -5,
          dueOffsetDays: -4,
        },
      ],
      routine: [
        {
          title: "Daily Electrical Room Walkthrough",
          description:
            "Perform daily walkthrough of electrical rooms (MDF/IDF and main panels) and document abnormal heat/noise or indicator alarms.",
          tags: ["electrical", "daily"],
          priority: TASK_PRIORITY.LOW,
          status: TASK_STATUS.TODO,
          dateOffsetDays: 0,
          materials: [
            { material: materialIds[0], quantity: 1 },
          ],
        },
        {
          title: "Daily Boiler Logbook Update",
          description:
            "Record boiler operating parameters (pressure, temperature, feedwater) and confirm safety interlocks are clear.",
          tags: ["boiler", "daily"],
          priority: TASK_PRIORITY.MEDIUM,
          status: TASK_STATUS.TODO,
          dateOffsetDays: 0,
          materials: [
            { material: materialIds[2], quantity: 1 },
          ],
        },
        {
          title: "Daily Water Pump Pressure Check",
          description:
            "Check water pump pressure readings and verify automatic switching between pumps. Escalate any pressure drop immediately.",
          tags: ["plumbing", "daily"],
          priority: TASK_PRIORITY.MEDIUM,
          status: TASK_STATUS.IN_PROGRESS,
          dateOffsetDays: -1,
          materials: [
            { material: materialIds[4], quantity: 2 },
          ],
        },
        {
          title: "Weekly Spare Parts Stock Count",
          description:
            "Perform weekly stock count for critical spare parts and update reorder needs for low-stock items.",
          tags: ["inventory", "weekly"],
          priority: TASK_PRIORITY.MEDIUM,
          status: TASK_STATUS.PENDING,
          dateOffsetDays: -3,
          materials: [
            { material: materialIds[1], quantity: 10 },
          ],
        },
      ],
    };
  }

  return {
    project: [
      {
        title: "Carpet Deep Cleaning - Executive Lounge",
        description:
          "Schedule and complete deep cleaning for Executive Lounge carpeted areas. Confirm stain removal and drying before reopening.",
        tags: ["cleaning", "guest-experience"],
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.IN_PROGRESS,
        vendor: vendorIds[3],
        startOffsetDays: -2,
        dueOffsetDays: 3,
      },
      {
        title: "Replace Worn Linen Sets - Floor 3",
        description:
          "Replace worn linen sets for Floor 3 rooms and archive removed items per housekeeping policy.",
        tags: ["linen", "rooms"],
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.TODO,
        vendor: vendorIds[3],
        startOffsetDays: 0,
        dueOffsetDays: 7,
      },
      {
        title: "Pest Control Treatment - Kitchen Area",
        description:
          "Coordinate pest control treatment for the kitchen area, ensure safety signage, and verify follow-up inspection report.",
        tags: ["hygiene", "safety", "kitchen"],
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.PENDING,
        vendor: vendorIds[4],
        startOffsetDays: -1,
        dueOffsetDays: 4,
      },
    ],
    assigned: [
      {
        title: "Restock Guest Amenities - Floor 5",
        description:
          "Restock guest amenities for Floor 5 rooms and verify checklist completion with room supervisors.",
        tags: ["amenities", "rooms"],
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.TODO,
        startOffsetDays: 0,
        dueOffsetDays: 2,
      },
      {
        title: "Prepare Ballroom for Event Setup",
        description:
          "Prepare ballroom for scheduled event. Ensure cleaning, chair/table setup readiness, and supply availability.",
        tags: ["event", "ballroom"],
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.IN_PROGRESS,
        startOffsetDays: -1,
        dueOffsetDays: 1,
      },
      {
        title: "Inspect Vacuums and Replace Bags",
        description:
          "Inspect housekeeping vacuum cleaners, replace dust bags/filters where required, and report broken units for repair.",
        tags: ["equipment", "preventive"],
        priority: TASK_PRIORITY.LOW,
        status: TASK_STATUS.COMPLETED,
        startOffsetDays: -4,
        dueOffsetDays: -3,
      },
    ],
    routine: [
      {
        title: "Daily Room Turnover Checklist - Floor 2",
        description:
          "Complete daily room turnover checklist for Floor 2 and confirm all rooms meet cleanliness and amenity standards.",
        tags: ["daily", "rooms"],
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.IN_PROGRESS,
        dateOffsetDays: 0,
        materials: [
          { material: materialIds[0], quantity: 3 },
          { material: materialIds[1], quantity: 2 },
        ],
      },
      {
        title: "Daily Laundry Lint Filter Cleaning",
        description:
          "Clean lint filters on laundry dryers and record completion in the laundry logbook.",
        tags: ["daily", "laundry"],
        priority: TASK_PRIORITY.LOW,
        status: TASK_STATUS.TODO,
        dateOffsetDays: 0,
        materials: [
          { material: materialIds[2], quantity: 5 },
        ],
      },
      {
        title: "Weekly Chemical Inventory Check",
        description:
          "Review chemical inventory levels and flag any low-stock items for replenishment.",
        tags: ["inventory", "weekly"],
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.PENDING,
        dateOffsetDays: -2,
        materials: [
          { material: materialIds[1], quantity: 1 },
          { material: materialIds[4], quantity: 10 },
        ],
      },
      {
        title: "Daily Public Restroom Sanitization",
        description:
          "Sanitize all public restrooms, restock supplies, and log completion for quality checks.",
        tags: ["sanitation", "daily"],
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.TODO,
        dateOffsetDays: -1,
        materials: [
          { material: materialIds[1], quantity: 2 },
          { material: materialIds[4], quantity: 8 },
        ],
      },
    ],
  };
};

const buildActivitiesForTask = ({
  task,
  organizationId,
  departmentId,
  users,
  materialIds,
}) => {
  const createdBy = normalizeId(task.createdBy);
  const manager = pickUserByRole(users, "Manager");
  const assistant = pickUsers({ users, count: 1, exclude: [createdBy] })[0];

  const activityAuthorId = normalizeId(manager?._id) || normalizeId(assistant?._id) || createdBy;
  const anotherAuthorId =
    normalizeId(assistant?._id) && normalizeId(assistant?._id) !== activityAuthorId
      ? normalizeId(assistant?._id)
      : createdBy;

  const activities = [];
  const attachments = [];
  const inventoryDeltas = new Map();

  const pushMaterials = (materials = []) => {
    for (const entry of materials) {
      const id = normalizeId(entry.material);
      const quantity = Number(entry.quantity || 0);
      if (!id || !Number.isFinite(quantity) || quantity <= 0) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const current = Number(inventoryDeltas.get(id) || 0);
      inventoryDeltas.set(id, current + quantity);
    }
  };

  const buildActivity = ({ authorId, activity, materials = [] }) => {
    const _id = new mongoose.Types.ObjectId();
    pushMaterials(materials);
    activities.push({
      _id,
      parent: task._id,
      parentModel: "Task",
      activity,
      materials,
      organization: organizationId,
      department: departmentId,
      createdBy: authorId,
    });
    return _id;
  };

  // "Task created" baseline entry (no materials, no attachments)
  buildActivity({
    authorId: createdBy,
    activity: "Task created",
    materials: [],
  });

  // No materials, no attachments
  buildActivity({
    authorId: activityAuthorId,
    activity: "Initial inspection completed. Parts and access requirements documented.",
    materials: [],
  });

  // Single material, no attachments
  buildActivity({
    authorId: anotherAuthorId,
    activity: "Replaced/used required consumable for the current step.",
    materials: materialIds[0]
      ? [{ material: materialIds[0], quantity: 2 }]
      : [],
  });

  // Attachments only (video)
  const attachmentsOnlyActivityId = buildActivity({
    authorId: activityAuthorId,
    activity: "Uploaded a short walkthrough video for reference.",
    materials: [],
  });
  attachments.push(
    {
      _id: new mongoose.Types.ObjectId(),
      ...buildAttachmentPayload({
        filename: "walkthrough.mp4",
        fileType: "Video",
        fileSize: 3_600_000,
        path: `tasks/${slugify(task.title)}/walkthrough.mp4`,
      }),
      parent: attachmentsOnlyActivityId,
      parentModel: "TaskActivity",
      organization: organizationId,
      department: departmentId,
      uploadedBy: activityAuthorId,
    },
  );

  // Both materials (multiple) and attachments
  const materialsAndAttachmentsActivityId = buildActivity({
    authorId: anotherAuthorId,
    activity: "Installed replacement parts and validated operation. Attached before/after photo.",
    materials: materialIds.length >= 3
      ? [
          { material: materialIds[1], quantity: 5 },
          { material: materialIds[2], quantity: 1 },
        ]
      : materialIds[0]
        ? [{ material: materialIds[0], quantity: 1 }]
        : [],
  });
  attachments.push(
    {
      _id: new mongoose.Types.ObjectId(),
      ...buildAttachmentPayload({
        filename: "before-after.jpg",
        fileType: "Image",
        fileSize: 420_000,
        path: `tasks/${slugify(task.title)}/before-after.jpg`,
      }),
      parent: materialsAndAttachmentsActivityId,
      parentModel: "TaskActivity",
      organization: organizationId,
      department: departmentId,
      uploadedBy: anotherAuthorId,
    },
  );

  return {
    activities,
    attachments,
    inventoryDeltas,
  };
};

const buildCommentsForTask = ({
  task,
  organizationId,
  departmentId,
  users,
  taskLevelActivityId,
}) => {
  const author = pickUsers({ users, count: 1, exclude: [task.createdBy] })[0] || users[0];
  const authorId = normalizeId(author?._id) || normalizeId(task.createdBy);

  const mentionTargets = pickUsers({ users, count: 2, exclude: [authorId] });
  const singleMention = mentionTargets[0] ? normalizeId(mentionTargets[0]._id) : null;
  const multiMentions = mentionTargets.map((user) => normalizeId(user?._id)).filter(Boolean);

  const commentDocs = [];
  const attachments = [];
  const notifications = [];

  const watchers = uniqueIds(task.watchers || []);
  const assignees = uniqueIds(task.assignees || []);
  const allRecipients = uniqueIds([...watchers, ...assignees]).filter(Boolean);

  const pushCommentNotifications = ({
    commentId,
    actorId,
    mentionIds = [],
  }) => {
    const actor = normalizeId(actorId);
    const baseRecipients = allRecipients.filter((id) => id && id !== actor);
    const mentionRecipients = uniqueIds(mentionIds).filter((id) => id && id !== actor);
    const genericRecipients = baseRecipients.filter(
      (id) => !mentionRecipients.includes(id)
    );

    for (const userId of mentionRecipients) {
      notifications.push({
        _id: new mongoose.Types.ObjectId(),
        title: "Mentioned in a comment",
        message: `You were mentioned in a comment on: ${task.title}.`,
        entity: commentId,
        entityModel: "TaskComment",
        organization: organizationId,
        department: departmentId,
        user: userId,
      });
    }

    for (const userId of genericRecipients) {
      notifications.push({
        _id: new mongoose.Types.ObjectId(),
        title: "New comment",
        message: `A new comment was added to: ${task.title}.`,
        entity: commentId,
        entityModel: "TaskComment",
        organization: organizationId,
        department: departmentId,
        user: userId,
      });
    }
  };

  const createComment = ({
    parentModel,
    parent,
    comment,
    createdBy,
    mentions = [],
    depth,
  }) => {
    const _id = new mongoose.Types.ObjectId();
    commentDocs.push({
      _id,
      parentModel,
      parent,
      comment,
      mentions,
      depth,
      organization: organizationId,
      department: departmentId,
      createdBy,
    });

    pushCommentNotifications({
      commentId: _id,
      actorId: createdBy,
      mentionIds: mentions,
    });

    return _id;
  };

  // Root comment: no mentions, no attachments
  const rootAId = createComment({
    parentModel: "Task",
    parent: task._id,
    comment: "Please confirm access windows and any guest-impact constraints before we proceed.",
    createdBy: authorId,
    mentions: [],
    depth: 0,
  });

  // Root comment: single mention
  const rootBId = createComment({
    parentModel: "Task",
    parent: task._id,
    comment: singleMention
      ? `@${mentionTargets[0].firstName} can you coordinate the next steps and confirm the schedule?`
      : "Can someone coordinate the next steps and confirm the schedule?",
    createdBy: authorId,
    mentions: singleMention ? [singleMention] : [],
    depth: 0,
  });

  // Root comment: multiple mentions + attachments
  const rootCId = createComment({
    parentModel: "Task",
    parent: task._id,
    comment:
      multiMentions.length > 0
        ? `@${mentionTargets[0].firstName} @${mentionTargets[1]?.firstName || mentionTargets[0].firstName} please review the attached evidence and confirm approval.`
        : "Please review the attached evidence and confirm approval.",
    createdBy: authorId,
    mentions: multiMentions,
    depth: 0,
  });

  attachments.push(
    {
      _id: new mongoose.Types.ObjectId(),
      ...buildAttachmentPayload({
        filename: "comment-evidence.mp4",
        fileType: "Video",
        fileSize: 2_800_000,
        path: `comments/${normalizeId(rootCId)}/evidence.mp4`,
      }),
      parent: rootCId,
      parentModel: "TaskComment",
      organization: organizationId,
      department: departmentId,
      uploadedBy: authorId,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      ...buildAttachmentPayload({
        filename: "inspection-notes.pdf",
        fileType: "Document",
        fileSize: 640_000,
        path: `comments/${normalizeId(rootCId)}/inspection-notes.pdf`,
      }),
      parent: rootCId,
      parentModel: "TaskComment",
      organization: organizationId,
      department: departmentId,
      uploadedBy: authorId,
    },
  );

  // Reply chain to depth 5 under rootA (thread depth coverage)
  let parentId = rootAId;
  for (let depth = 1; depth <= 5; depth += 1) {
    const replier = pickUsers({ users, count: 1, exclude: [authorId] })[0] || users[0];
    const replierId = normalizeId(replier?._id) || authorId;

    parentId = createComment({
      parentModel: "TaskComment",
      parent: parentId,
      comment:
        depth === 1
          ? "Confirmed. We'll do the work during the low-occupancy window."
          : depth === 2
            ? "Please ensure safety signage is placed before starting."
            : depth === 3
              ? "Noted. We'll bring the required PPE and lockout kit."
              : depth === 4
                ? "Share progress photos after the first checkpoint."
                : "Will do. Final verification will be logged once complete.",
      createdBy: replierId,
      mentions: [],
      depth,
    });
  }

  // Comment on an activity (parentModel TaskActivity) to validate polymorphic comment parents
  if (taskLevelActivityId) {
    createComment({
      parentModel: "TaskActivity",
      parent: taskLevelActivityId,
      comment: "This update looks good. Please keep the documentation attached for audit.",
      createdBy: authorId,
      mentions: [],
      depth: 0,
    });
  }

  return {
    comments: commentDocs,
    attachments,
    notifications,
  };
};

const buildTaskAttachmentsAndNotifications = ({
  task,
  organizationId,
  departmentId,
  uploaderId,
}) => {
  const attachments = [];
  const notifications = [];

  const watchers = uniqueIds(task.watchers || []);
  const assignees = uniqueIds(task.assignees || []);
  const recipients = uniqueIds([...watchers, ...assignees]).filter(
    (id) => id && id !== normalizeId(uploaderId),
  );

  const files = [
    buildAttachmentPayload({
      filename: "scope-of-work.pdf",
      fileType: "Document",
      fileSize: 820_000,
      path: `tasks/${slugify(task.title)}/scope-of-work.pdf`,
    }),
    buildAttachmentPayload({
      filename: "site-photo.jpg",
      fileType: "Image",
      fileSize: 380_000,
      path: `tasks/${slugify(task.title)}/site-photo.jpg`,
    }),
  ];

  for (const file of files) {
    const attachmentId = new mongoose.Types.ObjectId();
    attachments.push({
      _id: attachmentId,
      ...file,
      parent: task._id,
      parentModel: "Task",
      organization: organizationId,
      department: departmentId,
      uploadedBy: uploaderId,
    });

    for (const userId of recipients) {
      notifications.push({
        _id: new mongoose.Types.ObjectId(),
        title: "File uploaded",
        message: `${file.filename} was uploaded to: ${task.title}.`,
        entity: task._id,
        entityModel: "Task",
        organization: organizationId,
        department: departmentId,
        user: userId,
      });
    }
  }

  return {
    attachments,
    notifications,
  };
};

const buildTaskCreationNotifications = ({ task, organizationId, departmentId }) => {
  const actorId = normalizeId(task.createdBy);
  const recipients = uniqueIds([
    ...(Array.isArray(task.watchers) ? task.watchers : []),
    ...(Array.isArray(task.assignees) ? task.assignees : []),
  ]).filter((id) => id && id !== actorId);

  return recipients.map((userId) => ({
    _id: new mongoose.Types.ObjectId(),
    title: "Task created",
    message: `${task.title} was created.`,
    entity: task._id,
    entityModel: "Task",
    organization: organizationId,
    department: departmentId,
    user: userId,
  }));
};

const buildActivityNotifications = ({
  task,
  activityId,
  actorId,
  organizationId,
  departmentId,
}) => {
  const recipients = uniqueIds([
    ...(Array.isArray(task.watchers) ? task.watchers : []),
    ...(Array.isArray(task.assignees) ? task.assignees : []),
  ]).filter((id) => id && id !== normalizeId(actorId));

  return recipients.map((userId) => ({
    _id: new mongoose.Types.ObjectId(),
    title: "New activity",
    message: `A new activity was added to: ${task.title}.`,
    entity: activityId,
    entityModel: "TaskActivity",
    organization: organizationId,
    department: departmentId,
    user: userId,
  }));
};

const createTaskPayload = ({
  base,
  taskId,
  organizationId,
  departmentId,
  createdById,
  watchers,
  tags,
}) => {
  return {
    _id: taskId,
    title: base.title,
    description: base.description,
    status: base.status,
    priority: base.priority,
    tags,
    watchers,
    organization: organizationId,
    department: departmentId,
    createdBy: createdById,
  };
};

const buildDepartmentTasks = ({
  organization,
  department,
  users,
  vendors,
  materials,
}) => {
  const organizationId = normalizeId(organization?._id);
  const departmentId = normalizeId(department?._id);

  const hod = pickHod(users);
  const manager = pickUserByRole(users, "Manager");

  const vendorIds = vendors.map((vendor) => normalizeId(vendor._id));
  const materialIds = materials.map((material) => normalizeId(material._id));

  const templates = buildTaskTemplates({
    departmentName: department.name,
    vendorIds,
    materialIds,
  });

  const tasks = {
    project: [],
    assigned: [],
    routine: [],
  };

  const activities = [];
  const comments = [];
  const attachments = [];
  const notifications = [];
  const inventoryDeltas = new Map();

  const addInventoryDeltas = (deltas) => {
    if (!(deltas instanceof Map)) {
      return;
    }
    for (const [materialId, quantity] of deltas.entries()) {
      const id = normalizeId(materialId);
      const qty = Number(quantity || 0);
      if (!id || !Number.isFinite(qty) || qty <= 0) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const current = Number(inventoryDeltas.get(id) || 0);
      inventoryDeltas.set(id, current + qty);
    }
  };

  const usersInDept = Array.isArray(users) ? users : [];
  const createdByCycle = [
    normalizeId(hod?._id),
    normalizeId(manager?._id),
    ...usersInDept.map((user) => normalizeId(user?._id)),
  ].filter(Boolean);

  let createdByIndex = 0;
  const nextCreatedBy = () => {
    const id = createdByCycle[createdByIndex % createdByCycle.length];
    createdByIndex += 1;
    return id;
  };

  const buildWatchers = (createdById) => {
    const base = [
      createdById,
      normalizeId(hod?._id),
      normalizeId(manager?._id),
      normalizeId(pickUsers({ users: usersInDept, count: 1, exclude: [createdById] })[0]?._id),
    ].filter(Boolean);

    return uniqueIds(base);
  };

  const buildTags = (baseTags = []) => {
    return (Array.isArray(baseTags) ? baseTags : [])
      .map((tag) => String(tag || "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
  };

  const buildAssignees = ({ createdById }) => {
    const candidates = pickUsers({
      users: usersInDept,
      count: 2,
      exclude: [createdById, normalizeId(hod?._id), normalizeId(manager?._id)],
    });
    const ids = candidates.map((user) => normalizeId(user?._id)).filter(Boolean);
    return ids.length ? ids.slice(0, 2) : pickUsers({ users: usersInDept, count: 1, exclude: [createdById] }).map((user) => normalizeId(user?._id)).filter(Boolean);
  };

  // Project tasks (3)
  templates.project.forEach((entry) => {
    const taskId = new mongoose.Types.ObjectId();
    const createdById = nextCreatedBy();
    const watchers = buildWatchers(createdById);
    const tags = buildTags(entry.tags);

    const payload = createTaskPayload({
      base: entry,
      taskId,
      organizationId,
      departmentId,
      createdById,
      watchers,
      tags,
    });

    tasks.project.push({
      ...payload,
      vendor: entry.vendor,
      startDate: daysFromNow(entry.startOffsetDays),
      dueDate: daysFromNow(entry.dueOffsetDays),
    });

    notifications.push(...buildTaskCreationNotifications({ task: tasks.project.at(-1), organizationId, departmentId }));

    const fileArtifacts = buildTaskAttachmentsAndNotifications({
      task: tasks.project.at(-1),
      organizationId,
      departmentId,
      uploaderId: createdById,
    });
    attachments.push(...fileArtifacts.attachments);
    notifications.push(...fileArtifacts.notifications);

    const activityArtifacts = buildActivitiesForTask({
      task: tasks.project.at(-1),
      organizationId,
      departmentId,
      users: usersInDept,
      materialIds,
    });
    activities.push(...activityArtifacts.activities);
    attachments.push(...activityArtifacts.attachments);
    addInventoryDeltas(activityArtifacts.inventoryDeltas);

    // Activity notifications (exclude the "Task created" activity at index 0)
    activityArtifacts.activities.slice(1).forEach((activity) => {
      notifications.push(
        ...buildActivityNotifications({
          task: tasks.project.at(-1),
          activityId: activity._id,
          actorId: activity.createdBy,
          organizationId,
          departmentId,
        }),
      );
    });

    const lastActivity = activityArtifacts.activities.at(-1);
    const commentArtifacts = buildCommentsForTask({
      task: tasks.project.at(-1),
      organizationId,
      departmentId,
      users: usersInDept,
      taskLevelActivityId: lastActivity?._id || null,
    });
    comments.push(...commentArtifacts.comments);
    attachments.push(...commentArtifacts.attachments);
    notifications.push(...commentArtifacts.notifications);
  });

  // Assigned tasks (3)
  templates.assigned.forEach((entry) => {
    const taskId = new mongoose.Types.ObjectId();
    const createdById = nextCreatedBy();
    const watchers = buildWatchers(createdById);
    const tags = buildTags(entry.tags);
    const assignees = buildAssignees({ createdById });

    const payload = createTaskPayload({
      base: entry,
      taskId,
      organizationId,
      departmentId,
      createdById,
      watchers,
      tags,
    });

    tasks.assigned.push({
      ...payload,
      assignees,
      startDate: daysFromNow(entry.startOffsetDays),
      dueDate: daysFromNow(entry.dueOffsetDays),
    });

    notifications.push(...buildTaskCreationNotifications({ task: tasks.assigned.at(-1), organizationId, departmentId }));

    const fileArtifacts = buildTaskAttachmentsAndNotifications({
      task: tasks.assigned.at(-1),
      organizationId,
      departmentId,
      uploaderId: createdById,
    });
    attachments.push(...fileArtifacts.attachments);
    notifications.push(...fileArtifacts.notifications);

    const activityArtifacts = buildActivitiesForTask({
      task: tasks.assigned.at(-1),
      organizationId,
      departmentId,
      users: usersInDept,
      materialIds,
    });
    activities.push(...activityArtifacts.activities);
    attachments.push(...activityArtifacts.attachments);
    addInventoryDeltas(activityArtifacts.inventoryDeltas);

    activityArtifacts.activities.slice(1).forEach((activity) => {
      notifications.push(
        ...buildActivityNotifications({
          task: tasks.assigned.at(-1),
          activityId: activity._id,
          actorId: activity.createdBy,
          organizationId,
          departmentId,
        }),
      );
    });

    const lastActivity = activityArtifacts.activities.at(-1);
    const commentArtifacts = buildCommentsForTask({
      task: tasks.assigned.at(-1),
      organizationId,
      departmentId,
      users: usersInDept,
      taskLevelActivityId: lastActivity?._id || null,
    });
    comments.push(...commentArtifacts.comments);
    attachments.push(...commentArtifacts.attachments);
    notifications.push(...commentArtifacts.notifications);
  });

  // Routine tasks (4)
  templates.routine.forEach((entry) => {
    const taskId = new mongoose.Types.ObjectId();
    const createdById = nextCreatedBy();
    const watchers = buildWatchers(createdById);
    const tags = buildTags(entry.tags);

    const payload = createTaskPayload({
      base: entry,
      taskId,
      organizationId,
      departmentId,
      createdById,
      watchers,
      tags,
    });

    const routineMaterials = (Array.isArray(entry.materials) ? entry.materials : [])
      .map((row) => ({
        material: row.material,
        quantity: Number(row.quantity || 0),
      }))
      .filter((row) => normalizeId(row.material) && row.quantity > 0);

    for (const row of routineMaterials) {
      const id = normalizeId(row.material);
      const current = Number(inventoryDeltas.get(id) || 0);
      inventoryDeltas.set(id, current + Number(row.quantity || 0));
    }

    tasks.routine.push({
      ...payload,
      date: daysFromNow(entry.dateOffsetDays),
      materials: routineMaterials,
    });

    notifications.push(...buildTaskCreationNotifications({ task: tasks.routine.at(-1), organizationId, departmentId }));

    const fileArtifacts = buildTaskAttachmentsAndNotifications({
      task: tasks.routine.at(-1),
      organizationId,
      departmentId,
      uploaderId: createdById,
    });
    attachments.push(...fileArtifacts.attachments);
    notifications.push(...fileArtifacts.notifications);

    const commentArtifacts = buildCommentsForTask({
      task: tasks.routine.at(-1),
      organizationId,
      departmentId,
      users: usersInDept,
      taskLevelActivityId: null,
    });
    comments.push(...commentArtifacts.comments);
    attachments.push(...commentArtifacts.attachments);
    notifications.push(...commentArtifacts.notifications);
  });

  return {
    tasks,
    activities,
    comments,
    attachments,
    notifications,
    inventoryDeltas,
  };
};

/**
 * Seeds Phase 4 domain data for a single organization (non-platform).
 *
 * @param {{
 *   organization: import("mongoose").Document;
 *   departments: import("mongoose").Document[];
 *   users: import("mongoose").Document[];
 *   session: import("mongoose").ClientSession;
 * }} options - Seed inputs.
 * @returns {Promise<{ vendors: number; materials: number; tasks: number; activities: number; comments: number; attachments: number; notifications: number }>}
 */
export const seedPhaseFourForOrganization = async ({
  organization,
  departments,
  users,
  session,
}) => {
  const organizationId = normalizeId(organization?._id);

  const orgCreatedBy =
    normalizeId(pickHod(users)?._id) ||
    normalizeId(users?.[0]?._id) ||
    null;

  const vendorDocs = buildVendors({
    organizationId,
    createdById: orgCreatedBy,
  });

  await Vendor.insertMany(vendorDocs, { session });

  let materialCount = 0;
  let taskCount = 0;
  let activityCount = 0;
  let commentCount = 0;
  let attachmentCount = 0;
  let notificationCount = 0;

  for (const department of departments) {
    const departmentId = normalizeId(department?._id);
    const deptUsers = (Array.isArray(users) ? users : []).filter(
      (user) => normalizeId(user.department) === departmentId
    );

    const deptCreatedBy =
      normalizeId(pickHod(deptUsers)?._id) ||
      normalizeId(deptUsers?.[0]?._id) ||
      orgCreatedBy;

    const materials = buildDepartmentMaterials({
      organizationId,
      departmentId,
      createdById: deptCreatedBy,
      departmentName: department?.name || "Department",
    });

    await Material.insertMany(materials, { session });
    materialCount += materials.length;

    const deptSeed = buildDepartmentTasks({
      organization,
      department,
      users: deptUsers,
      vendors: vendorDocs,
      materials,
    });

    await applyMaterialInventoryDeltas({
      deltas: deptSeed.inventoryDeltas,
      organizationId,
      departmentId,
      session,
      requireActive: true,
    });

    await ProjectTask.insertMany(deptSeed.tasks.project, { session });
    await AssignedTask.insertMany(deptSeed.tasks.assigned, { session });
    await RoutineTask.insertMany(deptSeed.tasks.routine, { session });
    taskCount +=
      deptSeed.tasks.project.length +
      deptSeed.tasks.assigned.length +
      deptSeed.tasks.routine.length;

    await TaskActivity.insertMany(deptSeed.activities, { session });
    activityCount += deptSeed.activities.length;

    await TaskComment.insertMany(deptSeed.comments, { session });
    commentCount += deptSeed.comments.length;

    await Attachment.insertMany(deptSeed.attachments, { session });
    attachmentCount += deptSeed.attachments.length;

    await Notification.insertMany(deptSeed.notifications, { session });
    notificationCount += deptSeed.notifications.length;
  }

  return {
    vendors: vendorDocs.length,
    materials: materialCount,
    tasks: taskCount,
    activities: activityCount,
    comments: commentCount,
    attachments: attachmentCount,
    notifications: notificationCount,
  };
};

export default {
  seedPhaseFourForOrganization,
};
