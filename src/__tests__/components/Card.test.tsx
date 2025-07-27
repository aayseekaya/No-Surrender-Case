/// <reference types="jest" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import Card from '@/components/Card';
import { Card as CardType } from '@/types';

// Mock fetch
global.fetch = jest.fn();

const mockCard: CardType = {
  id: 'test-card',
  name: 'Test Card',
  description: 'Test description',
  level: 1,
  progress: 0,
  image: '/images/test.png',
  type: 'uzun_kilic',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProps = {
  card: mockCard,
  onProgress: jest.fn(),
  onLevelUp: jest.fn(),
  currentEnergy: 100,
};

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders card with correct information', () => {
    render(<Card {...mockProps} />);
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Gümüş Diş - Sade, keskin bir savaş kılıcı.')).toBeInTheDocument();
    expect(screen.getByText('Seviye 1')).toBeInTheDocument();
    expect(screen.getByText('%0')).toBeInTheDocument();
    expect(screen.getByText('-1 Geliştir')).toBeInTheDocument();
  });

  it('shows progress bar correctly', () => {
    const cardWithProgress = { ...mockCard, progress: 50 };
    render(<Card {...mockProps} card={cardWithProgress} />);
    
    expect(screen.getByText('%50')).toBeInTheDocument();
  });

  it('shows level up button when progress is 100%', () => {
    const cardReadyForLevelUp = { ...mockCard, progress: 100 };
    render(<Card {...mockProps} card={cardReadyForLevelUp} />);
    
    expect(screen.getByText('Yükselt')).toBeInTheDocument();
    expect(screen.queryByText('-1 Geliştir')).not.toBeInTheDocument();
  });

  it('shows max level message when card is at level 3', () => {
    const maxLevelCard = { ...mockCard, level: 3 };
    render(<Card {...mockProps} card={maxLevelCard} />);
    
    expect(screen.getByText('Maksimum Seviye')).toBeInTheDocument();
  });

  it('disables button when energy is insufficient', () => {
    render(<Card {...mockProps} currentEnergy={0} />);
    
    const button = screen.getByText('-1 Geliştir').closest('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Yetersiz enerji')).toBeInTheDocument();
  });

  it('calls onProgress when clicking develop button', async () => {
    render(<Card {...mockProps} />);
    
    const button = screen.getByText('-1 Geliştir');
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(mockProps.onProgress).toHaveBeenCalledWith('test-card');
    });
  });

  it('calls onLevelUp when clicking level up button', async () => {
    const cardReadyForLevelUp = { ...mockCard, progress: 100 };
    render(<Card {...mockProps} card={cardReadyForLevelUp} />);
    
    const button = screen.getByText('Yükselt');
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(mockProps.onLevelUp).toHaveBeenCalledWith('test-card');
    });
  });

  it('shows quick progress button when card is not ready for level up', () => {
    render(<Card {...mockProps} />);
    
    expect(screen.getByText('Hızlı Geliştir')).toBeInTheDocument();
  });

  it('hides quick progress button when card is ready for level up', () => {
    const cardReadyForLevelUp = { ...mockCard, progress: 100 };
    render(<Card {...mockProps} card={cardReadyForLevelUp} />);
    
    expect(screen.queryByText('Hızlı Geliştir')).not.toBeInTheDocument();
  });

  it('hides quick progress button when card is at max level', () => {
    const maxLevelCard = { ...mockCard, level: 3 };
    render(<Card {...mockProps} card={maxLevelCard} />);
    
    expect(screen.queryByText('Hızlı Geliştir')).not.toBeInTheDocument();
  });

  it('calls batch API when clicking quick progress button', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, progress: 20, energy: 90 }),
    });

    render(<Card {...mockProps} />);
    
    const quickButton = screen.getByText('Hızlı Geliştir');
    await act(async () => {
      fireEvent.click(quickButton);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/batch-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
        },
        body: JSON.stringify({ cardId: 'test-card', clicks: 10 }),
      });
    });
  });

  it('calculates correct clicks for quick progress', async () => {
    const cardWithProgress = { ...mockCard, progress: 80 };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, progress: 100, energy: 90 }),
    });

    render(<Card {...mockProps} card={cardWithProgress} currentEnergy={20} />);
    
    const quickButton = screen.getByText('Hızlı Geliştir');
    await act(async () => {
      fireEvent.click(quickButton);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/batch-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
        },
        body: JSON.stringify({ cardId: 'test-card', clicks: 10 }), // 20% needed = 10 clicks, but limited by energy
      });
    });
  });

  it('shows auto-click instructions', () => {
    render(<Card {...mockProps} />);
    
    expect(screen.getByText('Basılı tut: Otomatik geliştir')).toBeInTheDocument();
  });

  it('hides auto-click instructions when card is ready for level up', () => {
    const cardReadyForLevelUp = { ...mockCard, progress: 100 };
    render(<Card {...mockProps} card={cardReadyForLevelUp} />);
    
    expect(screen.queryByText('Basılı tut: Otomatik geliştir')).not.toBeInTheDocument();
  });

  it('hides auto-click instructions when card is at max level', () => {
    const maxLevelCard = { ...mockCard, level: 3 };
    render(<Card {...mockProps} card={maxLevelCard} />);
    
    expect(screen.queryByText('Basılı tut: Otomatik geliştir')).not.toBeInTheDocument();
  });

  it('shows loading state when button is clicked', async () => {
    // Mock onProgress to delay response
    const mockOnProgress = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<Card {...mockProps} onProgress={mockOnProgress} />);
    
    const button = screen.getByText('-1 Geliştir');
    await act(async () => {
      fireEvent.click(button);
    });
    
    // Check for loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('prevents multiple clicks while loading', async () => {
    // Mock onProgress to delay response
    const mockOnProgress = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<Card {...mockProps} onProgress={mockOnProgress} />);
    
    const button = screen.getByText('-1 Geliştir');
    
    // First click
    await act(async () => {
      fireEvent.click(button);
    });
    
    // Wait a bit for loading state to be set
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Second click should be ignored
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(mockOnProgress).toHaveBeenCalledTimes(1);
    });
  });

  it('updates image based on card level', () => {
    const level2Card = { ...mockCard, level: 2, image: '/images/uzun_kilic_2.png' };
    render(<Card {...mockProps} card={level2Card} />);
    
    const image = screen.getByAltText('Test Card');
    expect(image).toHaveAttribute('src', '/images/uzun_kilic_2.png');
  });

  it('handles auto-click functionality', async () => {
    jest.useFakeTimers();
    
    render(<Card {...mockProps} />);
    
    const button = screen.getByText('-1 Geliştir');
    
    // Start auto-click
    await act(async () => {
      fireEvent.mouseDown(button);
    });
    
    // Fast-forward time to trigger auto-click
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(mockProps.onProgress).toHaveBeenCalled();
    });
    
    // Stop auto-click
    await act(async () => {
      fireEvent.mouseUp(button);
    });
    
    jest.useRealTimers();
  });

  it('stops auto-click when mouse leaves button', async () => {
    jest.useFakeTimers();
    
    render(<Card {...mockProps} />);
    
    const button = screen.getByText('-1 Geliştir');
    
    // Start auto-click
    await act(async () => {
      fireEvent.mouseDown(button);
    });
    
    // Fast-forward time to trigger auto-click
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(mockProps.onProgress).toHaveBeenCalled();
    });
    
    // Stop auto-click by mouse leave
    await act(async () => {
      fireEvent.mouseLeave(button);
    });
    
    // Clear previous calls
    mockProps.onProgress.mockClear();
    
    // Fast-forward time again
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Should not call onProgress again
    expect(mockProps.onProgress).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });
}); 