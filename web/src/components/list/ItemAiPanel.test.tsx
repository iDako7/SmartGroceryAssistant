import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ItemAiPanel from './ItemAiPanel';

vi.mock('../../lib/api', () => ({
  ai: {
    itemInfo: vi.fn(),
    alternatives: vi.fn(),
  },
}));

import { ai } from '../../lib/api';

describe('ItemAiPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', () => {
    vi.mocked(ai.itemInfo).mockReturnValue(new Promise(() => {})); // never resolves
    render(<ItemAiPanel itemName="Milk" feature="info" onClose={vi.fn()} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders info results after fetch', async () => {
    vi.mocked(ai.itemInfo).mockResolvedValue({
      category: 'Dairy',
      typical_unit: 'gallon',
      storage_tip: 'Refrigerate at 4°C',
      nutrition_note: 'Good source of calcium',
    } as never);

    render(<ItemAiPanel itemName="Milk" feature="info" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Dairy')).toBeInTheDocument();
    });
    expect(screen.getByText('gallon')).toBeInTheDocument();
    expect(screen.getByText('Refrigerate at 4°C')).toBeInTheDocument();
    expect(screen.getByText('Good source of calcium')).toBeInTheDocument();
  });

  it('renders alternatives results after fetch', async () => {
    vi.mocked(ai.alternatives).mockResolvedValue({
      alternatives: [
        { name: 'Oat Milk', reason: 'Dairy-free, creamy' },
        { name: 'Almond Milk', reason: 'Lower calorie' },
      ],
    } as never);

    render(<ItemAiPanel itemName="Milk" feature="alternatives" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Oat Milk')).toBeInTheDocument();
    });
    expect(screen.getByText('Dairy-free, creamy')).toBeInTheDocument();
    expect(screen.getByText('Almond Milk')).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    vi.mocked(ai.itemInfo).mockRejectedValue(new Error('Network error'));

    render(<ItemAiPanel itemName="Milk" feature="info" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(ai.itemInfo).mockResolvedValue({
      category: '',
      typical_unit: '',
      storage_tip: '',
      nutrition_note: '',
    } as never);

    const onClose = vi.fn();
    render(<ItemAiPanel itemName="Milk" feature="info" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
    });

    screen.getByText('Close').click();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows correct header for each feature', () => {
    vi.mocked(ai.itemInfo).mockReturnValue(new Promise(() => {}));

    const { unmount } = render(<ItemAiPanel itemName="Milk" feature="info" onClose={vi.fn()} />);
    expect(screen.getByText('Item Info')).toBeInTheDocument();
    unmount();

    vi.mocked(ai.alternatives).mockReturnValue(new Promise(() => {}));
    const { unmount: unmount2 } = render(
      <ItemAiPanel itemName="Milk" feature="alternatives" onClose={vi.fn()} />
    );
    expect(screen.getByText('Alternatives')).toBeInTheDocument();
    unmount2();

    vi.mocked(ai.itemInfo).mockReturnValue(new Promise(() => {}));
    render(<ItemAiPanel itemName="Milk" feature="inspire" onClose={vi.fn()} />);
    expect(screen.getByText('Inspire')).toBeInTheDocument();
  });

  it('shows empty state when alternatives returns no alts', async () => {
    vi.mocked(ai.alternatives).mockResolvedValue({ alternatives: [] } as never);

    render(<ItemAiPanel itemName="Milk" feature="alternatives" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No alternatives found.')).toBeInTheDocument();
    });
  });
});
