import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import type { ReactNode } from "react";

// Mock fetch globally
global.fetch = vi.fn();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

describe("AuthContext - Login Tests", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("a) should successfully login with correct username and password", async () => {
    // Mock successful API response
    const mockUser = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
    };
    const mockToken = "mock-jwt-token-123";

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        token: mockToken,
        user: mockUser,
      }),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Attempt login with correct credentials
    const loginSuccess = await result.current.login(
      "testuser",
      "correctpassword"
    );

    expect(loginSuccess).toBe(true);
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
    });

    // Verify localStorage was updated
    expect(localStorage.getItem("auth-token")).toBe(mockToken);
    expect(localStorage.getItem("auth-user")).toBe(JSON.stringify(mockUser));

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        password: "correctpassword",
      }),
    });
  });

  it("b) should fail login with incorrect username and correct password", async () => {

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        message: "Invalid username or password",
      }),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const loginSuccess = await result.current.login(
      "wronguser",
      "correctpassword"
    );

    expect(loginSuccess).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();


    expect(localStorage.getItem("auth-token")).toBeNull();
    expect(localStorage.getItem("auth-user")).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "wronguser",
        password: "correctpassword",
      }),
    });
  });

  it("c) should fail login with correct username and incorrect password", async () => {

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        message: "Invalid username or password",
      }),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });


    const loginSuccess = await result.current.login(
      "testuser",
      "wrongpassword"
    );

    expect(loginSuccess).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();

    expect(localStorage.getItem("auth-token")).toBeNull();
    expect(localStorage.getItem("auth-user")).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser", password: "wrongpassword" }),
    });
  });

  it("should handle network errors during login", async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const loginSuccess = await result.current.login("testuser", "password");

    expect(loginSuccess).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
