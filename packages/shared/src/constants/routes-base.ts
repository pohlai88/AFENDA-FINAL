/**
 * Base route definitions (no api.v1.magicdrive - that's added in routes.ts)
 */
export const routesBase = {
  ui: {
    marketing: {
      home: () => "/" as const,
      terms: () => "/terms" as const,
      privacy: () => "/privacy" as const,
      security: () => "/security" as const,
      pdpa: () => "/pdpa" as const,
    },
    auth: {
      login: () => "/login" as const,
      register: () => "/register" as const,
      forgotPassword: () => "/forgot-password" as const,
      resetPassword: () => "/reset-password" as const,
      callback: () => "/callback" as const,
      /** Check-email page after reset-email sent (/auth/check-email?type=reset-email) */
      status: () => "/auth/check-email" as const,
    },
    orchestra: {
      root: () => "/" as const,
      dashboard: () => "/dashboard" as const,
      settings: () => "/settings" as const,
      modules: () => "/modules" as const,
      analytics: () => "/analytics" as const,
      approvals: () => "/approvals" as const,
    },
    admin: {
      root: () => "/admin" as const,
      health: () => "/admin/health" as const,
      services: () => "/admin/services" as const,
      config: () => "/admin/config" as const,
      configTemplates: () => "/admin/config/templates" as const,
      audit: () => "/admin/audit" as const,
      backup: () => "/admin/backup" as const,
      admins: () => "/admin/admins" as const,
    },
    magicdrive: {
      root: () => "/magicdrive" as const,
      landing: () => "/magicdrive" as const,
      inbox: () => "/magicdrive/inbox" as const,
      duplicates: () => "/magicdrive/duplicates" as const,
      unsorted: () => "/magicdrive/unsorted" as const,
      search: () => "/magicdrive/search" as const,
      collections: () => "/magicdrive/collections" as const,
      audit: () => "/magicdrive/audit" as const,
      files: () => "/magicdrive/files" as const,
      documents: () => "/magicdrive/documents" as const,
      documentsById: (id: string) => `/magicdrive/documents/${id}` as const,
      /** Alias for documentsById for document-detail links */
      documentById: (id: string) => `/magicdrive/documents/${id}` as const,
      images: () => "/magicdrive/images" as const,
      videos: () => "/magicdrive/videos" as const,
      audio: () => "/magicdrive/audio" as const,
      archives: () => "/magicdrive/archives" as const,
      shared: () => "/magicdrive/shared" as const,
      recent: () => "/magicdrive/recent" as const,
      starred: () => "/magicdrive/starred" as const,
      trash: () => "/magicdrive/trash" as const,
      storage: () => "/magicdrive/storage" as const,
      settings: () => "/magicdrive/settings" as const,
    },
    tenancy: {
      root: () => "/tenancy" as const,
      organizations: {
        list: () => "/tenancy/organizations" as const,
        byId: (id: string) => `/tenancy/organizations/${id}` as const,
        new: () => "/tenancy/organizations/new" as const,
        settings: (id: string) => `/tenancy/organizations/${id}/settings` as const,
        members: (id: string) => `/tenancy/organizations/${id}/members` as const,
        teams: (id: string) => `/tenancy/organizations/${id}/teams` as const,
      },
      teams: {
        list: () => "/tenancy/teams" as const,
        byId: (id: string) => `/tenancy/teams/${id}` as const,
        new: () => "/tenancy/teams/new" as const,
        settings: (id: string) => `/tenancy/teams/${id}/settings` as const,
        members: (id: string) => `/tenancy/teams/${id}/members` as const,
      },
      memberships: () => "/tenancy/memberships" as const,
    },
    settings: {
      root: () => "/settings" as const,
      designSystem: () => "/settings/design-system" as const,
      sessions: () => "/settings/sessions" as const,
    },
    magictodo: {
      root: () => "/magictodo" as const,
      dashboard: () => "/magictodo" as const,
      tasks: () => "/magictodo/tasks" as const,
      taskDetail: (id: string) => `/magictodo/tasks/${id}` as const,
      taskEdit: (id: string) => `/magictodo/tasks/${id}/edit` as const,
      kanban: () => "/magictodo/kanban" as const,
      calendar: () => "/magictodo/calendar" as const,
      table: () => "/magictodo/table" as const,
      gantt: () => "/magictodo/gantt" as const,
      hierarchy: () => "/magictodo/hierarchy" as const,
      focus: () => "/magictodo/focus" as const,
      projects: () => "/magictodo/projects" as const,
      settings: () => "/magictodo/settings" as const,
      settingsCustomFields: () => "/magictodo/settings/custom-fields" as const,
    },
  },
  api: {
    orchestra: {
      services: () => "/api/orchestra/services/v1" as const,
      serviceById: (id: string) => `/api/orchestra/services/${id}` as const,
      serviceHealth: (id: string) => `/api/orchestra/services/${id}/health` as const,
      serviceHistory: (id: string, hours?: number) =>
        `/api/orchestra/services/${id}/history${hours != null ? `?hours=${hours}` : ""}` as const,
      health: () => "/api/orchestra/health/v1" as const,
      config: () => "/api/orchestra/config/v1" as const,
      configKey: (key: string) => `/api/orchestra/config/v1/${key}` as const,
      configTemplatesBff: () => "/api/orchestra/config/templates/bff" as const,
      configTemplatesOps: (action: string) =>
        `/api/orchestra/config/templates/ops?action=${action}` as const,
      audit: () => "/api/orchestra/audit/v1" as const,
      auditExport: () => "/api/orchestra/audit/ops" as const,
      backupDownload: (id: string) => `/api/orchestra/backup/download/${id}` as const,
      auditStream: () => "/api/orchestra/audit/stream" as const,
      backup: () => "/api/orchestra/backup/v1" as const,
      backupOps: () => "/api/orchestra/backup/ops" as const,
      healthStream: () => "/api/orchestra/health/stream" as const,
      navBff: () => "/api/orchestra/nav/bff" as const,
    },
    magictodo: {
      bff: {
        root: () => "/api/magictodo/bff" as const,
        tasks: () => "/api/magictodo/bff/tasks" as const,
        taskById: (id: string) => `/api/magictodo/bff/tasks/${id}` as const,
        dashboard: () => "/api/magictodo/bff/dashboard" as const,
        projects: () => "/api/magictodo/bff/projects" as const,
        snooze: () => "/api/magictodo/bff/snooze" as const,
        focus: {
          session: () => "/api/magictodo/bff/focus/session" as const,
          sessionComplete: () => "/api/magictodo/bff/focus/session/complete" as const,
          sessionSkip: () => "/api/magictodo/bff/focus/session/skip" as const,
          stats: () => "/api/magictodo/bff/focus/stats" as const,
          streak: () => "/api/magictodo/bff/focus/streak" as const,
        },
        kanban: () => "/api/magictodo/bff/kanban" as const,
        calendar: () => "/api/magictodo/bff/calendar" as const,
      },
      v1: {
        root: () => "/api/magictodo/v1" as const,
        tasks: {
          root: () => "/api/magictodo/v1/tasks" as const,
          byId: (id: string) => `/api/magictodo/v1/tasks/${id}` as const,
          filter: () => "/api/magictodo/v1/tasks/filter" as const,
          bulk: () => "/api/magictodo/v1/tasks/bulk" as const,
        },
        projects: {
          root: () => "/api/magictodo/v1/projects" as const,
          byId: (id: string) => `/api/magictodo/v1/projects/${id}` as const,
        },
        focus: {
          root: () => "/api/magictodo/v1/focus" as const,
          session: () => "/api/magictodo/v1/focus/session" as const,
          sessionById: (id: string) => `/api/magictodo/v1/focus/session/${id}` as const,
          stats: () => "/api/magictodo/v1/focus/stats" as const,
        },
        snooze: {
          root: () => "/api/magictodo/v1/snooze" as const,
          byTaskId: (taskId: string) => `/api/magictodo/v1/snooze/${taskId}` as const,
          expired: () => "/api/magictodo/v1/snooze/expired" as const,
        },
      },
      ops: {
        root: () => "/api/magictodo/ops" as const,
        health: () => "/api/magictodo/ops/health" as const,
        migrate: () => "/api/magictodo/ops/migrate" as const,
        debug: () => "/api/magictodo/ops/debug" as const,
        cleanup: () => "/api/magictodo/ops/cleanup" as const,
      },
    },
    magicdrive: {
      bff: {
        root: () => "/api/magicdrive/bff" as const,
        files: () => "/api/magicdrive/bff/files" as const,
        fileById: (id: string) => `/api/magicdrive/bff/files/${id}` as const,
        dashboard: () => "/api/magicdrive/bff/dashboard" as const,
        storage: () => "/api/magicdrive/bff/storage" as const,
        shared: () => "/api/magicdrive/bff/shared" as const,
        recent: () => "/api/magicdrive/bff/recent" as const,
        starred: () => "/api/magicdrive/bff/starred" as const,
        trash: () => "/api/magicdrive/bff/trash" as const,
        search: () => "/api/magicdrive/bff/search" as const,
      },
      v1: {
        root: () => "/api/magicdrive/v1" as const,
        files: {
          root: () => "/api/magicdrive/v1/files" as const,
          byId: (id: string) => `/api/magicdrive/v1/files/${id}` as const,
          upload: () => "/api/magicdrive/v1/files/upload" as const,
          download: (id: string) => `/api/magicdrive/v1/files/${id}/download` as const,
        },
        folders: {
          root: () => "/api/magicdrive/v1/folders" as const,
          byId: (id: string) => `/api/magicdrive/v1/folders/${id}` as const,
        },
        sharing: {
          root: () => "/api/magicdrive/v1/sharing" as const,
          byId: (id: string) => `/api/magicdrive/v1/sharing/${id}` as const,
        },
        objects: {
          root: () => "/api/magicdrive/v1/objects" as const,
          byId: (id: string) => `/api/magicdrive/v1/objects/${id}` as const,
        },
        list: () => "/api/magicdrive/v1" as const,
        duplicateGroups: () => "/api/magicdrive/v1/duplicate-groups" as const,
        auditHash: () => "/api/magicdrive/v1/audit/hash" as const,
      },
      ops: {
        root: () => "/api/magicdrive/ops" as const,
        health: () => "/api/magicdrive/ops/health" as const,
        migrate: () => "/api/magicdrive/ops/migrate" as const,
        cleanup: () => "/api/magicdrive/ops/cleanup" as const,
      },
    },
    cron: {
      processMagicdriveQueue: () =>
        "/api/cron/process-magicdrive-queue" as const,
    },
    tenancy: {
      bff: () => "/api/tenancy" as const,
      organizations: {
        bff: {
          list: () => "/api/tenancy/organizations/bff" as const,
          byId: (id: string) => `/api/tenancy/organizations/${id}/bff` as const,
        },
      },
      teams: {
        bff: {
          list: () => "/api/tenancy/teams/bff" as const,
          byId: (id: string) => `/api/tenancy/teams/${id}/bff` as const,
          members: (id: string) => `/api/tenancy/teams/${id}/members/bff` as const,
        },
      },
      memberships: {
        bff: {
          list: () => "/api/tenancy/memberships/bff" as const,
          byId: (id: string) => `/api/tenancy/memberships/${id}/bff` as const,
        },
      },
      tenant: {
        active: () => "/api/tenancy/tenant/active" as const,
        switchBff: () => "/api/tenancy/tenant/switch/bff" as const,
      },
      invitations: {
        bff: {
          accept: (token: string) => `/api/tenancy/invitations/${token}/accept/bff` as const,
          decline: (token: string) => `/api/tenancy/invitations/${token}/decline/bff` as const,
        },
      },
    },
  },
} as const
