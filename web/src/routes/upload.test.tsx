import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { UploadComponent } from "./upload";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as AuthContext from "@/contexts/AuthContext";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    options: {
      component: () => <div />,
    },
  }),
}));


const { Route } = await import("./upload");
const UploadComponent = Route.options.component as () => JSX.Element;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

global.fetch = vi.fn();

describe("Upload Component - File Upload Tests", () => {
  const mockToken = "mock-token-123";

  beforeEach(() => {

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      token: mockToken,
      user: { id: "1", username: "testuser", email: "test@example.com" },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockFile = (
    name: string,
    size: number,
    type: string = "application/zip"
  ) => {

    const file = new File(["a"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("a) should accept and upload file with size exactly 250MB", async () => {
    const fileSize = 250 * 1024 * 1024; // Exactly 250MB
    const mockFile = createMockFile("spotify-data.zip", fileSize);

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        message: "File processed successfully",
      }),
    });

    render(<UploadComponent />);


    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();

    const fileInput = screen.getByTestId("file-input");

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText("spotify-data.zip")).toBeInTheDocument();
    expect(screen.getByText("250.0 MB")).toBeInTheDocument();

    const uploadButton = screen.getByRole("button", {
      name: /upload & analyze/i,
    });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Success!/)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/upload",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      })
    );
  });

  it("b) should accept and upload file with size less than 250MB", async () => {
    const fileSize = 100 * 1024 * 1024; // 100MB
    const mockFile = createMockFile("spotify-data.zip", fileSize);

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        message: "File processed successfully",
      }),
    });

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText("spotify-data.zip")).toBeInTheDocument();
    expect(screen.getByText("100.0 MB")).toBeInTheDocument();
    expect(screen.queryByText(/exceeds 250MB limit/i)).not.toBeInTheDocument();

    const uploadButton = screen.getByRole("button", {
      name: /upload & analyze/i,
    });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Success!/)).toBeInTheDocument();
    });
  });

  it("c) should reject file with size greater than 250MB", async () => {
    const fileSize = 300 * 1024 * 1024; // 300MB
    const mockFile = createMockFile("large-file.zip", fileSize);

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(
      screen.getByText(/File size exceeds 250MB limit/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /upload & analyze/i })
    ).not.toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("d) should handle file with size 0MB", async () => {
    const fileSize = 0;
    const mockFile = createMockFile("empty-file.zip", fileSize);

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        message: "Invalid or empty file",
      }),
    });

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText("empty-file.zip")).toBeInTheDocument();
    expect(screen.getByText("0.0 MB")).toBeInTheDocument();

    const uploadButton = screen.getByRole("button", {
      name: /upload & analyze/i,
    });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error: Invalid or empty file/i)
      ).toBeInTheDocument();
    });
  });

  it("e) should accept ZIP file type", async () => {
    const fileSize = 50 * 1024 * 1024; // 50MB
    const mockFile = createMockFile(
      "spotify-data.zip",
      fileSize,
      "application/zip"
    );

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        message: "File processed successfully",
      }),
    });

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText("spotify-data.zip")).toBeInTheDocument();
    expect(
      screen.queryByText(/Please select a ZIP file/i)
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /upload & analyze/i })
    ).toBeInTheDocument();
  });

  it("f) should reject invalid file type (non-ZIP)", async () => {
    const fileSize = 50 * 1024 * 1024; // 50MB
    const mockFile = createMockFile("spotify-data.txt", fileSize, "text/plain");

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(
      screen.getByText(/Please select a ZIP file containing your Spotify data/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /upload & analyze/i })
    ).not.toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should handle network errors during upload", async () => {
    const fileSize = 100 * 1024 * 1024;
    const mockFile = createMockFile("spotify-data.zip", fileSize);

    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const uploadButton = screen.getByRole("button", {
      name: /upload & analyze/i,
    });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Network error. Please try again/i)
      ).toBeInTheDocument();
    });
  });

  it("should handle drag and drop file selection", async () => {
    const fileSize = 100 * 1024 * 1024;
    const mockFile = createMockFile("spotify-data.zip", fileSize);

    render(<UploadComponent />);

    expect(
      screen.getByText(/select your streaming history/i)
    ).toBeInTheDocument();
    const dropZone = screen
      .getByText(/Drop your Spotify data ZIP file here/i)
      .closest("div");

    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        files: [mockFile],
      },
    } as any;

    fireEvent.drop(dropZone!, dropEvent);

    expect(screen.getByText("spotify-data.zip")).toBeInTheDocument();
    expect(screen.getByText("100.0 MB")).toBeInTheDocument();
  });
});