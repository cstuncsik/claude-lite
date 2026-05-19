import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useChatsStore } from './store/chats';
import { onStreamChunk } from './lib/tauri';

// Mock the dependencies
jest.mock('./lib/tauri', () => ({
  onStreamChunk: jest.fn(),
}));

jest.mock('./store/chats', () => ({
  useChatsStore: jest.fn(),
}));

// Mock the components but export them properly
jest.mock('./components/Sidebar', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="sidebar">Sidebar</div>,
  };
});

jest.mock('./components/ChatView', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="chatview">ChatView</div>,
  };
});

describe('App', () => {
  const mockAppendStreamDelta = jest.fn();
  const mockFinalizeStreamedMessage = jest.fn();

  beforeEach(() => {
    (useChatsStore as jest.Mock).mockReturnValue({
      appendStreamDelta: mockAppendStreamDelta,
      finalizeStreamedMessage: mockFinalizeStreamedMessage,
    });
    
    (onStreamChunk as jest.Mock).mockReturnValue(Promise.resolve(jest.fn()));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('chatview')).toBeInTheDocument();
  });

  it('has the correct layout classes', () => {
    render(<App />);

    // The flex class should be on the main app container
    const flexElement = screen.getByTestId('sidebar').parentElement;
    expect(flexElement).toHaveClass('flex');
  });

  it('sets up stream chunk listener on mount', async () => {
    const mockUnlisten = jest.fn();
    (onStreamChunk as jest.Mock).mockReturnValue(Promise.resolve(mockUnlisten));

    render(<App />);

    await waitFor(() => {
      expect(onStreamChunk).toHaveBeenCalledTimes(1);
    });
  });

  it('calls appendStreamDelta when receiving a stream chunk', async () => {
    const mockUnlisten = jest.fn();
    (onStreamChunk as jest.Mock).mockReturnValue(Promise.resolve(mockUnlisten));

    render(<App />);

    // Simulate calling the callback with a delta chunk
    const onChunkCallback = (onStreamChunk as jest.Mock).mock.calls[0][0];
    const mockChunk = { done: false, delta: 'test delta' };

    onChunkCallback(mockChunk);

    expect(mockAppendStreamDelta).toHaveBeenCalledWith('test delta');
    expect(mockFinalizeStreamedMessage).not.toHaveBeenCalled();
  });

  it('calls finalizeStreamedMessage when receiving a done chunk', async () => {
    const mockUnlisten = jest.fn();
    (onStreamChunk as jest.Mock).mockReturnValue(Promise.resolve(mockUnlisten));

    render(<App />);

    // Simulate calling the callback with a done chunk
    const onChunkCallback = (onStreamChunk as jest.Mock).mock.calls[0][0];
    const mockChunk = { done: true, delta: '' };

    onChunkCallback(mockChunk);

    expect(mockFinalizeStreamedMessage).toHaveBeenCalledTimes(1);
    expect(mockAppendStreamDelta).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', async () => {
    const mockUnlisten = jest.fn();
    (onStreamChunk as jest.Mock).mockReturnValue(Promise.resolve(mockUnlisten));

    const { unmount } = render(<App />);

    unmount();

    await waitFor(() => {
      expect(mockUnlisten).toHaveBeenCalledTimes(1);
    });
  });
});