import { useProjectsStore } from './projects';
import type { Project } from '../lib/types';
import * as api from '../lib/tauri';

// Mock the API module
jest.mock('../lib/tauri');

describe('Projects Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useProjectsStore.setState({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const state = useProjectsStore.getState();
      
      expect(state.projects).toEqual([]);
      expect(state.currentProject).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadProjects', () => {
    it('should set loading state and fetch projects', async () => {
      const mockProjects: Project[] = [
        { id: '1', name: 'Test Project', path: '/path/to/test' },
        { id: '2', name: 'Another Project', path: '/path/to/another' },
      ];

      jest.spyOn(api, 'listProjects').mockResolvedValue(mockProjects);

      await useProjectsStore.getState().loadProjects();

      expect(useProjectsStore.getState().isLoading).toBe(false);
      expect(useProjectsStore.getState().projects).toEqual(mockProjects);
      expect(useProjectsStore.getState().error).toBeNull();
      expect(api.listProjects).toHaveBeenCalledTimes(1);
    });

    it('should handle loading state correctly (loading -> false)', async () => {
      jest.spyOn(api, 'listProjects').mockImplementation(() => {
        // Check that loading is true during the promise
        expect(useProjectsStore.getState().isLoading).toBe(true);
        return Promise.resolve([]);
      });

      await useProjectsStore.getState().loadProjects();
    });

    it('should set error state when API call fails', async () => {
      const errorMessage = 'Failed to load projects';
      jest.spyOn(api, 'listProjects').mockRejectedValue(new Error(errorMessage));

      await useProjectsStore.getState().loadProjects();

      expect(useProjectsStore.getState().isLoading).toBe(false);
      expect(useProjectsStore.getState().projects).toEqual([]);
      expect(useProjectsStore.getState().error).toBe(`Error: ${errorMessage}`);
    });
  });

  describe('selectProject', () => {
    it('should select a project', () => {
      const mockProject: Project = { id: '1', name: 'Test Project', path: '/path/to/test' };
      
      useProjectsStore.getState().selectProject(mockProject);

      expect(useProjectsStore.getState().currentProject).toEqual(mockProject);
    });

    it('should set currentProject to null', () => {
      // First select a project
      const mockProject: Project = { id: '1', name: 'Test Project', path: '/path/to/test' };
      useProjectsStore.getState().selectProject(mockProject);
      
      // Then deselect it
      useProjectsStore.getState().selectProject(null);

      expect(useProjectsStore.getState().currentProject).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create a new project and add it to the store', async () => {
      const projectName = 'New Project';
      const newProject: Project = { id: '3', name: projectName, path: '/path/to/new-project' };

      jest.spyOn(api, 'createProject').mockResolvedValue(newProject);

      const createdProject = await useProjectsStore.getState().createProject(projectName);

      expect(createdProject).toEqual(newProject);
      expect(useProjectsStore.getState().isLoading).toBe(false);
      expect(useProjectsStore.getState().projects).toContainEqual(newProject);
      expect(useProjectsStore.getState().error).toBeNull();
      expect(api.createProject).toHaveBeenCalledWith(projectName);
    });

    it('should add the new project at the beginning of the projects array', async () => {
      const existingProject: Project = { id: '1', name: 'Existing Project', path: '/path/to/existing' };
      useProjectsStore.setState({ projects: [existingProject] });

      const projectName = 'New Project';
      const newProject: Project = { id: '2', name: projectName, path: '/path/to/new' };
      
      jest.spyOn(api, 'createProject').mockResolvedValue(newProject);

      await useProjectsStore.getState().createProject(projectName);

      const currentState = useProjectsStore.getState();
      expect(currentState.projects[0]).toEqual(newProject);
      expect(currentState.projects[1]).toEqual(existingProject);
    });

    it('should handle loading state correctly during project creation', async () => {
      const projectName = 'New Project';
      const newProject: Project = { id: '2', name: projectName, path: '/path/to/new' };
      
      jest.spyOn(api, 'createProject').mockImplementation(() => {
        // Check that loading is true during the promise
        expect(useProjectsStore.getState().isLoading).toBe(true);
        return Promise.resolve(newProject);
      });

      await useProjectsStore.getState().createProject(projectName);

      // After promise resolves, loading should be false
      expect(useProjectsStore.getState().isLoading).toBe(false);
    });

    it('should set error state when API call fails', async () => {
      const projectName = 'New Project';
      const errorMessage = 'Failed to create project';
      
      jest.spyOn(api, 'createProject').mockRejectedValue(new Error(errorMessage));

      await expect(useProjectsStore.getState().createProject(projectName))
        .rejects.toThrow(errorMessage);

      expect(useProjectsStore.getState().isLoading).toBe(false);
      expect(useProjectsStore.getState().error).toBe(`Error: ${errorMessage}`);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project from the store', async () => {
      const projectToDelete: Project = { id: '1', name: 'Project to Delete', path: '/path/to/delete' };
      const otherProject: Project = { id: '2', name: 'Other Project', path: '/path/to/other' };
      
      useProjectsStore.setState({
        projects: [projectToDelete, otherProject],
        currentProject: projectToDelete
      });

      jest.spyOn(api, 'deleteProject').mockResolvedValue();

      await useProjectsStore.getState().deleteProject(projectToDelete.id);

      expect(useProjectsStore.getState().projects).toEqual([otherProject]);
      expect(useProjectsStore.getState().isLoading).toBe(false);
      expect(useProjectsStore.getState().error).toBeNull();
      expect(api.deleteProject).toHaveBeenCalledWith(projectToDelete.id);
    });

    it('should set currentProject to null if the deleted project was the current project', async () => {
      const projectToDelete: Project = { id: '1', name: 'Project to Delete', path: '/path/to/delete' };
      const otherProject: Project = { id: '2', name: 'Other Project', path: '/path/to/other' };
      
      useProjectsStore.setState({
        projects: [projectToDelete, otherProject],
        currentProject: projectToDelete
      });

      jest.spyOn(api, 'deleteProject').mockResolvedValue();

      await useProjectsStore.getState().deleteProject(projectToDelete.id);

      expect(useProjectsStore.getState().currentProject).toBeNull();
    });

    it('should not change currentProject if a different project was deleted', async () => {
      const projectToDelete: Project = { id: '1', name: 'Project to Delete', path: '/path/to/delete' };
      const otherProject: Project = { id: '2', name: 'Other Project', path: '/path/to/other' };
      const currentProject: Project = { id: '3', name: 'Current Project', path: '/path/to/current' };
      
      useProjectsStore.setState({ 
        projects: [projectToDelete, otherProject, currentProject],
        currentProject: currentProject
      });

      jest.spyOn(api, 'deleteProject').mockResolvedValue();

      await useProjectsStore.getState().deleteProject(projectToDelete.id);

      expect(useProjectsStore.getState().currentProject).toEqual(currentProject);
    });

    it('should handle loading state correctly during project deletion', async () => {
      const projectToDelete: Project = { id: '1', name: 'Project to Delete', path: '/path/to/delete' };
      useProjectsStore.setState({ 
        projects: [projectToDelete],
        currentProject: null
      });

      jest.spyOn(api, 'deleteProject').mockImplementation(() => {
        // Check that loading is true during the promise
        expect(useProjectsStore.getState().isLoading).toBe(true);
        return Promise.resolve();
      });

      await useProjectsStore.getState().deleteProject(projectToDelete.id);

      // After promise resolves, loading should be false
      expect(useProjectsStore.getState().isLoading).toBe(false);
    });

    it('should set error state when API call fails', async () => {
      const projectToDelete: Project = { id: '1', name: 'Project to Delete', path: '/path/to/delete' };
      const errorMessage = 'Failed to delete project';
      
      useProjectsStore.setState({ 
        projects: [projectToDelete],
        currentProject: null
      });

      jest.spyOn(api, 'deleteProject').mockRejectedValue(new Error(errorMessage));

      await expect(useProjectsStore.getState().deleteProject(projectToDelete.id))
        .rejects.toThrow(errorMessage);

      expect(useProjectsStore.getState().isLoading).toBe(false);
      expect(useProjectsStore.getState().error).toBe(`Error: ${errorMessage}`);
    });
  });
});