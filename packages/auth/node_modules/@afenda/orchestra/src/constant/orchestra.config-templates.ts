/**
 * Orchestra Kernel Configuration Templates
 * Pre-built configuration templates and environment presets.
 *
 * Zero domain knowledge — generic infrastructure templates.
 */

import type {
  ConfigTemplate,
  TemplatePreset,
  TemplateCategory,
} from "../zod/orchestra.config-template.schema";

/**
 * Template categories
 */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "System",
  "Tenant",
  "Service",
  "Compliance",
];

/**
 * System templates
 */
const SYSTEM_TEMPLATES: ConfigTemplate[] = [
  {
    id: "system-basic",
    name: "Basic System Configuration",
    description: "Essential system settings for production deployment",
    category: "System",
    icon: "IconServer",
    configs: [
      {
        key: "system.name",
        value: "AFENDA Production",
        description: "System display name",
        required: true,
        validation: { type: "string", minLength: 3, maxLength: 50 },
      },
      {
        key: "system.timezone",
        value: "Asia/Singapore",
        description: "Default system timezone",
        required: true,
        validation: { type: "timezone" },
      },
      {
        key: "system.locale",
        value: "en-US",
        description: "Default system locale",
        required: true,
        validation: { type: "locale", enum: ["en-US", "en-GB", "ms-MY", "zh-CN"] },
      },
      {
        key: "system.maintenance_mode",
        value: false,
        description: "Enable maintenance mode",
        required: false,
        validation: { type: "boolean" },
      },
    ],
  },
  {
    id: "system-email",
    name: "Email & Notification Configuration",
    description: "SMTP server and email notification settings",
    category: "System",
    icon: "IconMail",
    configs: [
      {
        key: "email.smtp_host",
        value: "smtp.example.com",
        description: "SMTP server hostname",
        required: true,
        validation: { type: "string" },
      },
      {
        key: "email.smtp_port",
        value: 587,
        description: "SMTP server port",
        required: true,
        validation: { type: "number", min: 1, max: 65535 },
      },
      {
        key: "email.from_address",
        value: "noreply@afenda.com",
        description: "Default sender email address",
        required: true,
        validation: { type: "email" },
      },
      {
        key: "email.from_name",
        value: "AFENDA System",
        description: "Default sender name",
        required: true,
        validation: { type: "string" },
      },
      {
        key: "email.enable_tls",
        value: true,
        description: "Enable TLS encryption",
        required: true,
        validation: { type: "boolean" },
      },
    ],
  },
  {
    id: "system-security",
    name: "Security & Authentication",
    description: "Security policies and authentication settings",
    category: "System",
    icon: "IconShield",
    configs: [
      {
        key: "security.session_timeout",
        value: 3600,
        description: "Session timeout in seconds",
        required: true,
        validation: { type: "number", min: 300, max: 86400 },
      },
      {
        key: "security.password_min_length",
        value: 12,
        description: "Minimum password length",
        required: true,
        validation: { type: "number", min: 8, max: 128 },
      },
      {
        key: "security.require_mfa",
        value: true,
        description: "Require multi-factor authentication",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "security.max_login_attempts",
        value: 5,
        description: "Maximum failed login attempts before lockout",
        required: true,
        validation: { type: "number", min: 3, max: 10 },
      },
      {
        key: "security.lockout_duration",
        value: 900,
        description: "Account lockout duration in seconds",
        required: true,
        validation: { type: "number", min: 300, max: 3600 },
      },
    ],
  },
  {
    id: "system-logging",
    name: "Logging Configuration",
    description: "System logging and audit settings",
    category: "System",
    icon: "IconFileText",
    configs: [
      {
        key: "logging.level",
        value: "info",
        description: "Default log level",
        required: true,
        validation: { type: "enum", enum: ["debug", "info", "warn", "error"] },
      },
      {
        key: "logging.retention_days",
        value: 90,
        description: "Log retention period in days",
        required: true,
        validation: { type: "number", min: 7, max: 365 },
      },
      {
        key: "logging.enable_audit",
        value: true,
        description: "Enable audit logging",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "logging.max_file_size_mb",
        value: 100,
        description: "Maximum log file size in MB",
        required: true,
        validation: { type: "number", min: 10, max: 1000 },
      },
    ],
  },
];

/**
 * Tenant templates
 */
const TENANT_TEMPLATES: ConfigTemplate[] = [
  {
    id: "tenant-basic",
    name: "Tenant Basic Settings",
    description: "Essential tenant-level configuration",
    category: "Tenant",
    icon: "IconBuilding",
    configs: [
      {
        key: "display_name",
        value: "My Organization",
        description: "Tenant display name",
        required: true,
        validation: { type: "string", minLength: 3, maxLength: 100 },
      },
      {
        key: "timezone",
        value: "Asia/Singapore",
        description: "Tenant timezone",
        required: true,
        validation: { type: "timezone" },
      },
      {
        key: "locale",
        value: "en-US",
        description: "Tenant locale",
        required: true,
        validation: { type: "locale", enum: ["en-US", "en-GB", "ms-MY", "zh-CN"] },
      },
      {
        key: "currency",
        value: "MYR",
        description: "Default currency",
        required: true,
        validation: { type: "enum", enum: ["MYR", "USD", "SGD", "EUR", "GBP"] },
      },
    ],
  },
  {
    id: "tenant-branding",
    name: "Branding & Customization",
    description: "Tenant branding and UI customization",
    category: "Tenant",
    icon: "IconPalette",
    configs: [
      {
        key: "branding.logo_url",
        value: "",
        description: "Company logo URL",
        required: false,
        validation: { type: "url" },
      },
      {
        key: "branding.primary_color",
        value: "#3b82f6",
        description: "Primary brand color",
        required: false,
        validation: { type: "color" },
      },
      {
        key: "branding.company_name",
        value: "My Company",
        description: "Company name for branding",
        required: false,
        validation: { type: "string", maxLength: 100 },
      },
      {
        key: "branding.favicon_url",
        value: "",
        description: "Favicon URL",
        required: false,
        validation: { type: "url" },
      },
    ],
  },
  {
    id: "tenant-features",
    name: "Feature Toggles",
    description: "Tenant-level feature flags",
    category: "Tenant",
    icon: "IconToggleLeft",
    configs: [
      {
        key: "features.enable_notifications",
        value: true,
        description: "Enable email notifications",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "features.enable_api_access",
        value: true,
        description: "Enable API access for this tenant",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "features.enable_exports",
        value: true,
        description: "Enable data export functionality",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "features.max_users",
        value: 50,
        description: "Maximum number of users",
        required: true,
        validation: { type: "number", min: 1, max: 10000 },
      },
    ],
  },
];

/**
 * Service templates
 */
const SERVICE_TEMPLATES: ConfigTemplate[] = [
  {
    id: "service-api",
    name: "API Configuration",
    description: "REST API and rate limiting settings",
    category: "Service",
    icon: "IconApi",
    configs: [
      {
        key: "api.rate_limit",
        value: 1000,
        description: "API requests per hour per user",
        required: true,
        validation: { type: "number", min: 100, max: 10000 },
      },
      {
        key: "api.timeout",
        value: 30000,
        description: "API timeout in milliseconds",
        required: true,
        validation: { type: "number", min: 5000, max: 120000 },
      },
      {
        key: "api.enable_cors",
        value: true,
        description: "Enable CORS for API endpoints",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "api.max_request_size_mb",
        value: 10,
        description: "Maximum request body size in MB",
        required: true,
        validation: { type: "number", min: 1, max: 100 },
      },
    ],
  },
  {
    id: "service-storage",
    name: "Storage Configuration",
    description: "File storage and upload settings",
    category: "Service",
    icon: "IconDatabase",
    configs: [
      {
        key: "storage.max_file_size",
        value: 10485760,
        description: "Maximum file upload size in bytes (10MB)",
        required: true,
        validation: { type: "number", min: 1048576, max: 104857600 },
      },
      {
        key: "storage.allowed_extensions",
        value: ["pdf", "jpg", "png", "docx", "xlsx"],
        description: "Allowed file extensions",
        required: true,
        validation: { type: "array", items: { type: "string" } },
      },
      {
        key: "storage.enable_virus_scan",
        value: true,
        description: "Enable virus scanning for uploads",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "storage.retention_days",
        value: 365,
        description: "File retention period in days",
        required: true,
        validation: { type: "number", min: 30, max: 3650 },
      },
    ],
  },
  {
    id: "service-cache",
    name: "Cache Configuration",
    description: "Caching and performance settings",
    category: "Service",
    icon: "IconBolt",
    configs: [
      {
        key: "cache.ttl",
        value: 3600,
        description: "Default cache TTL in seconds",
        required: true,
        validation: { type: "number", min: 60, max: 86400 },
      },
      {
        key: "cache.max_size_mb",
        value: 512,
        description: "Maximum cache size in MB",
        required: true,
        validation: { type: "number", min: 64, max: 4096 },
      },
      {
        key: "cache.enable_compression",
        value: true,
        description: "Enable cache compression",
        required: true,
        validation: { type: "boolean" },
      },
    ],
  },
  {
    id: "service-backup",
    name: "Backup Configuration",
    description: "Automated backup settings",
    category: "Service",
    icon: "IconDeviceFloppy",
    configs: [
      {
        key: "backup.schedule",
        value: "0 2 * * *",
        description: "Backup schedule (cron format)",
        required: true,
        validation: { type: "string" },
      },
      {
        key: "backup.retention_days",
        value: 30,
        description: "Backup retention period in days",
        required: true,
        validation: { type: "number", min: 7, max: 365 },
      },
      {
        key: "backup.enable_encryption",
        value: true,
        description: "Enable backup encryption",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "backup.max_backups",
        value: 10,
        description: "Maximum number of backups to retain",
        required: true,
        validation: { type: "number", min: 3, max: 100 },
      },
    ],
  },
];

/**
 * Compliance templates
 */
const COMPLIANCE_TEMPLATES: ConfigTemplate[] = [
  {
    id: "compliance-pdpa",
    name: "PDPA Compliance",
    description: "Malaysia Personal Data Protection Act settings",
    category: "Compliance",
    icon: "IconShieldCheck",
    configs: [
      {
        key: "pdpa.data_retention_days",
        value: 365,
        description: "Data retention period in days",
        required: true,
        validation: { type: "number", min: 30, max: 3650 },
      },
      {
        key: "pdpa.consent_required",
        value: true,
        description: "Require explicit user consent",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "pdpa.right_to_erasure",
        value: true,
        description: "Enable right to erasure (deletion)",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "pdpa.data_portability",
        value: true,
        description: "Enable data portability",
        required: true,
        validation: { type: "boolean" },
      },
    ],
  },
  {
    id: "compliance-audit",
    name: "Audit & Compliance Logging",
    description: "Comprehensive audit trail settings",
    category: "Compliance",
    icon: "IconFileCheck",
    configs: [
      {
        key: "audit.enable_all_events",
        value: true,
        description: "Log all system events",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "audit.retention_days",
        value: 2555,
        description: "Audit log retention (7 years for compliance)",
        required: true,
        validation: { type: "number", min: 365, max: 3650 },
      },
      {
        key: "audit.enable_immutability",
        value: true,
        description: "Make audit logs immutable",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "audit.enable_encryption",
        value: true,
        description: "Encrypt audit logs at rest",
        required: true,
        validation: { type: "boolean" },
      },
    ],
  },
  {
    id: "compliance-gdpr",
    name: "GDPR Compliance",
    description: "General Data Protection Regulation settings",
    category: "Compliance",
    icon: "IconShieldLock",
    configs: [
      {
        key: "gdpr.data_retention_days",
        value: 730,
        description: "Data retention period (2 years)",
        required: true,
        validation: { type: "number", min: 30, max: 3650 },
      },
      {
        key: "gdpr.consent_required",
        value: true,
        description: "Require explicit consent",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "gdpr.right_to_be_forgotten",
        value: true,
        description: "Enable right to be forgotten",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "gdpr.data_portability",
        value: true,
        description: "Enable data portability",
        required: true,
        validation: { type: "boolean" },
      },
      {
        key: "gdpr.breach_notification_hours",
        value: 72,
        description: "Breach notification deadline in hours",
        required: true,
        validation: { type: "number", min: 24, max: 72 },
      },
    ],
  },
];

/**
 * All configuration templates
 */
export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  ...SYSTEM_TEMPLATES,
  ...TENANT_TEMPLATES,
  ...SERVICE_TEMPLATES,
  ...COMPLIANCE_TEMPLATES,
];

/**
 * Environment presets
 */
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "production",
    name: "Production Environment",
    description: "Secure, optimized settings for production deployment",
    templates: [
      "system-basic",
      "system-email",
      "system-security",
      "system-logging",
      "service-api",
      "service-storage",
      "service-cache",
      "service-backup",
      "compliance-pdpa",
      "compliance-audit",
    ],
  },
  {
    id: "development",
    name: "Development Environment",
    description: "Relaxed settings for local development",
    templates: [
      "system-basic",
      "system-logging",
      "service-api",
      "service-cache",
    ],
  },
  {
    id: "staging",
    name: "Staging Environment",
    description: "Production-like settings for testing",
    templates: [
      "system-basic",
      "system-email",
      "system-security",
      "system-logging",
      "service-api",
      "service-storage",
      "service-cache",
      "compliance-audit",
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ConfigTemplate | undefined {
  return CONFIG_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): ConfigTemplate[] {
  return CONFIG_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): TemplatePreset | undefined {
  return TEMPLATE_PRESETS.find((p) => p.id === id);
}
