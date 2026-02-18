/**
 * @file User model.
 */
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  BCRYPT_SALT_ROUNDS,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_USER_SECURITY,
  EMAIL_REGEX,
  EMPLOYEE_ID_REGEX,
  PERSON_NAME_REGEX,
  PHONE_REGEX,
  PREFERENCE_DATE_FORMATS,
  PREFERENCE_THEME_MODES,
  PREFERENCE_TIME_FORMATS,
  SOFT_DELETE_TTL_SECONDS,
  USER_ROLES,
  USER_STATUS,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const skillSchema = new Schema(
  {
    skill: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_LIMITS.USER.SKILL_NAME_MAX,
        "Skill name cannot exceed 50 characters",
      ],
    },
    percentage: {
      type: Number,
      min: [
        VALIDATION_LIMITS.USER.SKILL_PERCENTAGE_MIN,
        "Skill percentage cannot be below 0",
      ],
      max: [
        VALIDATION_LIMITS.USER.SKILL_PERCENTAGE_MAX,
        "Skill percentage cannot exceed 100",
      ],
    },
  },
  { _id: false }
);

const profilePictureSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_LIMITS.USER.PROFILE_PICTURE_PUBLIC_ID_MAX,
        "Profile picture public id cannot exceed 255 characters",
      ],
    },
  },
  { _id: false }
);

const userPreferencesSchema = new Schema(
  {
    notifications: {
      browserEnabled: { type: Boolean, default: false },
      emailEnabled: { type: Boolean, default: true },
      inAppEnabled: { type: Boolean, default: true },
      emailEvents: {
        task: { type: Boolean, default: true },
        activity: { type: Boolean, default: true },
        comment: { type: Boolean, default: true },
        mention: { type: Boolean, default: true },
        user: { type: Boolean, default: true },
        material: { type: Boolean, default: true },
        vendor: { type: Boolean, default: true },
      },
      inAppEvents: {
        task: { type: Boolean, default: true },
        activity: { type: Boolean, default: true },
        comment: { type: Boolean, default: true },
        mention: { type: Boolean, default: true },
        user: { type: Boolean, default: true },
        material: { type: Boolean, default: true },
        vendor: { type: Boolean, default: true },
      },
    },
    appearance: {
      themeMode: {
        type: String,
        enum: {
          values: PREFERENCE_THEME_MODES,
          message: "Theme mode is invalid",
        },
        default: "SYSTEM",
      },
      language: {
        type: String,
        trim: true,
        default: "en",
      },
      dateFormat: {
        type: String,
        enum: {
          values: PREFERENCE_DATE_FORMATS,
          message: "Date format is invalid",
        },
        default: "MDY",
      },
      timeFormat: {
        type: String,
        enum: {
          values: PREFERENCE_TIME_FORMATS,
          message: "Time format is invalid",
        },
        default: "12H",
      },
      timezone: {
        type: String,
        trim: true,
        default: "UTC",
      },
    },
  },
  { _id: false }
);

const userSecuritySchema = new Schema(
  {
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const isPastOrPresent = (value) => {
  if (!value) {
    return true;
  }

  return value.getTime() <= Date.now();
};

const buildNextEmployeeId = async (doc, session = null) => {
  if (!doc.organization) {
    return null;
  }

  const countQuery = doc.constructor
    .countDocuments({ organization: doc.organization })
    .withDeleted();

  if (session) {
    countQuery.session(session);
  }

  const total = await countQuery;
  const next = String(total + 1).padStart(VALIDATION_LIMITS.USER.EMPLOYEE_ID_LENGTH, "0");
  if (next === "0000") {
    return "0001";
  }

  return next;
};

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minlength: [
        VALIDATION_LIMITS.USER.FIRST_NAME_MIN,
        "First name must be at least 2 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.USER.FIRST_NAME_MAX,
        "First name cannot exceed 50 characters",
      ],
      trim: true,
      match: [PERSON_NAME_REGEX, "First name format is invalid"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      minlength: [
        VALIDATION_LIMITS.USER.LAST_NAME_MIN,
        "Last name must be at least 2 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.USER.LAST_NAME_MAX,
        "Last name cannot exceed 50 characters",
      ],
      trim: true,
      match: [PERSON_NAME_REGEX, "Last name format is invalid"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      minlength: [
        VALIDATION_LIMITS.USER.POSITION_MIN,
        "Position must be at least 2 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.USER.POSITION_MAX,
        "Position cannot exceed 100 characters",
      ],
      trim: true,
      match: [PERSON_NAME_REGEX, "Position format is invalid"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [VALIDATION_LIMITS.USER.EMAIL_MAX, "Email cannot exceed 100 characters"],
      match: [EMAIL_REGEX, "Email format is invalid"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        VALIDATION_LIMITS.USER.PASSWORD_MIN,
        "Password must be at least 8 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.USER.PASSWORD_MAX,
        "Password cannot exceed 128 characters",
      ],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      minlength: [VALIDATION_LIMITS.USER.PHONE_MIN, "Phone must be at least 10 characters"],
      maxlength: [VALIDATION_LIMITS.USER.PHONE_MAX, "Phone cannot exceed 15 characters"],
      match: [PHONE_REGEX, "Phone format is invalid"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: Object.values(USER_ROLES),
        message: "Role is invalid",
      },
      default: USER_ROLES.USER,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: "User status is invalid",
      },
      default: USER_STATUS.ACTIVE,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },
    isHod: {
      type: Boolean,
      default: false,
    },
    employeeId: {
      type: String,
      trim: true,
      match: [EMPLOYEE_ID_REGEX, "Employee ID format is invalid"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      validate: {
        validator: isPastOrPresent,
        message: "Joined date cannot be in the future",
      },
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: isPastOrPresent,
        message: "Date of birth cannot be in the future",
      },
    },
    skills: {
      type: [skillSchema],
      default: [],
      validate: {
        validator: (skills) =>
          Array.isArray(skills) && skills.length <= VALIDATION_LIMITS.USER.SKILLS_MAX,
        message: "Skills cannot contain more than 10 entries",
      },
    },
    profilePicture: {
      type: profilePictureSchema,
      default: null,
    },
    preferences: {
      type: userPreferencesSchema,
      default: () => ({ ...DEFAULT_USER_PREFERENCES }),
    },
    security: {
      type: userSecuritySchema,
      default: () => ({ ...DEFAULT_USER_SECURITY }),
    },
    isPlatformOrgUser: {
      type: Boolean,
      default: false,
      immutable: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      select: false,
      default: null,
    },
    verificationToken: {
      type: String,
      select: false,
      default: null,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpiry: {
      type: Date,
      select: false,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    refreshTokenExpiry: {
      type: Date,
      select: false,
      default: null,
    },
    welcomeEmailSentAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.USER,
});
userSchema.plugin(mongoosePaginate);

userSchema.index({ organization: 1, email: 1 }, { unique: true });
userSchema.index({ organization: 1, employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ organization: 1, department: 1, status: 1 });
userSchema.index({ organization: 1, role: 1 });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

userSchema.virtual("fullName").get(function fullNameGetter() {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

userSchema.pre("validate", async function ensureEmployeeId() {
  if (this.employeeId || !this.organization) {
    return;
  }

  this.employeeId = await buildNextEmployeeId(
    this,
    typeof this.$session === "function" ? this.$session() : null
  );
});

userSchema.pre("save", async function hashPasswordIfChanged() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
});

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.refreshTokenExpiry;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpiry;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpiry;
    delete ret.verificationToken;
    delete ret.verificationTokenExpiry;
    return ret;
  },
});

userSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
