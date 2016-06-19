import Immutable from 'immutable';

import NEW_HTML from 'raw!../../templates/new.html';

const emptyMap = new Immutable.Map();

const newProject = Immutable.fromJS({
  sources: {
    html: NEW_HTML,
    css: '',
    javascript: '',
  },
  enabledLibraries: new Immutable.Set(),
});

function projectToImmutable(project) {
  return Immutable.fromJS(project).set(
    'enabledLibraries',
    new Immutable.Set(project.enabledLibraries)
  );
}

function addProject(state, project) {
  return state.set(project.projectKey, projectToImmutable(project));
}

function projects(stateIn, action) {
  let state;

  if (stateIn === undefined) {
    state = emptyMap;
  } else {
    state = stateIn;
  }

  switch (action.type) {
    case 'PROJECT_LOADED_FROM_STORAGE':
      return addProject(state, action.payload.project);

    case 'CURRENT_PROJECT_LOADED_FROM_STORAGE':
      return addProject(state, action.payload.project);

    case 'PROJECT_SOURCE_EDITED':
      return state.setIn(
        [action.payload.projectKey, 'sources', action.payload.language],
        action.payload.newValue
      ).setIn(
        [action.payload.projectKey, 'updatedAt'],
        action.meta.timestamp
      );

    case 'PROJECT_CREATED':
      return state.set(
        action.payload.projectKey,
        newProject.set('projectKey', action.payload.projectKey)
      );

    case 'PROJECT_IMPORTED':
      return state.set(
        action.payload.project.projectKey,
        projectToImmutable(action.payload.project)
      );

    case 'CURRENT_PROJECT_CHANGED':
      return state.filter((project, projectKey) => (
        projectKey === action.payload.projectKey || project.has('updatedAt')
      ));

    case 'RESET_WORKSPACE':
      return emptyMap;

    case 'PROJECT_LIBRARY_TOGGLED':
      return state.updateIn(
        [action.payload.projectKey, 'enabledLibraries'],
        (enabledLibraries) => {
          const libraryKey = action.payload.libraryKey;
          if (enabledLibraries.has(libraryKey)) {
            return enabledLibraries.delete(libraryKey);
          }
          return enabledLibraries.add(libraryKey);
        }
      ).setIn(
        [action.payload.projectKey, 'updatedAt'],
        action.meta.timestamp
      );

    default:
      return state;
  }
}

export default projects;
