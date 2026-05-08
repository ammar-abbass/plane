import type { ErrorCode } from "@/types";

export class PlaneError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "PlaneError";
  }
}
