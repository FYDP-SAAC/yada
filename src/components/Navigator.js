import './Navigator.css';
import {debounce, defer} from 'lodash';
import Cookies from 'js-cookie';
import React from 'react';
import {batch, connect} from 'react-redux';
import convertStrValueOrDefault from '../util/ConvertStrValueOrDefault';
import {FILE_TYPE, getFileType, validateFileIdObj, getFileIdKeyStr} from '../util/FileIdAndTypeUtils';
import store from '../store';
import {
  CLEAR_SAVE_DIRTY_FLAG_ACTION_TYPE,
  NO_OPEN_FILE_ID,
  setCurrentOpenFileIdAction,
} from '../reducers/CurrentOpenFileState';
import {
  NO_RENAMING_INPUT_STATE,
  RENAME_INPUT_TYPES,
  setRenamingInputStateAction,
} from '../reducers/RenamingInputState';
import {
  ACCESS_TOKEN_COOKIE_KEY,
  BACKEND_MODE_SIGNED_IN_STATUS,
  getUserSignedInStatus,
  setBackendModeSignedInStatusAction,
} from '../reducers/BackendModeSignedInStatus';
import {
  doSetLocalStorageSourceIdNames,
  doSetLocalStorageSourceViewsList,
  convertFilesListStateToFileIdNamesList,
  doGetFilesList,
  doFileNamesSearch,
  countNumFiles,
  calculateLocalStorageNextNewId,
  calculateLocalStorageNextNewFileIds,
  doCreateNewSource,
  doDeleteSource,
  doDeleteView,
  doRenameSource,
  doRenameView,
} from '../backend/FileStorageSystem';

const INITIAL_FILE_ID_LOCAL_STORAGE_KEY = 'initialFileId';

export const handleSetCurrentOpenFileId = fileId => {
  if (!validateFileIdObj(fileId)) { return; }
  const currentOpenFileId = store.getState().currentOpenFileId;
  if (fileId.sourceId !== currentOpenFileId.sourceId || fileId.viewId !== currentOpenFileId.viewId) {
    if (store.getState().saveDirtyFlag && !window.confirm('confirm discard unsaved changes')) { return; }
    batch(() => {
      store.dispatch(setCurrentOpenFileIdAction(fileId));
      store.dispatch({ type: CLEAR_SAVE_DIRTY_FLAG_ACTION_TYPE });
    });
    localStorage.setItem(INITIAL_FILE_ID_LOCAL_STORAGE_KEY, JSON.stringify(fileId));
  }
};

const FILE_LIST_ID = 'file_list';

const SEARCH_FILE_NAMES_INPUT_ID = 'search_file_names_input';
const CREATE_SOURCE_NAME_INPUT_ID = 'create_source_name_input';

const CURRENT_SOURCE_NAME_INPUT_ID = 'current_source_name_input';
const CURRENT_VIEW_NAME_INPUT_ID = 'current_view_name_input';

const RENAME_SOURCE_LIST_ITEM_INPUT_ID_PREFIX = 'rename_source_list_item_input_';
const RENAME_VIEW_LIST_ITEM_INPUT_ID_PREFIX = 'rename_view_list_item_input_';

const getRenameInputIdFunctions = {
  [RENAME_INPUT_TYPES.CURRENT_SOURCE]: () => CURRENT_SOURCE_NAME_INPUT_ID,
  [RENAME_INPUT_TYPES.CURRENT_VIEW]: () => CURRENT_VIEW_NAME_INPUT_ID,
  [RENAME_INPUT_TYPES.SOURCE_LIST_ITEM]: fileId => RENAME_SOURCE_LIST_ITEM_INPUT_ID_PREFIX + fileId.sourceId,
  [RENAME_INPUT_TYPES.VIEW_LIST_ITEM]: fileId => RENAME_VIEW_LIST_ITEM_INPUT_ID_PREFIX + getFileIdKeyStr(fileId),
};

class Navigator extends React.Component {
  
  state = {
    [SEARCH_FILE_NAMES_INPUT_ID]: '',
    [CREATE_SOURCE_NAME_INPUT_ID]: '',
    filesList: null,
    nextNewFileIds: null,
  };

  constructor(props) {
    super(props);
    this.state.filesList = doGetFilesList();
    if (!this.state.filesList) {
      alert('failed to retrieve files list');
      this.state.filesList = {};
    }
    if (props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
      this.state.nextNewFileIds = calculateLocalStorageNextNewFileIds(this.state.filesList);
    }
  };

  getSourceName = fileId => validateFileIdObj(fileId) && this.state.filesList.hasOwnProperty(fileId.sourceId)
      ? this.state.filesList[fileId.sourceId].name : '';
  
  getViewName = fileId => getFileType(fileId) === FILE_TYPE.VIEW &&
    this.state.filesList.hasOwnProperty(fileId.sourceId) &&
    this.state.filesList[fileId.sourceId].viewsList.hasOwnProperty(fileId.viewId)
      ? this.state.filesList[fileId.sourceId].viewsList[fileId.viewId].name : '';

  getFileName = fileId => getFileType(fileId) === FILE_TYPE.VIEW
    ? this.getViewName(fileId) : this.getSourceName(fileId);

  handleClearInputState = inputId => {
    document.getElementById(inputId).value = '';
    this.setState({ [inputId]: '' });
  };

  handleResetRenameInput = (inputType, fileId) => {
    if (!validateFileIdObj(fileId)) { return; }
    const input = document.getElementById(getRenameInputIdFunctions[inputType](fileId));
    input.value = this.getFileName(fileId);
    input.setSelectionRange(0, 0);
    if (
      this.props.renamingInputState.inputType === inputType &&
      this.props.renamingInputState.fileId.sourceId === fileId.sourceId &&
      this.props.renamingInputState.fileId.viewId === fileId.viewId
    ) { this.props.dispatchSetRenamingInputStateAction(NO_RENAMING_INPUT_STATE); }
  };

  handleStartRenaming = (inputType, fileId) => {
    this.props.dispatchSetRenamingInputStateAction({ inputType, fileId });
    const inputId = getRenameInputIdFunctions[inputType](fileId);
    defer(() => {
      const input = document.getElementById(inputId);
      input.focus();
      input.setSelectionRange(0, input.value.length);
    });
  };

  handleUpdateSearchInputState = () => {
    this.setState({ [SEARCH_FILE_NAMES_INPUT_ID]: document.getElementById(SEARCH_FILE_NAMES_INPUT_ID).value.trim() });
  };

  handleCreateNewSource = () => {
    if (!this.state[CREATE_SOURCE_NAME_INPUT_ID]) { return false; }
    const nextNewSourceId = this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE
      ? this.state.nextNewFileIds.source : null;
    const newFilesList = {...this.state.filesList};
    const newSource = doCreateNewSource(this.state[CREATE_SOURCE_NAME_INPUT_ID], nextNewSourceId);
    if (!newSource) {
      alert('failed to create new source');
      return false;
    }
    newFilesList[newSource.id] = { name: newSource.name, viewsList: {} };
    this.setState({ filesList: newFilesList });
    if (this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
      doSetLocalStorageSourceIdNames(convertFilesListStateToFileIdNamesList(newFilesList));
      this.setState({
        nextNewFileIds: {
          source: calculateLocalStorageNextNewId(newFilesList, parseInt(nextNewSourceId)),
          nextNewViewIdsForSourceIds: this.state.nextNewFileIds.nextNewViewIdsForSourceIds,
        },
      });
    }
    defer(() => { handleSetCurrentOpenFileId({ sourceId: newSource.id, viewId: 0 }); });
    return true;
  };

  handleDeleteFile = fileId => {
    const fileType = getFileType(fileId);
    if (!fileType) { return false; }
    if (
      fileId.sourceId === this.props.currentOpenFileId.sourceId &&
      fileId.viewId === this.props.currentOpenFileId.viewId
    ) { handleSetCurrentOpenFileId(NO_OPEN_FILE_ID); }
    const newFilesList = {...this.state.filesList};
    if (fileType !== FILE_TYPE.SOURCE) {
      if (!doDeleteView(fileId.sourceId, fileId.viewId)) {
        alert('failed to delete view');
        return false;
      }
      const newSourceViewsList = {...newFilesList[fileId.sourceId].viewsList}
      delete newSourceViewsList[fileId.viewId];
      newFilesList[fileId.sourceId] = { name: newFilesList[fileId.sourceId].name, viewsList: newSourceViewsList };
      if (this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
        doSetLocalStorageSourceViewsList(fileId.sourceId, newSourceViewsList);
      }
    } else {
      if (!doDeleteSource(fileId.sourceId, Object.keys(newFilesList[fileId.sourceId].viewsList))) {
        alert('failed to delete source');
        return false;
      }
      delete newFilesList[fileId.sourceId];
      if (this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
        doSetLocalStorageSourceIdNames(convertFilesListStateToFileIdNamesList(newFilesList));
        const newNextNewViewIdsForSourceIds = {...this.state.nextNewFileIds.nextNewViewIdsForSourceIds};
        delete newNextNewViewIdsForSourceIds[fileId.sourceId];
        this.setState({
          nextNewFileIds: {
            source: this.state.nextNewFileIds.source,
            nextNewViewIdsForSourceIds: newNextNewViewIdsForSourceIds,
          },
        });
      }
    }
    this.setState({ filesList: newFilesList });
    return true;
  }

  handleRenameFile = (inputType, fileId) => {
    const fileType = getFileType(fileId);
    if (!fileType) { return false; }
    const input = document.getElementById(getRenameInputIdFunctions[inputType](fileId));
    if (!input) { return false; }
    const newName = input.value.trim();
    if (!newName) { return false; }
    if (newName !== this.getFileName(fileId)) {
      const newFilesList = {...this.state.filesList};
      if (fileType !== FILE_TYPE.SOURCE) {
        if (!doRenameView(fileId.sourceId, fileId.viewId, newName)) {
          alert('failed to rename view');
          return false;
        }
        const newSourceViewsList = {...newFilesList[fileId.sourceId].viewsList}
        newSourceViewsList[fileId.viewId] = { ...newSourceViewsList[fileId.viewId], name: newName };
        newFilesList[fileId.sourceId] = { name: newFilesList[fileId.sourceId].name, viewsList: newSourceViewsList };
        if (this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
          doSetLocalStorageSourceViewsList(fileId.sourceId, newSourceViewsList);
        }
      } else {
        if (!doRenameSource(fileId.sourceId, newName)) {
          alert('failed to rename source');
          return false;
        }
        newFilesList[fileId.sourceId] = { name: newName, viewsList: newFilesList[fileId.sourceId].viewsList };
        if (this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE) {
          doSetLocalStorageSourceIdNames(convertFilesListStateToFileIdNamesList(newFilesList));
        }
      }
      this.setState({ filesList: newFilesList });
    }
    return true;
  }

  componentDidMount = () => {
    const storedInitialFileId = convertStrValueOrDefault(
      localStorage.getItem(INITIAL_FILE_ID_LOCAL_STORAGE_KEY),
      {},
      'invalid initialFileId',
    );
    const initialFileId = {
      sourceId: storedInitialFileId.hasOwnProperty('sourceId')
        ? storedInitialFileId.sourceId : NO_OPEN_FILE_ID.sourceId,
      viewId: storedInitialFileId.hasOwnProperty('viewId') ? storedInitialFileId.viewId : NO_OPEN_FILE_ID.viewId,
    }
    if (
      initialFileId.sourceId !== this.props.currentOpenFileId.sourceId ||
      initialFileId.viewId !== this.props.currentOpenFileId.viewId
    ) { handleSetCurrentOpenFileId(initialFileId); }
  };

  componentDidUpdate = prevProps => {
    if (
      prevProps.currentOpenFileId.sourceId !== this.props.currentOpenFileId.sourceId ||
      prevProps.currentOpenFileId.viewId !== this.props.currentOpenFileId.viewId
    ) {
      document.getElementById(CURRENT_SOURCE_NAME_INPUT_ID).value = this.getSourceName(this.props.currentOpenFileId);
      document.getElementById(CURRENT_VIEW_NAME_INPUT_ID).value = this.getViewName(this.props.currentOpenFileId);
    }
  };
  
  renameInput = ({ inputType, fileId, ...remainingProps }) => {
    const fileType = getFileType(fileId);
    const inputId = getRenameInputIdFunctions[inputType](fileId);
    const value = this.getFileName(fileId);
    return (
      <input
        id={inputId}
        defaultValue={value}
        placeholder={value}
        disabled={
          !fileType || this.props.renamingInputState.inputType !== inputType ||
          this.props.renamingInputState.fileId.sourceId !== fileId.sourceId ||
          this.props.renamingInputState.fileId.viewId !== fileId.viewId
        }
        onBlur={event => {
          if (this.handleRenameFile(inputType, fileId)) { this.handleResetRenameInput(inputType, fileId); }
          else { event.target.focus(); }
        }}
        onKeyDown={event => { if (event.key === 'Escape') { this.handleResetRenameInput(inputType, fileId); } }}
        onKeyPress={event => { if (event.key === 'Enter') { event.target.blur(); } }}
        {...remainingProps}
      />
    );
  };

  renameButton = ({ inputType, fileId, ...remainingProps }) => {
    const fileType = getFileType(fileId);
    return (
      <button
        className="MonospaceCharButton"
        title="rename"
        hidden={
          this.props.renamingInputState.inputType === inputType &&
          this.props.renamingInputState.fileId.sourceId === fileId.sourceId &&
          this.props.renamingInputState.fileId.viewId === fileId.viewId
        }
        disabled={!fileType}
        onClick={() => { this.handleStartRenaming(inputType, fileId); }}
        {...remainingProps}>
        {'*'}
      </button>
    );
  };

  fileListItemButtonRow = ({ inputType, fileId }) => {
    const fileName = this.getFileName(fileId);
    const currentlyOpen = fileId.sourceId === this.props.currentOpenFileId.sourceId &&
      fileId.viewId === this.props.currentOpenFileId.viewId;
    const renameComponentProps = { inputType, fileId };
    return (
      <div className="ButtonRow">
        {
          this.props.renamingInputState.inputType !== inputType ||
          this.props.renamingInputState.fileId.sourceId !== fileId.sourceId ||
          this.props.renamingInputState.fileId.viewId !== fileId.viewId
            ? <button
                title={(currentlyOpen ? 'currently ' : '') + 'open'}
                disabled={currentlyOpen}
                onClick={() => { handleSetCurrentOpenFileId(fileId); }}>
                <span style={{ fontStyle: currentlyOpen ? 'italic' : 'normal' }}>
                  {
                    this.state[SEARCH_FILE_NAMES_INPUT_ID]
                      ? <React.Fragment>
                          {
                            fileName.split(this.state[SEARCH_FILE_NAMES_INPUT_ID]).reduce(
                              (partial, substring, idx) => partial.concat([
                                ...(idx > 0 ? [<b key={idx}>{this.state[SEARCH_FILE_NAMES_INPUT_ID]}</b>] : []),
                                substring,
                              ]),
                              [],
                            )
                          }
                        </React.Fragment>
                      : fileName
                  }
                </span>
              </button>
            : <this.renameInput {...renameComponentProps} />
        }
        <this.renameButton {...renameComponentProps} />
        <button
          className="MonospaceCharButton"
          title="delete"
          onClick={() => {
            if (
              getFileType(fileId) !== FILE_TYPE.SOURCE || window.confirm('confirm delete source "' + fileName + '"')
            ) { this.handleDeleteFile(fileId); }
          }}>
          {'-'}
        </button>
      </div>
    );
  };

  render = () => {
    const currentOpenFileType = getFileType(this.props.currentOpenFileId);
    const currentSourceRenameComponentProps = {
      inputType: RENAME_INPUT_TYPES.CURRENT_SOURCE,
      fileId: { sourceId: this.props.currentOpenFileId.sourceId, viewId: 0 },
    };
    const currentViewRenameComponentProps = {
      inputType: RENAME_INPUT_TYPES.CURRENT_VIEW,
      fileId: this.props.currentOpenFileId,
    };
    const numFiles = countNumFiles(this.state.filesList);
    const filteredFilesList = this.state[SEARCH_FILE_NAMES_INPUT_ID]
      ? doFileNamesSearch(this.state.filesList, this.state[SEARCH_FILE_NAMES_INPUT_ID]) : this.state.filesList;
    const numFilteredFiles = countNumFiles(filteredFilesList);
    return (
      <div className="SidePane">
        <div id="current_file_container">
          <div className="InputRow">
            {currentOpenFileType ? <this.renameButton {...currentSourceRenameComponentProps} /> : null}
            <this.renameInput {...currentSourceRenameComponentProps} title="current open source" />
          </div>
          <div className="InputRow">
            {
              currentOpenFileType && currentOpenFileType !== FILE_TYPE.SOURCE
                ? <this.renameButton {...currentViewRenameComponentProps} /> : null
            }
            <this.renameInput {...currentViewRenameComponentProps} title="current open view" />
          </div>
        </div>
        <div id="file_list_container">
          <div className="InputRow" id="search_file_names_input_row">
            <input
              id={SEARCH_FILE_NAMES_INPUT_ID}
              title="search file names"
              placeholder="search file names"
              onChange={debounce(this.handleUpdateSearchInputState, 150)}
              onKeyPress={event => { if (event.key === 'Enter') { event.target.blur(); } }}
              onKeyDown={event => { if (event.key === 'Escape') { event.target.blur(); } }}
            />
            <button
              className="MonospaceCharButton"
              title="clear"
              disabled={!this.state[SEARCH_FILE_NAMES_INPUT_ID]}
              onClick={() => { this.handleClearInputState(SEARCH_FILE_NAMES_INPUT_ID); }}>
              {'✕'}
            </button>
          </div>
          {
            Object.keys(filteredFilesList).length > 0
              ? <ul id={FILE_LIST_ID}>
                  {
                    Object.entries(filteredFilesList).map(([sourceId, { viewsList }]) =>
                      <li key={sourceId}>
                        <this.fileListItemButtonRow
                          inputType={RENAME_INPUT_TYPES.SOURCE_LIST_ITEM}
                          fileId={{ sourceId, viewId: 0 }}
                        />
                        {
                          Object.keys(viewsList).length > 0
                            ? <ul>
                                {
                                  Object.keys(viewsList).map(viewId => {
                                    const fileId = { sourceId, viewId };
                                    return (
                                      <li key={getFileIdKeyStr(fileId)}>
                                        <this.fileListItemButtonRow
                                          inputType={RENAME_INPUT_TYPES.VIEW_LIST_ITEM}
                                          fileId={fileId}
                                        />
                                      </li>
                                    );
                                  })
                                }
                              </ul>
                            : null
                        }
                      </li>
                    )
                  }
                </ul>
              : <div className="PlaceholderDivWithText" id="no_files_placeholder">
                  no files
                </div>
          }
          <div
            className="PlaceholderDivWithText"
            id="filtered_files_placeholder"
            hidden={!this.state[SEARCH_FILE_NAMES_INPUT_ID]}>
            {(numFiles - numFilteredFiles) + ' of ' + (numFiles) + ' files hidden by search'}
          </div>
          <div className="InputRow" id="create_source_name_input_row">
            <input
              id={CREATE_SOURCE_NAME_INPUT_ID}
              title="new source name"
              placeholder="new source name"
              onChange={event => { this.setState({ [CREATE_SOURCE_NAME_INPUT_ID]: event.target.value }); }}
              onKeyPress={event => {
                if (event.key === 'Enter' && this.handleCreateNewSource()) {
                  this.handleClearInputState(CREATE_SOURCE_NAME_INPUT_ID);
                  this.handleClearInputState(SEARCH_FILE_NAMES_INPUT_ID);
                }
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  this.handleClearInputState(CREATE_SOURCE_NAME_INPUT_ID);
                  event.target.blur();
                }
              }}
            />
            <button
              className="MonospaceCharButton"
              title="create"
              disabled={!this.state[CREATE_SOURCE_NAME_INPUT_ID]}
              onClick={() => {
                if (this.handleCreateNewSource()) {
                  this.handleClearInputState(CREATE_SOURCE_NAME_INPUT_ID);
                  this.handleClearInputState(SEARCH_FILE_NAMES_INPUT_ID);
                }
              }}>
              {'+'}
            </button>
          </div>
        </div>
        <div id="user_controls_container">
          <button
            onClick={() => {
              this.dispatchSetBackendModeAction(
                this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE
                  ? getUserSignedInStatus() : BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE
              );
            }}>
            {
              'Switch to ' +
              (
                this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.LOCAL_STORAGE
                  ? 'cloud' : 'local'
              ) + ' storage'
            }
          </button>
          {
            this.props.backendModeSignedInStatus === BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_IN
              ? <button
                  onClick={() => {
                    Cookies.remove(ACCESS_TOKEN_COOKIE_KEY);
                    this.props.dispatchSetBackendModeSignedInStatusAction(
                      BACKEND_MODE_SIGNED_IN_STATUS.USER_SIGNED_OUT
                    );
                  }}>
                  Sign out
                </button>
              : null
          }
        </div>
      </div>
    );
  };
};

export default connect(
  state => ({
    currentOpenFileId: state.currentOpenFileId,
    renamingInputState: state.renamingInputState,
    backendModeSignedInStatus: state.backendModeSignedInStatus,
  }),
  dispatch => ({
    dispatchSetRenamingInputStateAction:
      renamingInputState => dispatch(setRenamingInputStateAction(renamingInputState)),
    dispatchSetBackendModeSignedInStatusAction: mode => dispatch(setBackendModeSignedInStatusAction(mode)),
  }),
)(Navigator);
