export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  adminRole: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValue?: string,
  newValue?: string,
  reason?: string
) {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminId,
        adminEmail,
        adminRole,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        reason,
      }),
    });
  } catch {}
}
