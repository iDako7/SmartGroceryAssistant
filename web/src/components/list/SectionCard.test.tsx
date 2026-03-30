import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item, Section } from '../../types';
import SectionCard from './SectionCard';

vi.mock('../../lib/api', () => ({
  lists: {
    createItem: vi.fn(),
    updateSection: vi.fn(),
  },
}));

import { lists } from '../../lib/api';

const baseSection: Section = {
  id: 'section-1',
  user_id: 'user-1',
  name: 'Produce',
  position: 0,
};

const baseItems: Item[] = [
  { id: 'item-1', section_id: 'section-1', name_en: 'Apples', quantity: 1, checked: false },
  { id: 'item-2', section_id: 'section-1', name_en: 'Bananas', quantity: 2, checked: true },
];

function renderSection(
  section = baseSection,
  items = baseItems,
  handlers: Partial<React.ComponentProps<typeof SectionCard>> = {}
) {
  const defaults = {
    onSelectItem: vi.fn(),
    onItemUpdated: vi.fn(),
    onItemDeleted: vi.fn(),
    onItemCreated: vi.fn(),
    onSectionDeleted: vi.fn(),
    onSectionUpdated: vi.fn(),
    selectedItem: null,
  };
  render(<SectionCard section={section} items={items} {...defaults} {...handlers} />);
  return defaults;
}

describe('SectionCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the section name', () => {
    renderSection();
    expect(screen.getByText('Produce')).toBeInTheDocument();
  });

  it('shows done/total counter', () => {
    renderSection();
    // 1 checked out of 2 total
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('renders all items by default', () => {
    renderSection();
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Bananas')).toBeInTheDocument();
  });

  it('collapses and hides items when collapse button clicked', () => {
    renderSection();
    // Collapse button is the first button in the header
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // collapse toggle
    expect(screen.queryByText('Apples')).toBeNull();
    expect(screen.queryByText('Bananas')).toBeNull();
  });

  it('expands again when collapse button clicked twice', () => {
    renderSection();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // collapse
    const collapsedButtons = screen.getAllByRole('button');
    fireEvent.click(collapsedButtons[0]); // expand
    expect(screen.getByText('Apples')).toBeInTheDocument();
  });

  it('calls onSectionDeleted when delete button clicked', () => {
    const handlers = renderSection();
    fireEvent.click(screen.getByTitle('Delete section'));
    expect(handlers.onSectionDeleted).toHaveBeenCalledWith('section-1');
  });

  it('enters edit mode for section name on click', () => {
    renderSection();
    fireEvent.click(screen.getByText('Produce'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('saves section name on Enter key', async () => {
    const updated = { ...baseSection, name: 'Fruits' };
    vi.mocked(lists.updateSection).mockResolvedValue(updated as never);

    const handlers = renderSection();
    fireEvent.click(screen.getByText('Produce'));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Fruits');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(handlers.onSectionUpdated).toHaveBeenCalledWith(updated));
  });

  it('does not save if name unchanged', async () => {
    renderSection();
    fireEvent.click(screen.getByText('Produce'));
    const input = screen.getByRole('textbox');
    // Don't change the name, just blur
    fireEvent.blur(input);
    expect(lists.updateSection).not.toHaveBeenCalled();
  });

  it('shows add item form when "+ Add item" is clicked', () => {
    renderSection();
    fireEvent.click(screen.getByText('Add item'));
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('creates item on form submit', async () => {
    const newItem: Item = {
      id: 'item-3',
      section_id: 'section-1',
      name_en: 'Grapes',
      quantity: 1,
      checked: false,
    };
    vi.mocked(lists.createItem).mockResolvedValue(newItem as never);

    const handlers = renderSection();
    fireEvent.click(screen.getByText('Add item'));
    const input = screen.getByPlaceholderText('Item name');
    await userEvent.type(input, 'Grapes');
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(handlers.onItemCreated).toHaveBeenCalledWith('section-1', newItem));
    expect(lists.createItem).toHaveBeenCalledWith('section-1', 'Grapes');
  });

  it('does not create item when name is empty', async () => {
    renderSection();
    fireEvent.click(screen.getByText('Add item'));
    fireEvent.submit(screen.getByPlaceholderText('Item name').closest('form')!);
    expect(lists.createItem).not.toHaveBeenCalled();
  });

  it('cancels add item form', () => {
    renderSection();
    fireEvent.click(screen.getByText('Add item'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Add item')).toBeInTheDocument();
  });
});
