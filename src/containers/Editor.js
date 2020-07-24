import React from 'react';
import RichMarkdownEditor from 'rich-markdown-editor';
import FilterBar from "../components/FilterBar";
import {connect} from 'react-redux';
import {debounce} from 'lodash';
import {FILE_NAME_KEY_PREFIX_LOCAL_STORAGE_KEY} from '../reducers/ChangeFileNameKey';
import {getDocument, putDocument} from '../backend/yaas'

class Editor extends React.Component {

  state = {
    defaultJSON: null,
    serverRunning: true
  }

  handleEditorChange = debounce(value => {
    if (!this.props.readOnly) {
      localStorage.setItem(FILE_NAME_KEY_PREFIX_LOCAL_STORAGE_KEY + this.props.fileNameKey, value());
    }
  }, 250);

  componentDidMount(){
    getDocument(1).then(
      data => this.setState({ defaultJSON: data })
    ).catch (() => {
      this.setState({ defaultJSON: "", serverRunning: false })
    })
  }
  
  render = () => {
    if (this.state.defaultJSON == null){
      return(<div>Loading...</div>)
    }else{
      console.log("Actual Editor")
      const {body} = document;
      if (body) body.style.backgroundColor = this.props.editorDarkMode ? '#181A1B' : '#FFF';
      if(this.state.serverRunning){
        return (
          <div className="MainPane">
            <FilterBar />
            <div className="Editor">
              <RichMarkdownEditor
                readOnly={this.props.readOnly}
                key={this.props.fileNameKey}
                defaultJSON = {this.state.defaultJSON}
                tagFilters={this.props.tagFiltersExpr}
                onSave={options => putDocument(options['doc'].toJSON(), 1)}
              />
            </div>
          </div>
        );
      }else{
        return (
          <div className="MainPane">
            <FilterBar />
            <div className="Editor">
              <RichMarkdownEditor
                readOnly={this.props.readOnly}
                key={this.props.fileNameKey}
                defaultValue={localStorage.getItem(FILE_NAME_KEY_PREFIX_LOCAL_STORAGE_KEY + this.props.fileNameKey) || ''}
                tagFilters={this.props.tagFiltersExpr}
                onChange={this.handleEditorChange}
              />
            </div>
          </div>
        );
      }
    }
  };
}

export default connect(
  state => ({ readOnly: state.readOnly, fileNameKey: state.fileNameKey, tagFiltersExpr: state.tagFilters.expr }),
)(Editor);