import React, { Component } from 'react';
import { applyMentions } from '../mixins/mentions';
import EditorComponent from '../components/EditorComponent.js';
import { ContentBlock, CharacterMetadata } from 'draft-js';

import { openLinkDialog } from '../actions/linkdialog';
import { openImageDialog } from '../actions/imagedialog';
import { openTicketDialog } from '../actions/ticketdialog';
import EntityTools from '../utils/entitytools';
import { Loading, LoadingError } from '../components/Loading';
import mkEditorActions from '../actions/indexActions';
import { gotUrlParams } from '../actions/publishActions';
import { connect } from 'react-redux';
import { parseEditingUrl , CREATE_MODE} from '../utils/url';

import LinkUrlDialog from '../containers/LinkUrlDialog';
import ImageUrlDialog from '../containers/ImageUrlDialog';
import TicketDialog from '../containers/TicketDialog';
import CoverEditingDialog from './CoverEditingDialogContainer';
import ListEditor from './ListEditorContainer';

const {
  fetchDocument, createNewDocument, fetchUserData, mainEditorChanged,
} = mkEditorActions('MAIN');


const [EDIT_URL, EDIT_RELATIVE_PATH] = parseEditingUrl();

function initCallbacks(dispatch) {
  const openEditPrompt = action => (titleValue, urlValue, descValue, linkEntityKey) => {
    const actn = action(titleValue, urlValue, descValue, linkEntityKey);
    dispatch(actn);
  };

  EntityTools.setLinkEditCallback(openEditPrompt(openLinkDialog));
  EntityTools.setImageEditCallback(openEditPrompt(openImageDialog));
}

class EditorContainer extends React.Component {
  componentDidMount() {
    const { initUrlParams, dispatch } = this.props;

    initUrlParams();
    initCallbacks(this.props.dispatch);
    if (CREATE_MODE) {
      dispatch(createNewDocument());
    } else {
      dispatch(fetchDocument(EDIT_URL));
    }
//    dispatch(fetchUserData());
    document.getElementById('loadingInd').setAttribute('style', 'display:none;');
  }

  render() {
    if (this.props.listEditor) {
      return <ListEditor />
    }
    return (
      <div className="col-xs-12 clearfix">
        {this.props.error ? <LoadingError /> : ''}
        {!this.props.isFetching ? (
          <div>
            {false && (
              <div className="well">
                <h4>You are not logged in</h4>
                <p>
                  You can still create posts. However, you need to be logged in to save access path
                  to the post and to received donates.
                </p>
                <br />
                <a className="btn btn-sm btn-primary" href="#" role="button">
                  <span className="glyphicon glyphicon-user" />Login with Twitter
                </a>
              </div>
            )}
            <EditorComponent
              editorState={this.props.editorState}
              editorName="MAIN"
              editorChanged={this.props.editorChanged}
              openImageDialog={this.props.openImageDialog}
              openLinkDialog={this.props.openLinkDialog}
              openTicketDialog={this.props.openTicketDialog}
            />

            <LinkUrlDialog />
            <ImageUrlDialog />
            <TicketDialog />
            <CoverEditingDialog />
          </div>
        ) : (
          <Loading />
        )}
      </div>
    );
  }
}

function shouldOpenPopup(user, commentsEnabled) {
  const haveEthId = user.ethereumWallet !== 'undefined';
  return !haveEthId && commentsEnabled;
}

function openPopup() {
  const domain = process.env.DOMAIN;
  const webGoldUrl = `//webgold.${domain}`;
  if (this.shouldOpenPopup()) {
    window.open(`${webGoldUrl}/create_wallet`, 'name', 'width=800,height=500');
    this.setState({
      registerPopup: true,
    });
    this.waitPopupClosed(() => {
      WrioStore.getUser().ethereumWallet = 'new'; // TODO fix hack
      this.setState({
        registerPopup: false,
      });
    });
  }
}

function waitPopupClosed(cb) {
  if (!this.shouldOpenPopup()) {
    return cb();
  }
  window.addEventListener(
    'message',
    (msg) => {
      const data = JSON.parse(msg.data);
      if (data.reload) {
        cb();
      }
    },
    false,
  );
}

function mapStateToProps(state) {
  return {
    document: state.editorDocument.document,
    editorState: state.editorDocument.editorState,
    isFetching: state.editorDocument.isFetching,
    error: state.editorDocument.error,
    listEditor: state.listEditor,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    initUrlParams: () => dispatch(gotUrlParams(CREATE_MODE, EDIT_URL, EDIT_RELATIVE_PATH)), // pass initial editing params to the store
    dispatch,
    openLinkDialog: (...args) => dispatch(openLinkDialog(...args)),
    openImageDialog: (...args) => dispatch(openImageDialog(...args)),
    openTicketDialog: (...args) => dispatch(openTicketDialog(...args)),
    editorChanged: state => dispatch(mainEditorChanged(state)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditorContainer);
