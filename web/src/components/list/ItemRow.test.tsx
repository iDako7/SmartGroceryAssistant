import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '../../types';
import ItemRow from './ItemRow';

vi.mock('../../lib/api', () => ({
  lists: {
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

import { lists } from '../../lib/api';

const baseItem: Item = {
  id: 'item-1',
  section_id: 'section-1',
  name_en: 'Milk',
  quantity: 1,
  checked: false,
};

function renderItem(
  overrides: Partial<Item> = {},
  handlers?: Partial<Parameters<typeof ItemRow>[0]>
) {
  const item = { ...baseItem, ...overrides };
  const onSelect = vi.fn();
  const onUpdated = vi.fn();
  const onDeleted = vi.fn();
  render(
    <ItemRow
      item={item}
      selected={false}
      onSelect={onSelect}
      onUpdated={onUpdated}
      onDeleted={onDeleted}
      {...handlers}
    />
  );
  return { onSelect, onUpdated, onDeleted };
}

describe('ItemRow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders item name', () => {
    renderItem();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('renders secondary name when present', () => {
    renderItem({ name_secondary: '牛奶' });
    expect(screen.getByText('牛奶')).toBeInTheDocument();
  });

  it('shows quantity badge with correct value', () => {
    renderItem({ quantity: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies line-through style when checked', () => {
    renderItem({ checked: true });
    const nameEl = screen.getByText('Milk');
    expect(nameEl.className).toMatch(/line-through/);
  });

  it('calls onSelect when row is clicked', () => {
    const { onSelect } = renderItem();
    // Click the inner div (row content), not the li wrapper
    const row = screen.getByRole('listitem').firstElementChild as HTMLElement;
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith(baseItem);
  });

  it('calls onUpdated after toggling checkbox', async () => {
    const updated = { ...baseItem, checked: true };
    vi.mocked(lists.updateItem).mockResolvedValue(updated as never);

    const { onUpdated } = renderItem();
    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(lists.updateItem).toHaveBeenCalledWith('item-1', { checked: true });
  });

  it('calls onDeleted after clicking delete button', async () => {
    vi.mocked(lists.deleteItem).mockResolvedValue(undefined as never);

    const { onDeleted } = renderItem();
    const deleteBtn = screen.getByTitle('Delete');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('item-1'));
    expect(lists.deleteItem).toHaveBeenCalledWith('item-1');
  });

  it('enters edit mode when edit button clicked', async () => {
    renderItem();
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('saves edits and calls onUpdated', async () => {
    const updated = { ...baseItem, name_en: 'Whole Milk' };
    vi.mocked(lists.updateItem).mockResolvedValue(updated as never);

    const { onUpdated } = renderItem();
    fireEvent.click(screen.getByTitle('Edit'));

    const nameInput = screen.getByDisplayValue('Milk');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Whole Milk');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
  });

  it('cancels edit without saving', () => {
    renderItem();
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('has selected styling when selected prop is true', () => {
    const item = baseItem;
    const { rerender } = render(
      <ItemRow
        item={item}
        selected={false}
        onSelect={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    // Selected styling is on the inner div, not the li
    const row = screen.getByRole('listitem').firstElementChild as HTMLElement;
    expect(row.className).not.toMatch(/emerald/);

    rerender(
      <ItemRow
        item={item}
        selected={true}
        onSelect={vi.fn()}
        onUpdated={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    expect(row.className).toMatch(/emerald/);
  });
});
