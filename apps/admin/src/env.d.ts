import type { AdminSession } from "@goldshore/auth";

declare namespace App {
  interface Locals {
    adminSession: AdminSession & {
      actor?: string;
      isAuthenticated: boolean;
    };
  }
}
