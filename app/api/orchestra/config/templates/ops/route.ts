/**
 * Configuration Templates OPS API
 * Internal operations for template application and validation.
 *
 * @domain orchestra
 * @tier ops
 * @consumer Internal/Admin only
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@afenda/shared/server/db";
import {
  applyTemplate,
  applyPreset,
  validateTemplateValues,
  getTemplate,
  getPreset,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  archiveRestoreTemplate,
  publishTemplate,
  getCustomTemplate,
  listCustomTemplates,
} from "@afenda/orchestra";
import {
  ApplyTemplateRequestSchema,
  ValidateTemplateRequestSchema,
  CreateCustomTemplateRequestSchema,
  UpdateCustomTemplateRequestSchema,
  DeleteCustomTemplateRequestSchema,
  ArchiveTemplateRequestSchema,
  PublishTemplateRequestSchema,
  KERNEL_ERROR_CODES,
} from "@afenda/orchestra/zod";
import { KERNEL_HEADERS, HTTP_STATUS } from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";

function getTraceContext(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  return { traceId, headers: envelopeHeaders(traceId) };
}

/**
 * POST /api/orchestra/config/templates/ops?action=apply
 * Apply a template with user-provided values
 */
async function handleApply(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = ApplyTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await applyTemplate(parsed.data, { db });
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to apply template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/config/templates/ops?action=validate
 * Validate template values before applying
 */
async function handleValidate(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = ValidateTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await validateTemplateValues(parsed.data);
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to validate template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/config/templates/ops?action=apply-preset
 * Apply an environment preset (multiple templates)
 */
async function handleApplyPreset(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const { presetId } = body;
    if (!presetId || typeof presetId !== "string") {
      return NextResponse.json(
        fail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "presetId is required" },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await applyPreset(presetId, { db });
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to apply preset",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * GET /api/orchestra/config/templates/ops?action=get-template&id=xxx
 * Get a specific template by ID
 */
async function handleGetTemplate(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      fail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Template ID is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }
  const result = await getTemplate(id);
  if (!result.ok) {
    const status = result.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
    return NextResponse.json(result, { status, headers });
  }
  return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
}

/**
 * GET /api/orchestra/config/templates/ops?action=get-preset&id=xxx
 * Get a specific preset by ID
 */
async function handleGetPreset(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      fail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Preset ID is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }
  const result = await getPreset(id);
  if (!result.ok) {
    const status = result.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
    return NextResponse.json(result, { status, headers });
  }
  return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
}

/**
 * POST /api/orchestra/config/templates/ops?action=create-custom
 * Create a new custom template
 */
async function handleCreateCustom(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = CreateCustomTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await createCustomTemplate({ db }, parsed.data, "system");
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.CREATED, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to create custom template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/config/templates/ops?action=update-custom
 * Update a custom template
 */
async function handleUpdateCustom(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = UpdateCustomTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await updateCustomTemplate({ db }, parsed.data, "system");
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to update custom template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/config/templates/ops?action=delete-custom
 * Delete a custom template
 */
async function handleDeleteCustom(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = DeleteCustomTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await deleteCustomTemplate({ db }, parsed.data, "system");
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to delete custom template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/config/templates/ops?action=archive
 * Archive or restore a custom template
 */
async function handleArchive(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = ArchiveTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await archiveRestoreTemplate({ db }, parsed.data, "system");
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to archive/restore template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * POST /api/orchestra/config/templates/ops?action=publish
 * Publish a custom template
 */
async function handlePublish(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  try {
    const body = await request.json();
    const parsed = PublishTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid request body",
            details: parsed.error.message,
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
    }
    const result = await publishTemplate({ db }, parsed.data, "system");
    if (!result.ok) {
      return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
    }
    return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
  } catch (error) {
    return NextResponse.json(
      fail(
        {
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Failed to publish template",
          details: error instanceof Error ? error.message : String(error),
        },
        { traceId }
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers }
    );
  }
}

/**
 * GET /api/orchestra/config/templates/ops?action=get-custom&id=xxx
 * Get a custom template by ID
 */
async function handleGetCustom(request: NextRequest) {
  const { traceId, headers } = getTraceContext(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      fail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Template ID is required" },
        { traceId }
      ),
      { status: HTTP_STATUS.BAD_REQUEST, headers }
    );
  }
  const result = await getCustomTemplate({ db }, id);
  if (!result.ok) {
    const status = result.error.code === KERNEL_ERROR_CODES.NOT_FOUND ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
    return NextResponse.json(result, { status, headers });
  }
  return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
}

/**
 * GET /api/orchestra/config/templates/ops?action=list-custom
 * List all custom templates
 */
async function handleListCustom(request: NextRequest) {
  const { headers } = getTraceContext(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "draft" | "published" | "archived" | null;
  const includeArchived = searchParams.get("includeArchived") === "true";
  const result = await listCustomTemplates({ db }, { status: status ?? undefined, includeArchived });
  if (!result.ok) {
    return NextResponse.json(result, { status: HTTP_STATUS.BAD_REQUEST, headers });
  }
  return NextResponse.json(result, { status: HTTP_STATUS.OK, headers });
}

/**
 * POST handler - route based on action query parameter
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  switch (action) {
    case "apply":
      return handleApply(request);
    case "validate":
      return handleValidate(request);
    case "apply-preset":
      return handleApplyPreset(request);
    case "create-custom":
      return handleCreateCustom(request);
    case "update-custom":
      return handleUpdateCustom(request);
    case "delete-custom":
      return handleDeleteCustom(request);
    case "archive":
      return handleArchive(request);
    case "publish":
      return handlePublish(request);
    default:
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message:
              "Invalid action. Use: apply, validate, apply-preset, create-custom, update-custom, delete-custom, archive, or publish",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
  }
}

/**
 * GET handler - route based on action query parameter
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  switch (action) {
    case "get-template":
      return handleGetTemplate(request);
    case "get-preset":
      return handleGetPreset(request);
    case "get-custom":
      return handleGetCustom(request);
    case "list-custom":
      return handleListCustom(request);
    default:
      return NextResponse.json(
        fail(
          {
            code: KERNEL_ERROR_CODES.VALIDATION,
            message: "Invalid action. Use: get-template, get-preset, get-custom, or list-custom",
          },
          { traceId }
        ),
        { status: HTTP_STATUS.BAD_REQUEST, headers }
      );
  }
}
