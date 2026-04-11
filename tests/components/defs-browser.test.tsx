import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DefsBrowser } from "@/components/defs-browser";

// Mock the server action
vi.mock("@/actions/properties", () => ({
  listSharedDefinitions: vi.fn(),
}));

import { listSharedDefinitions } from "@/actions/properties";
const mockListSharedDefinitions = vi.mocked(listSharedDefinitions);

const mockDefs = [
  {
    id: "def-1",
    name: "money",
    description: "Monetary amount with currency",
    field_summary: "amount: number, currency: string",
  },
  {
    id: "def-2",
    name: "temporal-rule",
    description: "Time-based legal rule",
    field_summary: "duration: string, unit: string",
  },
  {
    id: "def-3",
    name: "percentage",
    description: "A percentage value between 0 and 100",
    field_summary: "value: number",
  },
];

describe("DefsBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockListSharedDefinitions.mockReturnValue(new Promise(() => {})); // never resolves
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);
    expect(
      screen.getByText("Loading shared definitions..."),
    ).toBeInTheDocument();
  });

  it("renders definitions after loading", async () => {
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("money")).toBeInTheDocument();
    });
    expect(screen.getByText("temporal-rule")).toBeInTheDocument();
    expect(screen.getByText("percentage")).toBeInTheDocument();
  });

  it("renders descriptions", async () => {
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Monetary amount with currency"),
      ).toBeInTheDocument();
    });
  });

  it("renders field summaries", async () => {
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("amount: number, currency: string"),
      ).toBeInTheDocument();
    });
  });

  it("highlights selected definition", async () => {
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected="money" onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("selected")).toBeInTheDocument();
    });
  });

  it("calls onSelect when a definition is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText("money")).toBeInTheDocument();
    });

    await user.click(screen.getByText("money"));
    expect(onSelect).toHaveBeenCalledWith("money");
  });

  it("filters definitions by search", async () => {
    const user = userEvent.setup();
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("money")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search definitions...");
    await user.type(searchInput, "temporal");

    expect(screen.getByText("temporal-rule")).toBeInTheDocument();
    expect(screen.queryByText("money")).not.toBeInTheDocument();
    expect(screen.queryByText("percentage")).not.toBeInTheDocument();
  });

  it("shows empty search state", async () => {
    const user = userEvent.setup();
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("money")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search definitions...");
    await user.type(searchInput, "nonexistent");

    expect(
      screen.getByText("No definitions match your search"),
    ).toBeInTheDocument();
  });

  it("shows error when loading fails", async () => {
    mockListSharedDefinitions.mockRejectedValue(
      new Error("Connection failed"),
    );
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Connection failed")).toBeInTheDocument();
    });
  });

  it("renders info box about shared definitions", async () => {
    mockListSharedDefinitions.mockResolvedValue(mockDefs);
    render(<DefsBrowser selected={null} onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Shared definitions/),
      ).toBeInTheDocument();
    });
  });
});
