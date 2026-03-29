import { act, render, screen } from '@testing-library/react';
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

  it('renders error state on fetch failure', async () => {
    vi.mocked(ai.itemInfo).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<ItemAiPanel itemName="Milk" feature="info" onClose={vi.fn()} />);
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(ai.itemInfo).mockResolvedValue({} as never);

    const onClose = vi.fn();
    await act(async () => {
      render(<ItemAiPanel itemName="Milk" feature="info" onClose={onClose} />);
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

  it('calls correct API method for each feature', async () => {
    vi.mocked(ai.itemInfo).mockResolvedValue({} as never);
    await act(async () => {
      render(<ItemAiPanel itemName="Milk" feature="info" onClose={vi.fn()} />);
    });
    expect(ai.itemInfo).toHaveBeenCalledWith('Milk');
  });

  it('calls alternatives API for alternatives feature', async () => {
    vi.mocked(ai.alternatives).mockResolvedValue({} as never);
    await act(async () => {
      render(<ItemAiPanel itemName="Eggs" feature="alternatives" onClose={vi.fn()} />);
    });
    expect(ai.alternatives).toHaveBeenCalledWith('Eggs');
  });
});
