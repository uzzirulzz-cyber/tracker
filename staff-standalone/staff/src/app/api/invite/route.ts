import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createEncodedInvite } from "@/lib/invite-token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const admin = await requireUser();

    if (admin.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { name, email, phone, role = "investigator" } = (await req.json()) as {
      name: string;
      email: string;
      phone?: string;
      role?: string;
    };

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await withRetry(() => db.user.findUnique({ where: { email: email.toLowerCase() } }));
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const org = await withRetry(() =>
      db.organization.findFirst({ where: { activatedById: admin.id } })
    );

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const token = createEncodedInvite({
      orgId: org.id,
      email: email.toLowerCase(),
      name,
      phone,
      role,
    });

    return NextResponse.json({
      token,
      link: `/activate?token=${encodeURIComponent(token)}`,
      invitee: { name, email, phone, role },
    });
  } catch (err) {
    console.error("[invite] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
