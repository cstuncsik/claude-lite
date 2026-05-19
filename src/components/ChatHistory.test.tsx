import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, jest } from '@jest/globals';
import ChatHistory from './ChatHistory';
import { useChatsStore } from '../store/chats';
import { useProjectsStore } from '../store/projects';

// Mock the stores
jest.mock('../store/chats');
jest.mock('../store/projects');

describe('ChatHistory', () => {
  const mockSelectChat = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: [],
      selectChat: mockSelectChat,
    });

    (useProjectsStore as jest.MockedFunction<typeof useProjectsStore>).mockReturnValue({
      projects: [],
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ChatHistory isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Your chat history/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search your chats/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument(); // The close button is the only button in the header
  });

  it('displays empty state when no chats are present', () => {
    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: [],
      selectChat: mockSelectChat,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('No chats yet')).toBeInTheDocument();
  });

  it('displays chats when available', () => {
    const mockChats = [
      {
        id: '1',
        title: 'Test Chat 1',
        updated_at: new Date().toISOString(),
        project_id: undefined
      },
      {
        id: '2',
        title: 'Test Chat 2', 
        updated_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        project_id: undefined
      }
    ];

    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: mockChats,
      selectChat: mockSelectChat,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
    expect(screen.getByText('2 chats with Claude')).toBeInTheDocument();
  });

  it('filters chats based on search query', () => {
    const mockChats = [
      {
        id: '1',
        title: 'Hello World Chat',
        updated_at: new Date().toISOString(),
        project_id: undefined
      },
      {
        id: '2',
        title: 'Another Chat',
        updated_at: new Date().toISOString(),
        project_id: undefined
      }
    ];

    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: mockChats,
      selectChat: mockSelectChat,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    // Initially both chats should be visible
    expect(screen.getByText('Hello World Chat')).toBeInTheDocument();
    expect(screen.getByText('Another Chat')).toBeInTheDocument();

    // Type in the search box to filter
    const searchInput = screen.getByPlaceholderText(/Search your chats/i);
    fireEvent.change(searchInput, { target: { value: 'Hello' } });
    
    // Only the chat matching the search should be visible
    expect(screen.getByText('Hello World Chat')).toBeInTheDocument();
    expect(screen.queryByText('Another Chat')).not.toBeInTheDocument();
    
    // Search for non-existent chat
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    expect(screen.getByText('No chats found')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button'); // Get the close button by its click handler position
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose and selectChat when a chat item is clicked', async () => {
    const mockChat = {
      id: '1',
      title: 'Test Chat',
      updated_at: new Date().toISOString(),
      project_id: undefined
    };
    
    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: [mockChat],
      selectChat: mockSelectChat,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    const chatItem = screen.getByText('Test Chat');
    fireEvent.click(chatItem);
    
    await waitFor(() => {
      expect(mockSelectChat).toHaveBeenCalledWith(mockChat);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('formats dates correctly', async () => {
    const mockChats = [
      {
        id: '1',
        title: 'Today Chat',
        updated_at: new Date().toISOString(),
        project_id: undefined
      },
      {
        id: '2', 
        title: 'Yesterday Chat',
        updated_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        project_id: undefined
      },
      {
        id: '3',
        title: 'Week Ago Chat',
        updated_at: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
        project_id: undefined
      }
    ];

    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: mockChats,
      selectChat: mockSelectChat,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    // Check that today's date format appears in the UI
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('1 weeks ago')).toBeInTheDocument();
  });

  it('shows project name for chats with project assignment', () => {
    const mockChats = [
      {
        id: '1',
        title: 'Project Chat',
        updated_at: new Date().toISOString(),
        project_id: 'proj-1'
      }
    ];
    
    const mockProjects = [
      {
        id: 'proj-1',
        name: 'My Project'
      }
    ];
    
    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: mockChats,
      selectChat: mockSelectChat,
    });
    
    (useProjectsStore as jest.MockedFunction<typeof useProjectsStore>).mockReturnValue({
      projects: mockProjects,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('shows "Unassigned" for chats without project', () => {
    const mockChats = [
      {
        id: '1',
        title: 'Unassigned Chat',
        updated_at: new Date().toISOString(),
        project_id: undefined
      }
    ];
    
    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: mockChats,
      selectChat: mockSelectChat,
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows "Unknown" for chats with invalid project ID', () => {
    const mockChats = [
      {
        id: '1',
        title: 'Invalid Project Chat',
        updated_at: new Date().toISOString(),
        project_id: 'invalid-id'
      }
    ];
    
    (useChatsStore as jest.MockedFunction<typeof useChatsStore>).mockReturnValue({
      chats: mockChats,
      selectChat: mockSelectChat,
    });
    
    (useProjectsStore as jest.MockedFunction<typeof useProjectsStore>).mockReturnValue({
      projects: [], // No projects, so project_id won't match anything
    });

    render(<ChatHistory isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});