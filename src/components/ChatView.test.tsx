import { render, screen } from '@testing-library/react';
import ChatView from './ChatView';
import { useChatsStore } from '../store/chats';
import React from 'react';

// Mock the store
jest.mock('../store/chats', () => ({
  useChatsStore: jest.fn(),
}));

const mockUseChatsStore = useChatsStore as jest.MockedFunction<typeof useChatsStore>;

// Mock the MessageInput component
jest.mock('./MessageInput', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="message-input" />,
  };
});

// Mock ReactMarkdown for different content types
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="react-markdown">{children}</div>
  };
});

// Mock highlight.js
jest.mock('highlight.js', () => ({
  highlightElement: jest.fn(),
}));

// Mock the CSS import
jest.mock('highlight.js/styles/github-dark.css', () => ({}));

describe('ChatView', () => {
  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock scrollIntoView to prevent errors in test environment
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders welcome screen when no current chat exists', () => {
    // Mock store to return no current chat
    mockUseChatsStore.mockReturnValue({
      currentChat: null,
      messages: [],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check if welcome elements are present
    expect(screen.getByText('Welcome to Claude Lite')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation by creating a new chat or selecting an existing one')).toBeInTheDocument();
    // Message input is only rendered when there's a current chat, so it shouldn't be present here
    expect(screen.queryByTestId('message-input')).not.toBeInTheDocument();
  });

  it('renders messages when current chat exists', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello, Claude!',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hello! How can I assist you today?',
      },
    ];

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: mockMessages,
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check if messages are rendered
    expect(screen.getByText('Hello, Claude!')).toBeInTheDocument();
    expect(screen.getByText('Hello! How can I assist you today?')).toBeInTheDocument();

    // Check if user and assistant labels are present
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('displays streaming content when isSending is true', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello?',
      },
    ];

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: mockMessages,
      streamingContent: 'Currently typing...',
      isThinking: false,
      isSending: true,
    });

    render(<ChatView />);

    // Check if streaming content is shown
    expect(screen.getByText('Currently typing...')).toBeInTheDocument();
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });

  it('displays thinking indicator when isThinking is true', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Can you think about this?',
      },
    ];

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: mockMessages,
      streamingContent: '',
      isThinking: true,
      isSending: true,
    });

    render(<ChatView />);

    // Check if thinking indicator is shown
    expect(screen.getByText('thinking...')).toBeInTheDocument();
  });

  it('displays user message with extended thinking badge', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Test message',
      extended_thinking: true,
    };

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: [mockMessage],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check if extended thinking badge is shown
    expect(screen.getByText('Extended thinking')).toBeInTheDocument();
  });

  it('displays user message with model info', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Test message',
      model: 'claude-sonnet-20250929',
    };

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: [mockMessage],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check if model info is shown (should show "sonnet")
    expect(screen.getByText('sonnet')).toBeInTheDocument();
  });

  it('displays images in messages', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Check out this image!',
      images: [{ data: 'data', media_type: 'image/jpeg' }],
    };

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: [mockMessage],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check if image is rendered
    expect(screen.getByAltText('Attached')).toBeInTheDocument();
  });

  it('handles invalid image data gracefully', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Test message',
      images: "invalid json string", // Invalid JSON should be handled gracefully
    };

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: [mockMessage],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    // Mock console.error to avoid logging expected errors during tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // This should not throw an error
    expect(() => {
      render(<ChatView />);
    }).not.toThrow();

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('displays documents in messages', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Check out this document!',
      documents: [{ name: 'document.pdf', content: 'test' }],
    };

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: [mockMessage],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check if document name is shown
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('handles invalid document data gracefully', () => {
    const mockMessage = {
      id: '1',
      role: 'user',
      content: 'Test message',
      documents: "invalid json string", // Invalid JSON should be handled gracefully
    };

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: [mockMessage],
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    // Mock console.error to avoid logging expected errors during tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // This should not throw an error
    expect(() => {
      render(<ChatView />);
    }).not.toThrow();

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('renders different message styles for user vs assistant', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user',
        content: 'User message',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Assistant message',
      },
    ];

    mockUseChatsStore.mockReturnValue({
      currentChat: { id: 'chat1', title: 'Test Chat' },
      messages: mockMessages,
      streamingContent: '',
      isThinking: false,
      isSending: false,
    });

    render(<ChatView />);

    // Check that both user and assistant messages exist with proper styling
    expect(screen.getByText('User message')).toBeInTheDocument();
    expect(screen.getByText('Assistant message')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument(); // User label
    expect(screen.getByText('Claude')).toBeInTheDocument(); // Assistant label
  });
});