import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg, writeAuditLog } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireOrg();
  const { id } = await params;
  const body = (await req.json()) as { role?: string; name?: string; phone?: string };

  const target = await db.user.findFirst({
    where: { id, organizationId: user.organizationId! },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.role !== undefined && user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  if (body.role === "admin") {
    return NextResponse.json(
      { error: "Only one admin is permitted per platform. Admin role cannot be assigned." },
      { status: 403 }
    );
  }
  if (body.role !== undefined && target.role === "admin" && target.id === user.id) {
    return NextResponse.json(
      { error: "You cannot demote yourself. Transfer admin rights is not supported." },
      { status: 403 }
    );
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.phone != null ? { phone: body.phone } : {}),
      ...(body.role != null ? { role: body.role } : {}),
    },
  });

  await writeAuditLog({
    userId: user.id,
    organizationId: user.organizationId!,
    action: "team_member_updated",
    resourceType: "user",
    resourceId: id,
    details: `Updated ${target.email}: ${Object.keys(body).join(", ")}`,
  });

  return NextResponse.json({
    ...updated,
    lastActive: updated.lastActive?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireOrg();
  const { id } = await params;

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  const target = await db.user.findFirst({
    where: { id, organizationId: user.organizationId! },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.role === "admin") {
    return NextResponse.json({ error: "Cannot remove the admin account" }, { status: 403 });
  }

  await db.user.delete({ where: { id } });

  await writeAuditLog({
    userId: user.id,
    organizationId: user.organizationId!,
    action: "team_member_removed",
    resourceType: "user",
    resourceId: id,
    details: `Removed ${target.email} from organization`,
  });

  return NextResponse.json({ success: true });
}
