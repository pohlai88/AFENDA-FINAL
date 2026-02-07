"use client";

/**
 * Editable Role Permissions Matrix
 * Enterprise CRUD-based RBAC: Role × Resource × Operation (Create, Read, Update, Delete).
 * Editable by Full Admin and Config Admin only.
 *
 * @domain admin
 * @layer component
 */

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Checkbox,
} from "@afenda/shadcn";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  RBAC_RESOURCES,
  RBAC_RESOURCE_LABELS,
  CRUD_OPS,
  CRUD_LABELS,
} from "../_constants/admin-assignment.constants";
import { updateRBACMatrixAction, type ActionState } from "../_actions/admin-assignment.actions";
import type { AdminRole } from "@afenda/orchestra";
import type { RbacResource, CrudOp } from "../_constants/admin-assignment.constants";

interface RBACRoleMatrixClientProps {
  initialMatrix: Record<AdminRole, Record<RbacResource, Record<CrudOp, boolean>>>;
  canEdit: boolean;
}

const initialState: ActionState = {};

export function RBACRoleMatrixClient({ initialMatrix, canEdit }: RBACRoleMatrixClientProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [matrix, setMatrix] = React.useState(initialMatrix);
  const [state, formAction] = useActionState(updateRBACMatrixAction, initialState);

  React.useEffect(() => {
    if (state?.success) {
      toast.success("Role permissions updated successfully");
      setIsEditing(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.success, state?.error]);

  const handleToggle = (role: AdminRole, resource: RbacResource, op: CrudOp) => {
    if (!isEditing) return;
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [resource]: {
          ...prev[role][resource],
          [op]: !prev[role][resource][op],
        },
      },
    }));
  };

  const handleCancel = () => {
    setMatrix(initialMatrix);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.set("matrix", JSON.stringify(matrix));
    formAction(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              Enterprise RBAC matrix: each role defines Create, Read, Update, Delete access per resource.
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Permissions
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table aria-describedby="rbac-caption">
          <caption className="sr-only">
            Role permissions matrix: Create, Read, Update, Delete per resource
          </caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Role</TableHead>
              {RBAC_RESOURCES.map((res) => (
                <TableHead key={res} className="text-center min-w-[100px]">
                  <div className="font-medium">{RBAC_RESOURCE_LABELS[res]}</div>
                  <div className="flex justify-center gap-2 mt-1 text-xs text-muted-foreground font-normal">
                    {CRUD_OPS.map((op) => (
                      <span key={op} title={CRUD_LABELS[op]}>
                        {op[0].toUpperCase()}
                      </span>
                    ))}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ADMIN_ROLES.map((role) => (
              <TableRow key={role}>
                <TableCell className="font-medium">
                  {ADMIN_ROLE_LABELS[role]}
                </TableCell>
                {RBAC_RESOURCES.map((res) => {
                  const perms = matrix[role][res];
                  return (
                    <TableCell key={res} className="text-center">
                      <div className="flex justify-center gap-2 text-sm">
                        {CRUD_OPS.map((op) => {
                          const isGranted = perms[op];
                          if (isEditing && canEdit) {
                            return (
                              <Checkbox
                                key={op}
                                checked={isGranted}
                                onCheckedChange={() => handleToggle(role, res, op)}
                                className="w-5 h-5"
                                title={`${CRUD_LABELS[op]}: ${isGranted ? "Granted" : "Denied"}`}
                              />
                            );
                          }
                          return (
                            <span
                              key={op}
                              className={`w-5 h-5 inline-flex items-center justify-center rounded text-xs font-medium ${
                                isGranted
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                              title={`${CRUD_LABELS[op]}: ${isGranted ? "Granted" : "Denied"}`}
                            >
                              {isGranted ? "✓" : "—"}
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p id="rbac-caption" className="sr-only">
          Role permissions matrix: each role shows Create, Read, Update, Delete access per resource. Checkmark indicates granted, dash indicates denied.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <strong>C</strong> Create · <strong>R</strong> Read · <strong>U</strong> Update · <strong>D</strong> Delete
          </span>
          <span>✓ Granted · — Denied</span>
        </div>
        {!canEdit && (
          <p className="mt-4 text-sm text-muted-foreground">
            Only Full Admin and Config Admin can edit role permissions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
