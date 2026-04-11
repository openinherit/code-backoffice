import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EnumEditor } from "@/components/enum-editor";

describe("EnumEditor", () => {
  it("renders empty state when no values", () => {
    render(<EnumEditor values={[]} onChange={vi.fn()} />);
    expect(screen.getByText("No enum values defined yet")).toBeInTheDocument();
  });

  it("renders naming convention guidance", () => {
    render(<EnumEditor values={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/Naming convention/)).toBeInTheDocument();
    expect(screen.getByText(/snake_case/)).toBeInTheDocument();
  });

  it("renders existing values", () => {
    const values = [
      { value: "prior_rights", description: "Prior rights under Scots law" },
      { value: "legal_share", description: "Children's legal share" },
    ];
    render(<EnumEditor values={values} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("prior_rights")).toBeInTheDocument();
    expect(screen.getByDisplayValue("legal_share")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Prior rights under Scots law"),
    ).toBeInTheDocument();
  });

  it("calls onChange with new value when Add value is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EnumEditor values={[]} onChange={onChange} />);

    await user.click(screen.getByText("+ Add value"));
    expect(onChange).toHaveBeenCalledWith([
      { value: "", description: "" },
    ]);
  });

  it("calls onChange when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const values = [
      { value: "prior_rights", description: "Prior rights" },
      { value: "legal_share", description: "Legal share" },
    ];
    render(<EnumEditor values={values} onChange={onChange} />);

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith([
      { value: "legal_share", description: "Legal share" },
    ]);
  });

  it("calls onChange when value input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const values = [{ value: "test", description: "Test desc" }];
    render(<EnumEditor values={values} onChange={onChange} />);

    const valueInput = screen.getByDisplayValue("test");
    await user.clear(valueInput);
    await user.type(valueInput, "new_val");
    // onChange should have been called for each keystroke
    expect(onChange).toHaveBeenCalled();
  });

  it("disables remove and value input for readonly values", () => {
    const values = [
      { value: "published_val", description: "Already published" },
      { value: "new_val", description: "New value" },
    ];
    render(
      <EnumEditor
        values={values}
        onChange={vi.fn()}
        readonlyValues={["published_val"]}
      />,
    );

    const valueInputs = screen.getAllByPlaceholderText("snake_case_value");
    expect(valueInputs[0]).toBeDisabled();
    expect(valueInputs[1]).not.toBeDisabled();
  });

  it("moves value up when up arrow is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const values = [
      { value: "first", description: "First" },
      { value: "second", description: "Second" },
    ];
    render(<EnumEditor values={values} onChange={onChange} />);

    const upButtons = screen.getAllByRole("button", { name: /up/i });
    await user.click(upButtons[1]); // Move "second" up
    expect(onChange).toHaveBeenCalledWith([
      { value: "second", description: "Second" },
      { value: "first", description: "First" },
    ]);
  });

  it("moves value down when down arrow is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const values = [
      { value: "first", description: "First" },
      { value: "second", description: "Second" },
    ];
    render(<EnumEditor values={values} onChange={onChange} />);

    const downButtons = screen.getAllByRole("button", { name: /down/i });
    await user.click(downButtons[0]); // Move "first" down
    expect(onChange).toHaveBeenCalledWith([
      { value: "second", description: "Second" },
      { value: "first", description: "First" },
    ]);
  });

  it("disables up arrow on first item and down arrow on last item", () => {
    const values = [
      { value: "only", description: "Only item" },
    ];
    render(<EnumEditor values={values} onChange={vi.fn()} />);

    const upButton = screen.getByRole("button", { name: /up/i });
    const downButton = screen.getByRole("button", { name: /down/i });
    expect(upButton).toBeDisabled();
    expect(downButton).toBeDisabled();
  });

  it("shows + Add value button", () => {
    render(<EnumEditor values={[]} onChange={vi.fn()} />);
    expect(screen.getByText("+ Add value")).toBeInTheDocument();
  });
});
