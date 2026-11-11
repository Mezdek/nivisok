/**
 * @module ui/selectionManager
 * Manages the set of currently selected note IDs for batch operations.
 *
 * Consumers register an `onChange` callback to react to selection changes
 * (e.g. enabling/disabling batch action buttons). The manager is exported
 * as a singleton because selection state is global to the panel.
 */

type ChangeCallback = (selected: ReadonlySet<string>) => void;

class SelectionManager {
  private readonly selected = new Set<string>();
  private readonly listeners: ChangeCallback[] = [];

  /**
   * Adds or removes an id from the selection and notifies listeners.
   *
   * @param id      - Note UUID to toggle.
   * @param checked - `true` to select, `false` to deselect.
   */
  toggle(id: string, checked: boolean): void {
    if (checked) this.selected.add(id);
    else this.selected.delete(id);
    this.notify();
  }

  /** Clears all selections and notifies listeners. */
  clear(): void {
    this.selected.clear();
    this.notify();
  }

  /** Returns a read-only snapshot of the currently selected ids. */
  getSelected(): ReadonlySet<string> {
    return this.selected;
  }

  /**
   * Registers a callback to be called whenever the selection changes.
   *
   * @param cb - Callback receiving the updated selection set.
   */
  onChange(cb: ChangeCallback): void {
    this.listeners.push(cb);
  }

  private notify(): void {
    // Snapshot so listeners can't mutate internal state
    const snap = new Set(this.selected) as ReadonlySet<string>;
    for (const cb of this.listeners) cb(snap);
  }
}

export const selectionManager = new SelectionManager();
