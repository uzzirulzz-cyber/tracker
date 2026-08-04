import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/db";
import { decodeInvite } from "@/lib/invite-token";
import { setSessionCookie, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token, password } = (await req.json()) as { token: string; password: string };

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const payload = decodeInvite(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired invitation link" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await withRetry(() =>
      db.user.findUnique({ where: { email: payload.email } })
    );

    if (existing) {
      return NextResponse.json({ error: "This email is already registered" }, { status: 400 });
    }

    // Check organization
    const org = await withRetry(() =>
      db.organization.findUnique({ where: { id: payload.orgId } })
    );

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check member limit
    const memberCount = await withRetry(() =>
      db.user.count({ where: { organizationId: org.id } })
    );

    if (memberCount >= org.maxUsers) {
      return NextResponse.json(
        { error: `Organization has reached its ${org.maxUsers}-user limit` },
        { status: 400 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await withRetry(() =>
      db.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          phone: payload.phone || null,
          passwordHash,
          role: payload.role || "investigator",
          organizationId: org.id,
          mfaEnabled: false,
          lastActive: new Date(),
          tokenIdentifier: `email:${payload.email}`,
        },
        include: { organization: true },
      })
    );

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization
          ? { id: user.organization.id, name: user.organization.name, licenseType: user.organization.licenseType }
          : null,
      },
    });
  } catch (err) {
    console.error("[activate] Error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const payload = decodeInvite(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired invitation link" }, { status: 400 });
    }

    const org = await withRetry(() =>
      db.organization.findUnique({
        where: { id: payload.orgId },
        select: { id: true, name: true, licenseKey: true },
      })
    );

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      organization: org,
      invitee: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
      },
    });
  } catch (err) {
    console.error("[activate-get] Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
