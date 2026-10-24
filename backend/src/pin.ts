import { hashPassword, verifyPassword } from "./password.js";

const PIN_RE = /^\d{4}$/;

export function isPin(pin: unknown): pin is string {
  return typeof pin === "string" && PIN_RE.test(pin);
}

export function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

export function verifyPin(pin: string, stored: string): Promise<boolean> {
  return verifyPassword(pin, stored);
}
