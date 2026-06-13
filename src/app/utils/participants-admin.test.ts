import { describe, expect, it } from "vitest";
import { isParticipantsAdmin } from "./participants-admin";

describe("isParticipantsAdmin", () => {
  it("accepts the configured admin by supervisor role", () => {
    expect(
      isParticipantsAdmin({
        rol: "supervisor",
        nombreCompleto: "Administrador",
        correoInstitucional: "admin@universidad.edu.co",
      }),
    ).toBe(true);
  });

  it("rejects other names even if the role matches", () => {
    expect(
      isParticipantsAdmin({
        rol: "supervisor",
        nombreCompleto: "Laura Gomez",
        correoInstitucional: "laura@universidad.edu.co",
      }),
    ).toBe(false);
  });

  it("rejects the admin name with a non-allowed role", () => {
    expect(
      isParticipantsAdmin({
        rol: "estudiante",
        nombreCompleto: "Administrador",
        correoInstitucional: "admin@universidad.edu.co",
      }),
    ).toBe(false);
  });
});
