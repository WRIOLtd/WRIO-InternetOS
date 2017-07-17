import React from 'react';
import Reflux from 'reflux';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier, convertToRaw} from 'draft-js';
import SaveActions from '../saveActions';
import {deleteFromS3} from '../webrunesAPI.js';

import Alert from '../components/Alert.js';

import LinkUrlDialog from '../containers/LinkUrlDialog.js';
import ImageUrlDialog from '../containers/ImageUrlDialog.js';
import PostSettings from '../components/Postsettings.js';
import EntityTools,{getSelection} from '../utils/entitytools'

import {BlockStyleControls,InlineStyleControls,ActionButton} from '../components/EditorControls'
import {editorChanged,publishDocument,deleteDocument} from '../actions/index'



class CoreEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error:false
        };


        this.handleKeyCommand   = this.handleKeyCommand.bind(this);
        this.toggleBlockType    = this.toggleBlockType.bind(this);
        this.toggleInlineStyle  = this.toggleInlineStyle.bind(this);
        this.onLinkControlClick = this.onLinkControlClick.bind(this);
        this.onImageControlClick = this.onImageControlClick.bind(this);

        setTimeout(this.focus.bind(this),200);
        window.editorFocus = this.onFocus.bind(this);
    }



    handleChange (editorState) {
        console.log(convertToRaw(editorState.getCurrentContent()));
        this.props.dispatch(editorChanged(editorState));
    }

    focus() {
        this.refs.editor.focus();
    }
    onFocus()
    {
        setTimeout(() => this.focus(), 0);
    }

    onLinkControlClick() {
        var title = getSelection(this.props.editorState);
        this.props.dispatch(openLinkDialog(title,"",""))
    }

    onImageControlClick() {
        var title =  getSelection(this.props.editorState);
        this.props.dispatch(openImageDialog(title,"",""))
    }


    handleKeyCommand(command) {
        const editorState = this.props.editorState;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.props.dispatch(editorChanged(newState));
            return true;
        }
        return false;
    }

    toggleBlockType(blockType) {
        this.props.dispatch(editorChanged((
            RichUtils.toggleBlockType(
                this.props.editorState,
                blockType
            )
        )));
    }

    toggleInlineStyle(inlineStyle) {
        this.props.dispatch(editorChanged((
            RichUtils.toggleInlineStyle(
                this.props.editorState,
                inlineStyle
            )
        )));
    }


    componentDidUpdate () {
        window.frameReady();
    }

    myKeyBindingFn(e) {
      if (e.keyCode === 13) {
        window.frameReady();
      }
      return getDefaultKeyBinding(e);
    }

    render() {
        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'RichEditor-editor';
        var contentState = this.props.editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }

        const about = this.props.doc.getElementOfType('Article').about || "";



        return (
            <div className="clearfix">
            <div >
                { this.state.error && <Alert type="danger" message="There is an error saving your file, please try again later" /> }

                {false && <div className="well">
                    <h4>You are not logged in</h4>
                    <p>You can still create posts. However, you need to be logged in to save access path to the post and to received donates.</p>
                    <br />
                    <a className="btn btn-sm btn-primary" href="#" role="button"><span
                        className="glyphicon glyphicon-user"></span>Login with Twitter</a>
                </div>}
                <div className="RichEditor-root form-group">
                  <BlockStyleControls
                    editorState={this.props.editorState}
                    onToggle={this.toggleBlockType}
                    onLinkToggle={this.onLinkControlClick}
                    onImageToggle={this.onImageControlClick}
                  />

                  { false && <InlineStyleControls
                    editorState={editorState}
                    onToggle={this.toggleInlineStyle}
                  />}
                  <LinkUrlDialog />
                  <ImageUrlDialog />
                  <div className={className} onClick={()=>this.focus}>
                    <Editor
                      blockStyleFn={getBlockStyle}
                      editorState={this.props.editorState}
                      handleKeyCommand={this.handleKeyCommand}
                      onChange={this.handleChange.bind(this)}
                      placeholder="Enter text..."
                      ref="editor"
                      spellCheck={true}
                      keyBindingFn={this.myKeyBindingFn}
                    />
                  </div>
                     <PostSettings saveUrl={this.props.editUrl}
                     onPublish={() => this.props.dispatch(publishDocument())}
                     onDelete={() => this.props.dispatch(deleteDocument())}
                     description={about}
                     commentID={this.props.commentID}
                     author={this.props.author}
                     />
                </div>
                </div>

            </div>
        );
    }





}

CoreEditor.propTypes = {
    doc: React.PropTypes.object,
    saveRelativePath: React.PropTypes.string,
    editUrl: React.PropTypes.string,
    author: React.PropTypes.string,
};


function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote':
            return 'RichEditor-blockquote';
        default:
            return null;
    }
}


export default CoreEditor;
/*
// hack to supppress warnings
console.error = (function() {
    var error = console.error;

    return function(exception) {
        if ((exception + '').indexOf('Warning: A component is `contentEditable`') != 0) {
            error.apply(console, arguments);
        }
    };
})();
*/

/*
if (this.state.registerPopup) {
    return (<div className="well">
        <h4> To enable comments, you need to create ethereum wallet. Please do it in the popup window.</h4>
        <button className="btn btn-success" onClick={()=>this.setState({ registerPopup: false})}> Back </button>
    </div>);
}*/



function shouldOpenPopup() {
    const haveEthId = typeof WrioStore.getUser().ethereumWallet !== "undefined";
    return !haveEthId && WrioStore.areCommentsEnabled();
}

function openCreateWalletPopup() {
    const domain = process.env.DOMAIN;
    const webGoldUrl = `//webgold.${domain}`;
    if (this.shouldOpenPopup()) {
        window.open(webGoldUrl+'/create_wallet','name','width=800,height=500');
        this.setState({
            registerPopup: true
        });
        this.waitPopupClosed(() => {
            WrioStore.getUser().ethereumWallet="new"; // TODO fix hack
            this.setState({
                registerPopup: false
            });
        });
    }
}

function waitPopupClosed(cb) {
    if (!this.shouldOpenPopup()) {
        return cb();
    }
    window.addEventListener("message", (msg) => {
        const data = JSON.parse(msg.data);
        if (data.reload) {
            cb();
        }
    }, false);
}

/**
 * Pulish file to store
 * @param action 'save' or 'saveas'
 * @param storageRelativePath relative path to the user's directory
 * @param url - absolute save path, needed for widget url creation
 * @param desc - description of the document
 */
function _publish(action,storageRelativePath,url,desc) {
    console.log(storageRelativePath,desc);

    const saveAction = (commentId) => SaveActions.execSave(
        this.state.editorState,
        action,
        storageRelativePath,
        this.state.author,
        commentId,
        this.state.doc,
        desc,
        url
    );

    const doSave = (id) => saveAction(id).then(()=>{
        WrioActions.busy(false);
        this.setState({error: false});
    }).catch((err)=> {
        WrioActions.busy(false);
        this.setState({error: true});
        console.log(err);
    });

    let commentID = this.state.commentID;
    if (this.state.commentID) { // don't request comment id, if it already stored in the document
        if (!WrioStore.areCommentsEnabled()) {
            commentID = ''; // delete comment id if comments not enabled
        }
        doSave(commentID);
    } else {
        WrioActions.busy(true);
        WrioStore.requestCommentId(url,(err,id) => {
            doSave(id);
        });
    }



}

/**
 * Deletes current document
 */

function _deleteDocument(storageRelativePath) {
    WrioActions.busy(true);
    deleteFromS3(storageRelativePath).then((res)=>{
        WrioActions.busy(false);
        this.setState({
            error: false
        });
        parent.postMessage(JSON.stringify({
            "followLink": `https://wr.io/${WrioStore.getWrioID()}/Plus-WRIO-App/index.html`
        }), "*");
    }).catch((err)=>{
        WrioActions.busy(false);
        this.setState({
            error: true
        });
        console.log(err);
    });
}
