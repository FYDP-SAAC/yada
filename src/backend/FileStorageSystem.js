import Cookies from 'js-cookie';
import store from '../store';
import {SERVER_BASE_URL, fetchWithTimeout} from '../util/FetchWithTimeout';
import convertStrValueOrDefault from '../util/ConvertStrValueOrDefault';
import {getFileIdKeyStr} from '../util/FileIdAndTypeUtils';
import {BACKEND_MODE_SIGNED_IN_STATUS, ACCESS_TOKEN_COOKIE_KEY} from '../reducers/BackendModeSignedInStatus';

const SOURCE_ID_NAMES_LOCAL_STORAGE_KEY = 'sourceIdNames';

// API-ish
export const doSetLocalStorageSourceIdNames = sourceIdNames =>
  localStorage.setItem(SOURCE_ID_NAMES_LOCAL_STORAGE_KEY, JSON.stringify(sourceIdNames));

const doGetLocalStorageSourceIdNames = () => convertStrValueOrDefault(
  localStorage.getItem(SOURCE_ID_NAMES_LOCAL_STORAGE_KEY),
  {},
  'invalid sourceIdNames',
);

const SOURCE_VIEWS_LIST_LOCAL_STORAGE_KEY_PREFIX = 'sourceViewsList';

// API-ish
export const doSetLocalStorageSourceViewsList = (sourceId, sourceViewsList) =>
  localStorage.setItem(SOURCE_VIEWS_LIST_LOCAL_STORAGE_KEY_PREFIX + sourceId, JSON.stringify(sourceViewsList));

const doGetLocalStorageSourceViewsList = sourceId => convertStrValueOrDefault(
  localStorage.getItem(SOURCE_VIEWS_LIST_LOCAL_STORAGE_KEY_PREFIX + sourceId),
  {},
  'invalid sourceViewsList',
);

export const convertFilesListStateToFileIdNamesList = filesListState => Object.fromEntries(
  Object.entries(filesListState).map(([id, { name }]) => [id, name])
);

// API
export const doGetFilesList = () => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
    return Object.fromEntries(Object.entries(doGetLocalStorageSourceIdNames()).map(
      ([sourceId, sourceName]) => [
        sourceId,
        { name: sourceName, viewsList: doGetLocalStorageSourceViewsList(sourceId) },
      ]
    ));
  } else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = fetchWithTimeout(
        SERVER_BASE_URL + `documents`,
        { headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (response.ok) { return JSON.parse(Promise.resolve(response.json())); }
    } catch (e) { console.log(e); }
  }
  return null;
};

// API-ish
export const doFileNamesSearch = (filesList, search) => Object.fromEntries(
  Object.entries(filesList).map(([sourceId, { name: sourceName, viewsList }]) => [
    sourceId,
    {
      name: sourceName,
      viewsList: search
        ? Object.fromEntries(Object.entries(viewsList).filter(
            ([_viewId, { name: viewName }]) => viewName.includes(search)
          ))
        : viewsList,
    },
  ]).filter(
    ([_sourceId, { name: sourceName, viewsList }]) => !search ||
      Object.keys(viewsList).length > 0 || sourceName.includes(search)
  )
);

export const countNumFiles = filesList => Object.entries(filesList)
  .reduce((count, [_sourceId, { viewsList }]) => count + 1 + Object.keys(viewsList).length, 0);

const VIEW_CONTENT_SPEC_LOCAL_STORAGE_KEY_PREFIX = 'viewContentSpec_';

const SOURCE_CONTENT_LOCAL_STORAGE_KEY_PREFIX = 'sourceContent_';

const EMPTY_SOURCE_CONTENT = { type: 'doc', content: [] };

// API
export const doSaveSourceContent = (value, sourceId, createSourceName) => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_OUT) { return null; }
  const saveValue = value
    ? convertStrValueOrDefault(
        value,
        null,
        'invalid sourceContent value',
        valueStr => {
          JSON.parse(valueStr);
          return valueStr;
        },
      )
    : JSON.stringify(EMPTY_SOURCE_CONTENT);
  if (!saveValue) { return null; }
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
    localStorage.setItem(SOURCE_CONTENT_LOCAL_STORAGE_KEY_PREFIX + sourceId, saveValue);
    return { id: sourceId, ...(createSourceName ? { name: createSourceName } : null) };
  } else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = sourceIdfetchWithTimeout(
        SERVER_BASE_URL + 'document' + (sourceId ? `?docID=${sourceId}` : ''),
        {
          method: 'PUT',
          body: saveValue,
          headers: new Headers({ 'Content-Type': 'application/json', 'Set-Cookie': `token=${token}` }),
        },
      );
      if (response.ok) {
        const { docID, name } = JSON.parse(Promise.resolve(response.json()));
        return { id: docID, ...(createSourceName ? { name } : null) };
      };
    } catch (e) { console.log(e); }
  }
  return null;
};

// API
export const doGetSourceContent = sourceId => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
    return convertStrValueOrDefault(
      localStorage.getItem(SOURCE_CONTENT_LOCAL_STORAGE_KEY_PREFIX + sourceId),
      '',
      'invalid sourceContent',
      valueStr => {
        JSON.parse(valueStr);
        return valueStr;
      },
    );
  } else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = fetchWithTimeout(
        SERVER_BASE_URL + `document?docID=${sourceId}`,
        { headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (response.ok) {
        const responseValue = Promise.resolve(response.json());
        return strValue ? responseValue : JSON.parse(responseValue);
      };
    } catch (e) { console.log(e); }
  }
  return null;
};

const SOURCE_SAVED_TAG_FILTERS_LOCAL_STORAGE_KEY_PREFIX = 'sourceSavedTagFilters_';

// API-ish // TODO
export const doSetSourceSavedTagFilters = (sourceId, sourceSavedTagFilters) => {
  if (Object.keys(sourceSavedTagFilters).length > 0) {
    localStorage.setItem(
      SOURCE_SAVED_TAG_FILTERS_LOCAL_STORAGE_KEY_PREFIX + sourceId,
      JSON.stringify(sourceSavedTagFilters),
    );
  } else { localStorage.removeItem(SOURCE_SAVED_TAG_FILTERS_LOCAL_STORAGE_KEY_PREFIX + sourceId); }
};

// API // TODO
export const doGetSourceSavedTagFilters = sourceId => convertStrValueOrDefault(
  localStorage.getItem(SOURCE_SAVED_TAG_FILTERS_LOCAL_STORAGE_KEY_PREFIX + sourceId),
  {},
  'invalid sourceSavedTagFilters',
);

export const calculateLocalStorageNextNewId = (existingIdsDict, candidate) => {
  while (!candidate || existingIdsDict.hasOwnProperty(candidate.toString())) { candidate += 1; }
  return candidate.toString();
};

export const calculateLocalStorageNextNewFileIds = filesList => ({
  source: calculateLocalStorageNextNewId(filesList, 0),
  nextNewViewIdsForSourceIds: Object.fromEntries(Object.entries(filesList).map(
    ([sourceId, { viewsList }]) => [sourceId, calculateLocalStorageNextNewId(viewsList, 0)]
  )),
});

// API // TODO
export const doCreateNewSource = (name, localStorageNextNewSourceId) => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if(backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_OUT) { return null; }
  return doSaveSourceContent(
    null,
    backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE ? localStorageNextNewSourceId : null,
    name,
  );
};

// API
export const doDeleteSource = (sourceId, localStorageSourceViewIds) => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
    localStorage.removeItem(SOURCE_SAVED_TAG_FILTERS_LOCAL_STORAGE_KEY_PREFIX + sourceId);
    localStorage.removeItem(SOURCE_CONTENT_LOCAL_STORAGE_KEY_PREFIX + sourceId);
    for (const viewId of localStorageSourceViewIds) {
      localStorage.removeItem(VIEW_CONTENT_SPEC_LOCAL_STORAGE_KEY_PREFIX + getFileIdKeyStr(sourceId, viewId));
    }
    localStorage.removeItem(SOURCE_VIEW_ID_NAMES_LOCAL_STORAGE_KEY_PREFIX + sourceId);
    return true;
  } else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = fetchWithTimeout(
        SERVER_BASE_URL + `document?docID=${sourceId}`,
        { method: 'DELETE', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
  }
  return false;
};

// API
export const doDeleteView = (sourceId, viewId) => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
    localStorage.removeItem(VIEW_CONTENT_SPEC_LOCAL_STORAGE_KEY_PREFIX + getFileIdKeyStr(sourceId, viewId));
    return true;
  } else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = fetchWithTimeout(
        SERVER_BASE_URL + `view?docID=${sourceId}&viewID=${viewId}`,
        { method: 'DELETE', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
  }
  return false;
};

// API
export const doRenameSource = (sourceId, name) => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) { return true; }
  else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = fetchWithTimeout(
        SERVER_BASE_URL + `rename_document?docID=${sourceId}&name=${name}`,
        { method: 'UPDATE', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
  }
  return false;
};

// API
export const doRenameView = (sourceId, viewId, name) => {
  const backendModeSignedInStatus = store.getState().backendModeSignedInStatus;
  if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) { return true; }
  else if (backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN) {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = fetchWithTimeout(
        SERVER_BASE_URL + `rename_view?docID=${sourceId}&viewID=${viewId}&name=${name}`,
        { method: 'UPDATE', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
  }
  return false;
};
