import { NextResponse } from "next/server";

export function ok(data, init) {
  return NextResponse.json(data, init);
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status },
  );
}
