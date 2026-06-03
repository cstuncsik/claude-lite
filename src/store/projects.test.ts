import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '../lib/types';

vi.mock('../lib/tauri', () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import * as api from '../lib/tauri';
import { useProjectsStore } from './projects';

const initialState = useProjectsStore.getState();

const makeProject = (over: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Proj',
  settings_json: '{}',
  created_at: '',
  updated_at: '',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  useProjectsStore.setState(initialState, true);
});

describe('useProjectsStore', () => {
  it('loadProjects populates projects and clears loading', async () => {
    const projects = [makeProject({ id: 'a' })];
    vi.mocked(api.listProjects).mockResolvedValue(projects);

    await useProjectsStore.getState().loadProjects();

    const s = useProjectsStore.getState();
    expect(s.projects).toEqual(projects);
    expect(s.isLoading).toBe(false);
  });

  it('loadProjects records an error on failure', async () => {
    vi.mocked(api.listProjects).mockRejectedValue('nope');

    await useProjectsStore.getState().loadProjects();

    expect(useProjectsStore.getState().error).toContain('nope');
  });

  it('createProject prepends the new project', async () => {
    useProjectsStore.setState({ projects: [makeProject({ id: 'old' })] });
    const fresh = makeProject({ id: 'new' });
    vi.mocked(api.createProject).mockResolvedValue(fresh);

    const returned = await useProjectsStore.getState().createProject('New');

    const s = useProjectsStore.getState();
    expect(returned).toEqual(fresh);
    expect(s.projects.map((p) => p.id)).toEqual(['new', 'old']);
  });

  it('deleteProject removes the project and clears currentProject when selected', async () => {
    const proj = makeProject({ id: 'x' });
    useProjectsStore.setState({ projects: [proj, makeProject({ id: 'y' })], currentProject: proj });
    vi.mocked(api.deleteProject).mockResolvedValue(undefined);

    await useProjectsStore.getState().deleteProject('x');

    const s = useProjectsStore.getState();
    expect(s.projects.map((p) => p.id)).toEqual(['y']);
    expect(s.currentProject).toBeNull();
  });
});
