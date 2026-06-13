import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParticipantsPage } from "./ParticipantsPage";

const navigateMock = vi.fn();
const toggleThemeMock = vi.fn();
const logoutMock = vi.fn();

const validateParticipantInvitationCodeMock = vi.fn();
const registerParticipantWithInvitationMock = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: toggleThemeMock,
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      nombreCompleto: "Administrador",
      correoInstitucional: "admin@universidad.edu.co",
      rol: "supervisor",
    },
    isAuthenticated: true,
    logout: logoutMock,
  }),
}));

vi.mock("../../services/api", () => ({
  api: {
    validateParticipantInvitationCode: (...args: unknown[]) =>
      validateParticipantInvitationCodeMock(...args),
    registerParticipantWithInvitation: (...args: unknown[]) =>
      registerParticipantWithInvitationMock(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ParticipantsPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    toggleThemeMock.mockReset();
    logoutMock.mockReset();
    validateParticipantInvitationCodeMock.mockReset();
    registerParticipantWithInvitationMock.mockReset();
  });

  it("shows the name form only after a valid invitation code", async () => {
    validateParticipantInvitationCodeMock.mockResolvedValue({
      valido: true,
      codigo: "482910",
    });

    render(<ParticipantsPage />);

    expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText("Código de 6 dígitos"),
      "482910",
    );
    await userEvent.click(screen.getByRole("button", { name: "Validar código" }));

    expect(validateParticipantInvitationCodeMock).toHaveBeenCalledWith("482910");

    expect(await screen.findByPlaceholderText("Ej. Laura Gomez")).toBeInTheDocument();
    expect(
      screen.getByText("El código 482910 está disponible."),
    ).toBeInTheDocument();
  });

  it("registers the participant with the validated code", async () => {
    validateParticipantInvitationCodeMock.mockResolvedValue({
      valido: true,
      codigo: "482910",
    });
    registerParticipantWithInvitationMock.mockResolvedValue({
      registrado: true,
      nombre: "Laura Gomez",
      codigo: "482910",
    });

    render(<ParticipantsPage />);

    await userEvent.type(
      screen.getByPlaceholderText("Código de 6 dígitos"),
      "482910",
    );
    await userEvent.click(screen.getByRole("button", { name: "Validar código" }));

    const nameInput = await screen.findByPlaceholderText("Ej. Laura Gomez");
    await userEvent.type(nameInput, "Laura Gomez");
    await userEvent.click(
      screen.getByRole("button", { name: "Registrar participante" }),
    );

    await waitFor(() => {
      expect(registerParticipantWithInvitationMock).toHaveBeenCalledWith({
        nombre: "Laura Gomez",
        codigo: "482910",
      });
    });

    expect(
      await screen.findByText(
        "Laura Gomez quedó registrado con el código 482910.",
      ),
    ).toBeInTheDocument();
  });

  it("clears the validated flow when the code changes", async () => {
    validateParticipantInvitationCodeMock.mockResolvedValue({
      valido: true,
      codigo: "482910",
    });

    render(<ParticipantsPage />);

    const codeInput = screen.getByPlaceholderText("Código de 6 dígitos");
    await userEvent.type(codeInput, "482910");
    await userEvent.click(screen.getByRole("button", { name: "Validar código" }));

    expect(await screen.findByPlaceholderText("Ej. Laura Gomez")).toBeInTheDocument();

    fireEvent.change(codeInput, { target: { value: "111111" } });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Ej. Laura Gomez")).not.toBeInTheDocument();
    });
  });
});
