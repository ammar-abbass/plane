import type { Result } from "@/types";
import { PlaneError } from "./errors";
import { logger } from "./logger";

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { success: true, data: await fn() };
  } catch (err) {
    if (err instanceof PlaneError) {
      return { success: false, error: { code: err.code, message: err.message } };
    }
    logger.error({ err }, "Unexpected error in server action");
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    };
  }
}
