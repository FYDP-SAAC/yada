import Cookies from 'js-cookie';
import {fetchWithTimeout} from '../util/FetchWithTimeout';
import {convertStrValueOrDefaultIfFalsy} from '../util/ConvertStrValueOrDefault';
import {ACCESS_TOKEN_COOKIE_KEY, SERVER_BASE_URL} from '../reducers/BackendModeSignedInStatus';

const EMPTY_SOURCE_CONTENT = { type: 'doc', content: [{ type: 'paragraph', attrs: { tags: {} } }] };

export default {
  doGetFilesList: async () => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = await fetchWithTimeout(
        SERVER_BASE_URL + `documents`,
        { headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (response.ok) { return await response.json(); }
    } catch (e) { console.log(e); }
    return null;
  },
  doSaveViewSpec: async (tagsList, sourceId, viewId, type, createNew) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    const response = await fetchWithTimeout(
        SERVER_BASE_URL + `view?docID=${sourceId}&viewType=${type}` + (!createNew ? `&viewID=${viewId}` : ''),
        {
          method: 'PUT',
          body: JSON.stringify({ tags: tagsList }),
          headers: new Headers({ 'Content-Type': 'application/json', 'Set-Cookie': `token=${token}` }),
        },
    );
    if (response.ok) {
      const { viewID } = await response.json();
      return { id: viewID, sourceId: sourceId, ...(createNew ? { name:"Untitled", type } : null) };
    }
    throw new Error("Failed to save view");
  },
  doGetView: async (fileId) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const viewResponse = await fetchWithTimeout(
        SERVER_BASE_URL + `view?docID=${fileId.sourceId}&viewID=${fileId.viewId}`,
        { method: 'GET', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      const tagResponse = await fetchWithTimeout(
          SERVER_BASE_URL + `tags?docID=${fileId.sourceId}`,
          { method: 'GET', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (!viewResponse.ok || !tagResponse.ok) { return null; }
      const view_json = await viewResponse.json();
      const tags_json = await tagResponse.json();
      return {"view": view_json, "tags": tags_json, "type": fileId.viewType};
    } catch (e) { console.log(e); }
    return null;
  },
  doGetSourceTaggedBlocks: async sourceId => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = await fetchWithTimeout(
        SERVER_BASE_URL + `tags?docID=${sourceId}`,
        { method: 'GET', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (response.ok) { return await response.json(); };
    } catch (e) { console.log(e); }
    return null;
  },
  doSaveSourceContent: async (value, sourceId, createNew) => {
    const saveValue = convertStrValueOrDefaultIfFalsy(
      value,
      JSON.stringify(EMPTY_SOURCE_CONTENT),
      'invalid sourceContent value',
      valueStr => {
        JSON.parse(valueStr);
        return valueStr;
      },
    );
    if (!saveValue) { return null; }
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = await fetchWithTimeout(
        SERVER_BASE_URL + 'document' + (!createNew ? `?docID=${sourceId}` : ''),
        {
          method: 'PUT',
          body: saveValue,
          headers: new Headers({ 'Content-Type': 'application/json', 'Set-Cookie': `token=${token}` }),
        },
      );
      if (response.ok) {
        const { id, name } = await response.json();
        return { id: id, ...(createNew ? { name } : null) };
      };
    } catch (e) { console.log(e); }
    return null;
  },
  doGetSourceContent: async sourceId => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = await fetchWithTimeout(
        SERVER_BASE_URL + `document?docID=${sourceId}`,
        { headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (response.ok) { return await response.text(); }
    } catch (e) { console.log(e); }
    return null;
  },
  doSetSourceSavedTagFilters: async (sourceId, sourceSavedTagFilters) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    const filters = Object.keys(sourceSavedTagFilters);
    try {
      const response = await fetchWithTimeout(
        SERVER_BASE_URL + `filters?docID=`,
        {
          method: 'POST',
          body: JSON.stringify({ body: {"docID": sourceId, "filters": filters} }),
          headers: new Headers({ 'Content-Type': 'application/json', 'Set-Cookie': `token=${token}` }),
        },
      );
      if (response.ok) {
        return true;
      };
    } catch (e) { console.log(e); }
    return null;
  },
  doGetSourceSavedTagFilters: async sourceId => { // TODO
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const response = await fetchWithTimeout(
        SERVER_BASE_URL + `filters?docID=${sourceId}`,
        { headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      if (response.ok) { return await response.json(); }
    } catch (e) { console.log(e); }
    return null;
  },
  doDeleteSource: async sourceId => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = await fetchWithTimeout(
        SERVER_BASE_URL + `document?docID=${sourceId}`,
        { method: 'DELETE', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
    return false;
  },
  doDeleteView: async (sourceId, viewId) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = await fetchWithTimeout(
        SERVER_BASE_URL + `view?docID=${sourceId}&viewID=${viewId}`,
        { method: 'DELETE', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
    return false;
  },
  doRenameSource: async (sourceId, name) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = await fetchWithTimeout(
        SERVER_BASE_URL + `document?docID=${sourceId}&name=${name}`,
        { method: 'PATCH', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
    return false;
  },
  doRenameView: async (sourceId, viewId, name) => {
    const token = Cookies.get(ACCESS_TOKEN_COOKIE_KEY);
    try {
      const { ok } = await fetchWithTimeout(
        SERVER_BASE_URL + `view?docID=${sourceId}&viewID=${viewId}&name=${name}`,
        { method: 'PATCH', headers: new Headers({ 'Set-Cookie': `token=${token}` }) },
      );
      return ok;
    } catch (e) { console.log(e); }
    return false;
  },
};