import { z } from "zod";

// ==========================================
// Authentication Schemas
// ==========================================

export const UserRoleSchema = z.enum(["WORKER", "RECRUITER", "ADMIN"]);

export const RegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
  role: z.enum(["WORKER", "RECRUITER"], {
    message: "Please select whether you want to work or hire",
  }),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^(?:\+977)?[9][6-9]\d{8}$/, "Please provide a valid Nepali mobile number (e.g., 98XXXXXXXX)")
    .optional()
    .or(z.literal("")),
});

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// ==========================================
// Job Schemas
// ==========================================

export const UrgencyLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const JobStatusSchema = z.enum(["OPEN", "MATCHED", "COMPLETED", "CLOSED"]);

export const CreateJobSchema = z.object({
  title: z
    .string()
    .min(5, "Job title must be at least 5 characters")
    .max(120, "Job title must be less than 120 characters"),
  description: z
    .string()
    .min(20, "Please provide a detailed description (at least 20 characters)")
    .max(2000),
  category: z.string().min(2, "Please select a category"),
  urgency: UrgencyLevelSchema.default("MEDIUM").optional(),
  budget: z
    .number()
    .positive("Budget must be greater than 0")
    .optional()
    .nullable(),
  latitude: z.number().min(-90).max(90, "Invalid latitude coordinate"),
  longitude: z.number().min(-180).max(180, "Invalid longitude coordinate"),
  address: z.string().min(3, "Please provide a location or address"),
});

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: JobStatusSchema.optional(),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

// ==========================================
// Profile Schemas
// ==========================================

export const WorkerProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional().nullable(),
  skills: z.array(z.string()).min(1, "Please add at least one skill"),
  hourlyRate: z.number().positive("Hourly rate must be positive").optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  profilePhotoUrl: z.string().url("Invalid image URL").optional().nullable(),
});

export const RecruiterProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().max(150).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  profilePhotoUrl: z.string().url("Invalid image URL").optional().nullable(),
});

export type WorkerProfileInput = z.infer<typeof WorkerProfileSchema>;
export type RecruiterProfileInput = z.infer<typeof RecruiterProfileSchema>;

// ==========================================
// Application & Review Schemas
// ==========================================

export const CreateApplicationSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  coverNote: z.string().max(1000, "Note cannot exceed 1000 characters").optional().nullable(),
  proposedRate: z.number().positive("Proposed rate must be positive").optional().nullable(),
});

export const CreateReviewSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  targetUserId: z.string().uuid("Invalid user ID"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters").optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ==========================================
// Location Search & Query Filters
// ==========================================

export const NearbySearchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().default(10), // Default 10km radius
  category: z.string().optional(),
  urgency: UrgencyLevelSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type NearbySearchQuery = z.infer<typeof NearbySearchQuerySchema>;
