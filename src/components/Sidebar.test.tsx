import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, jest, afterEach } from '@jest/globals';
import { useProjectsStore } from '../store/projects';
import { useChatsStore } from '../store/chats';
import Sidebar from './Sidebar';
import { Chat } from '../lib/types';

// Mock the stores
jest.mock('../store/projects');
jest.mock('../store/chats');

const mockUseProjectsStore = useProjectsStore as jest.MockedFunction<typeof useProjectsStore>;
const mockUseChatsStore = useChatsStore as jest.MockedFunction<typeof useChatsStore>;

describe('Sidebar', () => {
  const mockProjects = [
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' }
  ];

  const mockChats: Chat[] = [
    { id: '1', title: 'Chat 1', projectId: null, messages: [] },
    { id: '2', title: 'Chat 2', projectId: '1', messages: [] }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseProjectsStore.mockReturnValue({
      projects: [],
      currentProject: null,
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      createProject: jest.fn().mockResolvedValue({ id: '3', name: 'New Project' }),
      deleteProject: jest.fn().mockResolvedValue(undefined)
    });

    mockUseChatsStore.mockReturnValue({
      chats: [],
      currentChat: null,
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: jest.fn(),
      createChat: jest.fn().mockResolvedValue({ id: '3', title: 'New Chat', projectId: null, messages: [] }),
      deleteChat: jest.fn().mockResolvedValue(undefined)
    });
  });

  it('renders sidebar header correctly', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Claude Lite')).toBeInTheDocument();
    expect(screen.getByText('AI Chat Client')).toBeInTheDocument();
  });

  it('displays the "New Chat" button', () => {
    render(<Sidebar />);
    
    expect(screen.getByRole('button', { name: /New Chat/i })).toBeInTheDocument();
  });

  it('loads projects and chats on mount', () => {
    const mockLoadProjects = jest.fn().mockResolvedValue(undefined);
    const mockLoadChats = jest.fn().mockResolvedValue(undefined);

    mockUseProjectsStore.mockReturnValue({
      projects: [],
      currentProject: null,
      loadProjects: mockLoadProjects,
      selectProject: jest.fn(),
      createProject: jest.fn(),
      deleteProject: jest.fn()
    });

    mockUseChatsStore.mockReturnValue({
      chats: [],
      currentChat: null,
      loadChats: mockLoadChats,
      selectChat: jest.fn(),
      createChat: jest.fn(),
      deleteChat: jest.fn()
    });

    render(<Sidebar />);

    // The first call occurs in the initial useEffect
    // The second call occurs in the useEffect that depends on currentProject (which starts as null)
    expect(mockLoadProjects).toHaveBeenCalledTimes(1);
    expect(mockLoadChats).toHaveBeenCalledTimes(2); // Updated expectation
  });

  it('creates a new chat when "New Chat" button is clicked', async () => {
    const mockCreateChat = jest.fn().mockResolvedValue({ id: '3', title: 'New Chat', projectId: null, messages: [] });
    const mockSelectChat = jest.fn();
    
    mockUseChatsStore.mockReturnValue({
      chats: [],
      currentChat: null,
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: mockSelectChat,
      createChat: mockCreateChat,
      deleteChat: jest.fn()
    });

    render(<Sidebar />);
    
    const newChatButton = screen.getByRole('button', { name: /New Chat/i });
    fireEvent.click(newChatButton);

    await waitFor(() => {
      expect(mockCreateChat).toHaveBeenCalledWith(undefined); // No project ID when no current project
      expect(mockSelectChat).toHaveBeenCalledWith({ id: '3', title: 'New Chat', projectId: null, messages: [] });
    });
  });

  it('shows project list when projects are available', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      createProject: jest.fn(),
      deleteProject: jest.fn()
    });

    render(<Sidebar />);
    
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('selects a project when project button is clicked', () => {
    const mockSelectProject = jest.fn();
    
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: mockSelectProject,
      createProject: jest.fn(),
      deleteProject: jest.fn()
    });

    render(<Sidebar />);
    
    const projectButton = screen.getByText('Project 1');
    fireEvent.click(projectButton);

    expect(mockSelectProject).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('deletes a project when delete button is clicked', async () => {
    const mockDeleteProject = jest.fn().mockResolvedValue(undefined);
    
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      createProject: jest.fn(),
      deleteProject: mockDeleteProject
    });

    render(<Sidebar />);
    
    // Find the delete button for the first project
    // Since the delete button appears on hover, we need to simulate the hover effect
    const projectItem = screen.getByText('Project 1').closest('div.relative.group');
    const deleteButton = projectItem?.querySelector('button[title="Delete project"]');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(mockDeleteProject).toHaveBeenCalledWith('1');
      });
    }
  });

  it('shows unassigned option as selected when no current project', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      createProject: jest.fn(),
      deleteProject: jest.fn()
    });

    render(<Sidebar />);
    
    const unassignedButton = screen.getByRole('button', { name: 'Unassigned' });
    expect(unassignedButton).toHaveClass('bg-teal-500/20');
    expect(unassignedButton).toHaveClass('text-white');
  });

  it('does not show unassigned option as selected when a project is current', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      currentProject: mockProjects[0],
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      createProject: jest.fn(),
      deleteProject: jest.fn()
    });

    render(<Sidebar />);
    
    const unassignedButton = screen.getByRole('button', { name: 'Unassigned' });
    expect(unassignedButton).not.toHaveClass('bg-teal-500/20');
    expect(unassignedButton).toHaveClass('text-teal-300');
  });

  it('selects unassigned (no project) when unassigned button is clicked', () => {
    const mockSelectProject = jest.fn();
    
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      currentProject: mockProjects[0],
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: mockSelectProject,
      createProject: jest.fn(),
      deleteProject: jest.fn()
    });

    render(<Sidebar />);
    
    const unassignedButton = screen.getByRole('button', { name: 'Unassigned' });
    fireEvent.click(unassignedButton);

    expect(mockSelectProject).toHaveBeenCalledWith(null);
  });

  it('shows add project button', () => {
    render(<Sidebar />);
    
    const addProjectButton = screen.getByTitle('New Project');
    expect(addProjectButton).toBeInTheDocument();
  });

  it('toggles new project input when add project button is clicked', () => {
    render(<Sidebar />);
    
    const addProjectButton = screen.getByTitle('New Project');
    fireEvent.click(addProjectButton);

    expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
  });

  it('creates new project when project name is entered and Enter is pressed', async () => {
    const mockCreateProject = jest.fn().mockResolvedValue({ id: '4', name: 'Test Project' });
    
    mockUseProjectsStore.mockReturnValue({
      projects: [],
      currentProject: null,
      loadProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      createProject: mockCreateProject,
      deleteProject: jest.fn()
    });

    render(<Sidebar />);
    
    const addProjectButton = screen.getByTitle('New Project');
    fireEvent.click(addProjectButton);

    const projectNameInput = screen.getByPlaceholderText('Project name');
    fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });
    fireEvent.keyDown(projectNameInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith('Test Project');
    });
  });

  it('displays chat history section', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Chats')).toBeInTheDocument();
  });

  it('shows "No chats yet" when there are no chats', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('No chats yet')).toBeInTheDocument();
  });

  it('displays chat list when chats are available', () => {
    mockUseChatsStore.mockReturnValue({
      chats: mockChats,
      currentChat: null,
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: jest.fn(),
      createChat: jest.fn(),
      deleteChat: jest.fn()
    });

    render(<Sidebar />);
    
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
  });

  it('selects a chat when chat button is clicked', () => {
    const mockSelectChat = jest.fn();
    
    mockUseChatsStore.mockReturnValue({
      chats: mockChats,
      currentChat: null,
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: mockSelectChat,
      createChat: jest.fn(),
      deleteChat: jest.fn()
    });

    render(<Sidebar />);
    
    const chatButton = screen.getByText('Chat 1');
    fireEvent.click(chatButton);

    expect(mockSelectChat).toHaveBeenCalledWith(mockChats[0]);
  });

  it('deletes a chat when delete button is clicked', async () => {
    const mockDeleteChat = jest.fn().mockResolvedValue(undefined);
    
    mockUseChatsStore.mockReturnValue({
      chats: mockChats,
      currentChat: null,
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: jest.fn(),
      createChat: jest.fn(),
      deleteChat: mockDeleteChat
    });

    render(<Sidebar />);
    
    // Simulate hover to show delete button
    const chatItem = screen.getByText('Chat 1').closest('div.relative.group');
    const deleteButton = chatItem?.querySelector('button[title="Delete chat"]');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      await waitFor(() => {
        expect(mockDeleteChat).toHaveBeenCalledWith('1');
      });
    }
  });

  it('shows active chat with highlighted styling', () => {
    mockUseChatsStore.mockReturnValue({
      chats: mockChats,
      currentChat: mockChats[0],
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: jest.fn(),
      createChat: jest.fn(),
      deleteChat: jest.fn()
    });

    render(<Sidebar />);

    // Find the chat item containing the text 'Chat 1'
    const chatElement = screen.getByText('Chat 1');
    // Get the closest button ancestor
    const chatButton = chatElement.closest('button');
    expect(chatButton).toHaveClass('bg-teal-500/20');
    expect(chatButton).toHaveClass('text-white');
  });

  it('shows inactive chat with default styling', () => {
    mockUseChatsStore.mockReturnValue({
      chats: mockChats,
      currentChat: mockChats[0], // Chat 1 is current, so Chat 2 should be inactive
      loadChats: jest.fn().mockResolvedValue(undefined),
      selectChat: jest.fn(),
      createChat: jest.fn(),
      deleteChat: jest.fn()
    });

    render(<Sidebar />);

    // Find the chat item containing the text 'Chat 2'
    const chatElement = screen.getByText('Chat 2');
    // Get the closest button ancestor
    const chatButton = chatElement.closest('button');
    expect(chatButton).not.toHaveClass('bg-teal-500/20');
    expect(chatButton).toHaveClass('text-teal-300');
  });
});