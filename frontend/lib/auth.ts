import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export const adminOnly = (req: NextRequest) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const token = authHeader.split(" ")[1];
  const payload: any = verifyToken(token);
  if (payload.role !== "admin") throw new Error("Forbidden");

  return payload;
};
