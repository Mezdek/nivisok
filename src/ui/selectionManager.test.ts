/**
 * Tests for selectionManager.
 *
 * The singleton has no way to remove listeners, so ones registered in earlier
 * tests persist. This is harmless: every listener is a silent `vi.fn()` and
 * each test asserts on its own mock.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectionManager } from "./selectionManager";

// Reset selection state before every test.
beforeEach(() => {
  selectionManager.clear();
});

// toggle

describe("toggle", () => {
  it("adds an id when checked is true", () => {
    selectionManager.toggle("a", true);
    expect(selectionManager.getSelected().has("a")).toBe(true);
  });

  it("removes an id when checked is false", () => {
    selectionManager.toggle("a", true);
    selectionManager.toggle("a", false);
    expect(selectionManager.getSelected().has("a")).toBe(false);
  });

  it("is idempotent for repeated adds", () => {
    selectionManager.toggle("a", true);
    selectionManager.toggle("a", true);
    expect(selectionManager.getSelected().size).toBe(1);
  });

  it("is idempotent for removing a non-existent id", () => {
    selectionManager.toggle("a", false);
    expect(selectionManager.getSelected().size).toBe(0);
  });

  it("can hold multiple ids independently", () => {
    selectionManager.toggle("a", true);
    selectionManager.toggle("b", true);
    selectionManager.toggle("c", true);
    expect(selectionManager.getSelected().size).toBe(3);
  });

  it("removing one id does not affect others", () => {
    selectionManager.toggle("a", true);
    selectionManager.toggle("b", true);
    selectionManager.toggle("a", false);
    expect(selectionManager.getSelected().has("b")).toBe(true);
    expect(selectionManager.getSelected().size).toBe(1);
  });
});

// clear

describe("clear", () => {
  it("removes all selected ids", () => {
    selectionManager.toggle("a", true);
    selectionManager.toggle("b", true);
    selectionManager.clear();
    expect(selectionManager.getSelected().size).toBe(0);
  });

  it("is a no-op on an already empty selection", () => {
    selectionManager.clear();
    expect(selectionManager.getSelected().size).toBe(0);
  });
});

// getSelected

describe("getSelected", () => {
  it("reflects the current selection", () => {
    selectionManager.toggle("x", true);
    selectionManager.toggle("y", true);
    const selected = selectionManager.getSelected();
    expect(selected.has("x")).toBe(true);
    expect(selected.has("y")).toBe(true);
  });

  it("returns an empty set when nothing is selected", () => {
    expect(selectionManager.getSelected().size).toBe(0);
  });
});

// onChange

describe("onChange", () => {
  it("calls the callback when toggle is called", () => {
    const cb = vi.fn();
    selectionManager.onChange(cb);
    selectionManager.toggle("a", true);
    expect(cb).toHaveBeenCalled();
  });

  it("calls the callback when clear is called", () => {
    selectionManager.toggle("a", true);
    const cb = vi.fn();
    selectionManager.onChange(cb);
    selectionManager.clear();
    expect(cb).toHaveBeenCalled();
  });

  it("passes a set containing the newly added id", () => {
    const cb = vi.fn();
    selectionManager.onChange(cb);
    selectionManager.toggle("a", true);
    const received: ReadonlySet<string> =
      cb.mock.calls[cb.mock.calls.length - 1][0];
    expect(received.has("a")).toBe(true);
  });

  it("passes an empty set after clear", () => {
    selectionManager.toggle("a", true);
    const cb = vi.fn();
    selectionManager.onChange(cb);
    selectionManager.clear();
    const received: ReadonlySet<string> = cb.mock.calls[0][0];
    expect(received.size).toBe(0);
  });

  it("notifies multiple listeners registered in the same test", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    selectionManager.onChange(cb1);
    selectionManager.onChange(cb2);
    selectionManager.toggle("a", true);
    expect(cb1).toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });
});

// Snapshot isolation

describe("snapshot isolation", () => {
  it("listeners receive a snapshot, not a live reference to the internal set", () => {
    let captured: ReadonlySet<string> | null = null;
    selectionManager.onChange((s) => {
      captured = s;
    });

    selectionManager.toggle("a", true);

    // Mutating the snapshot should not affect internal state
    (captured as unknown as Set<string>).add("injected");
    expect(selectionManager.getSelected().has("injected")).toBe(false);
  });

  it("each notification produces a fresh snapshot", () => {
    const snapshots: ReadonlySet<string>[] = [];
    selectionManager.onChange((s) => snapshots.push(s));

    selectionManager.toggle("a", true);
    selectionManager.toggle("b", true);

    // The two snapshots must be distinct objects
    expect(snapshots[snapshots.length - 2]).not.toBe(
      snapshots[snapshots.length - 1],
    );
    // First snapshot only has "a"
    expect(snapshots[snapshots.length - 2].has("b")).toBe(false);
    // Second snapshot has both
    expect(snapshots[snapshots.length - 1].has("a")).toBe(true);
    expect(snapshots[snapshots.length - 1].has("b")).toBe(true);
  });
});
