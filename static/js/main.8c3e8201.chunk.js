(this.webpackJsonpyada=this.webpackJsonpyada||[]).push([[0],{124:function(e,t,r){e.exports=r(364)},134:function(e,t,r){},135:function(e,t,r){},364:function(e,t,r){"use strict";r.r(t);var a=r(0),o=r.n(a),n=r(35),l=r(27),s=(r(134),r(135),r(36)),i=r(38),c=r(39),d={type:"TOGGLE_EDITOR_READ_ONLY"},p={type:"TOGGLE_EDITOR_DARK_MODE"},m="CHANGE_FILE_NAME_KEY",u=function(e){return{type:"CHANGE_FILE_NAME_KEY",fileNameKey:e}},g="SET_TAG_FILTERS",y=function(e){return{type:"SET_TAG_FILTERS",tagFilters:e}},E=r(57),f=r.n(E);function _(e){return e[0]}var I={Lexer:void 0,ParserRules:[{name:"Main",symbols:["Expression"],postprocess:_},{name:"Expression",symbols:["Expression_"],postprocess:_},{name:"Expression",symbols:["Factor"],postprocess:_},{name:"Expression_",symbols:["Factor","_",{literal:"|",pos:30},"_","Expression"],postprocess:function(e){return[e[0],e[2],e[4]]}},{name:"Factor",symbols:["Factor_"],postprocess:_},{name:"Factor",symbols:["Term"],postprocess:_},{name:"Factor_",symbols:["Term","_",{literal:"&",pos:60},"_","Factor"],postprocess:function(e){return[e[0],e[2],e[4]]}},{name:"Term",symbols:["Not"],postprocess:_},{name:"Term",symbols:["Nested"],postprocess:_},{name:"Term",symbols:["Tag"],postprocess:_},{name:"Not$subexpression$1",symbols:["Nested"],postprocess:_},{name:"Not$subexpression$1",symbols:["Tag"],postprocess:_},{name:"Not",symbols:[{literal:"!",pos:92},"Not$subexpression$1"]},{name:"Nested",symbols:[{literal:"(",pos:110},"_","Expression","_",{literal:")",pos:118}],postprocess:function(e){return e[2]}},{name:"Tag$string$1",symbols:[{literal:"#"},{literal:"{"}],postprocess:function(e){return e.join("")}},{name:"Tag$ebnf$1",symbols:[/[^{}]/]},{name:"Tag$ebnf$1",symbols:[/[^{}]/,"Tag$ebnf$1"],postprocess:function(e){return[e[0]].concat(e[1])}},{name:"Tag",symbols:["Tag$string$1","Tag$ebnf$1",{literal:"}",pos:131}],postprocess:function(e){return[e[0],e[1].join(""),e[2]].join("")}},{name:"_$ebnf$1",symbols:[]},{name:"_$ebnf$1",symbols:[{literal:" ",pos:139},"_$ebnf$1"],postprocess:function(e){return[e[0]].concat(e[1])}},{name:"_",symbols:["_$ebnf$1"],postprocess:function(e){return null}}],ParserStart:"Main"},b=function(e){!(arguments.length>1&&void 0!==arguments[1])||arguments[1];var t=null;if(e){var r=new f.a.Parser(f.a.Grammar.fromCompiled(I));try{r.feed(e.trim()),r.results.length>0&&(t=r.results)}catch(a){}}return t},F=localStorage.getItem("filesList"),T=new Set(F?JSON.parse(F):["notes"]);localStorage.setItem("filesList",JSON.stringify(Array.from(T)));var h=function(e){Object(c.a)(r,e);var t=Object(i.a)(r);function r(){var e;Object(s.a)(this,r);for(var a=arguments.length,n=new Array(a),l=0;l<a;l++)n[l]=arguments[l];return(e=t.call.apply(t,[this].concat(n))).TAG_FILTERS_INPUT_ID="tag_filters_input",e.FILE_EXPLORER_INPUT_ID="file_explorer_input",e.FILE_EXPLORER_LIST_ID="file_explorer_list",e.FILE_NAME_KEY_CHAR_REGEX=/\w/,e.handleApplyTagFilters=function(){!(arguments.length>0&&void 0!==arguments[0])||arguments[0];var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],r=document.getElementById(e.TAG_FILTERS_INPUT_ID).value.trim();if(!t||r!==e.props.tagFiltersText){var a=null;!r||(a=b(r))?e.props.setTagFilters({text:r,expr:a}):document.getElementById(e.TAG_FILTERS_INPUT_ID).value=e.props.tagFiltersText}},e.handleTagFiltersKeyPress=function(t){"Enter"===t.key&&e.handleApplyTagFilters()},e.handleToggleEditorReadOnly=function(){document.getElementById(e.TAG_FILTERS_INPUT_ID).value=e.props.editorReadOnly?"":e.props.tagFiltersText,e.handleApplyTagFilters(!1,!1),e.props.toggleEditorReadOnly()},e.handleToggleEditorDarkMode=function(){return e.props.toggleEditorDarkMode()},e.handleFileExplorerKeyPress=function(t){"Enter"===t.key&&e.handleLoadFile(),1===t.key.length&&e.FILE_NAME_KEY_CHAR_REGEX.test(t.key)||t.preventDefault()},e.handleLoadFile=function(){var t=document.getElementById(e.FILE_EXPLORER_INPUT_ID).value.trim();if(t){var r=localStorage.getItem("filesList");localStorage.setItem("filesList",JSON.stringify(Array.from(new Set(r?JSON.parse(r):[]).add(t)))),e.props.changeFileNameKey(t)}else document.getElementById(e.FILE_EXPLORER_INPUT_ID).value=e.props.fileNameKey},e.handleRemoveFile=function(){var t=document.getElementById(e.FILE_EXPLORER_INPUT_ID).value.trim();if(t!==e.props.fileNameKey){var r=localStorage.getItem("filesList"),a=new Set(r?JSON.parse(r):[]);a.delete(t)&&localStorage.removeItem("file_"+t),localStorage.setItem("filesList",JSON.stringify(Array.from(a)))}},e.render=function(){var t=localStorage.getItem("filesList"),r=(t?JSON.parse(t):[]).map((function(e){return o.a.createElement("option",{key:e},e)}));return o.a.createElement("div",{className:"Header"},o.a.createElement("div",{className:"SubHeader"},o.a.createElement("input",{type:"text",id:e.TAG_FILTERS_INPUT_ID,disabled:!e.props.editorReadOnly,placeholder:e.props.editorReadOnly?'TagFilters expr - e.g. "#{tag1} | !(#{t 2} & !(#{_3}))"':"TagFilters are only enabled in ReadOnly mode",defaultValue:e.props.editorReadOnly?e.props.tagFiltersText:"",onKeyPress:e.handleTagFiltersKeyPress}),o.a.createElement("button",{type:"button",disabled:!e.props.editorReadOnly,onClick:e.handleApplyTagFilters},"Apply TagFilters")),o.a.createElement("div",{className:"SubHeader"},o.a.createElement("input",{type:"text",id:e.FILE_EXPLORER_INPUT_ID,list:e.FILE_EXPLORER_LIST_ID,placeholder:"file name/key",defaultValue:e.props.fileNameKey,onKeyPress:e.handleFileExplorerKeyPress}),o.a.createElement("datalist",{id:e.FILE_EXPLORER_LIST_ID},r),o.a.createElement("button",{type:"button",onClick:e.handleLoadFile},"Load File"),o.a.createElement("button",{type:"button",onClick:e.handleRemoveFile},"Remove File")),o.a.createElement("div",{className:"SubHeader"},o.a.createElement("button",{type:"button",onClick:e.handleToggleEditorDarkMode},e.props.editorDarkMode?"Light":"Dark"," Theme"),o.a.createElement("button",{type:"button",onClick:e.handleToggleEditorReadOnly},"Make ",e.props.editorReadOnly?"Editable":"ReadOnly")))},e}return r}(o.a.Component),R=Object(l.b)((function(e){return{editorDarkMode:e.editorDarkMode,editorReadOnly:e.editorReadOnly,fileNameKey:e.fileNameKey,tagFiltersText:e.tagFilters.text}}),(function(e){return{toggleEditorDarkMode:function(){return e(p)},toggleEditorReadOnly:function(){return e(d)},changeFileNameKey:function(t){return e(u(t))},setTagFilters:function(t){return e(y(t))}}}))(h),v=r(118),O=r.n(v),N=r(122),S=function(e){Object(c.a)(r,e);var t=Object(i.a)(r);function r(){var e;Object(s.a)(this,r);for(var a=arguments.length,n=new Array(a),l=0;l<a;l++)n[l]=arguments[l];return(e=t.call.apply(t,[this].concat(n))).handleEditorChange=Object(N.debounce)((function(t){e.props.editorReadOnly||localStorage.setItem("file_"+e.props.fileNameKey,t())}),250),e.render=function(){var t=document.body;return t&&(t.style.backgroundColor=e.props.editorDarkMode?"#181A1B":"#FFF"),o.a.createElement(O.a,{readOnly:e.props.editorReadOnly,dark:e.props.editorDarkMode,key:e.props.fileNameKey,defaultValue:localStorage.getItem("file_"+e.props.fileNameKey)||"",tagFilters:e.props.tagFiltersExpr,onChange:e.handleEditorChange})},e}return r}(o.a.Component),L=Object(l.b)((function(e){return{editorDarkMode:e.editorDarkMode,editorReadOnly:e.editorReadOnly,fileNameKey:e.fileNameKey,tagFiltersExpr:e.tagFilters.expr}}))(S),D=function(){return o.a.createElement("div",null,o.a.createElement("div",{className:"App"},o.a.createElement(R,null),o.a.createElement(L,null)),o.a.createElement("footer",null,"\xa9 2020 FYDP-SAAC"))},k=r(123),x=r(16),A="editorReadOnly",P="editorDarkMode",K=localStorage.getItem("initialTagFilters")||"",$=b(K),M=Object(k.a)({reducer:Object(x.c)({editorDarkMode:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"Dark"===localStorage.getItem(P),t=arguments.length>1?arguments[1]:void 0;return t.type===p.type?!e:e},editorReadOnly:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"ReadOnly"===localStorage.getItem(A),t=arguments.length>1?arguments[1]:void 0;return t.type===d.type?!e:e},fileNameKey:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:localStorage.getItem("initialFileName")||"notes",t=arguments.length>1?arguments[1]:void 0;return t.type!==m?e:t.fileNameKey},tagFilters:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{text:K,expr:$},t=arguments.length>1?arguments[1]:void 0;return t.type!==g?e:t.tagFilters}})});M.subscribe((function(){localStorage.setItem(P,M.getState().editorDarkMode?"Dark":"Light"),localStorage.setItem(A,M.getState().editorReadOnly?"ReadOnly":"Editable"),localStorage.setItem("initialFileName",M.getState().fileNameKey),localStorage.setItem("initialTagFilters",M.getState().tagFilters.text||"")}));var C=M;Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));Object(n.render)(o.a.createElement(o.a.StrictMode,null,o.a.createElement(l.a,{store:C},o.a.createElement(D,null))),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[124,1,2]]]);
//# sourceMappingURL=main.8c3e8201.chunk.js.map