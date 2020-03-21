/**
 * Created by michbil on 30.06.17.
 */

import React from 'react';
import { Tab, Tabs, Row, Col, Nav, NavItem, Button, NavDropdown, MenuItem } from 'react-bootstrap';
import Externals from './Externals';
import {FeedList} from './FeedList';
import {DeviceProfile} from './DeviceProfile';
import Dashboard from './Dashboard';
import ReadItLater from './ReadItLater';
import { StayOnTopElement } from './utils/domutils';
import * as global from "../global";
import {
  pageEltHt,
  scrollTop,
  addClass,
  removeClass,
  getElementDimensions,
} from './utils/domutils';
import { findDOMNode } from 'react-dom';
import EditExternal from 'CoreEditor/containers/EditExternal';
const changeUrlToUrlForEdit = require('./utils/change_url_to_url_for_edit');
import { connect } from 'react-redux';
import { loadFeed } from '../../base/actions/actions';
import ProvideLink from '../components/BackToTheProvidersPageButton.js';
import linkBuilder from './utils/linkBuilder/linkCreator.js';
const HEADER_PADDING = 15; // variable set in CSS

class ArticleTabs extends StayOnTopElement {

  constructor() {
    super();
    this.state = {
      activeKey: 'home'
    }
  }

  componentDidMount() {
    if (this.checkURLHash('#dashboard')) {
      this.setState({ activeKey: 'dashboard' })
    } else if (this.checkURLHash('#collection')) {
      this.setState({ activeKey: 'collection' })
    } else if (this.checkURLHash('#feed')) {
      this.setState({ activeKey: 'feed' })
    } else if (this.checkURLHash('#deviceProfile')) {
      this.setState({ activeKey: 'deviceProfile' })
    } else {
      this.setState({ activeKey: 'home' })
    }
  }

  checkURLHash(hash) {
     return window.location.href.includes(hash);
  }

  handleScroll() {
    const elem = this.refs.subcontainer;
    const container = findDOMNode(this.refs.container); // THIS IS WRONG! figure out how to use ref instead
    const offset = getElementDimensions(container).top;

    const sz1 = offset - 30;
    const sz2 = scrollTop();
    //    console.log(`${sz1} <= ${sz2}`);
    if (sz1 <= sz2) {
      addClass(elem, 'tabbar-fixed-top');
      this.refs.placeholder.style.display = 'block';
      this.refs.placeholder.style.height =
        `${getElementDimensions(elem).height - HEADER_PADDING}px`;
      const wd = `${getElementDimensions(container).width - HEADER_PADDING * 2}px`;
      this.refs.subcontainer.style.width = wd;
    } else {
      removeClass(elem, 'tabbar-fixed-top');
      this.refs.placeholder.style.display = 'none';
      this.refs.subcontainer.style.width = 'auto';
    }
  }

  tabNavigation(data, keyName, URL) {
   if(this.state.activeKey != keyName) {
   this.setState({ activeKey: keyName });
   }
   linkBuilder(data, keyName, URL);
  }

  render() {
    const center = this.props.center,
      externals = this.props.externals,
      editAllowed = this.props.editAllowed,
      feed = this.props.feed.dataFeedElement || [],
      sensorData = this.props.sensorData,
      
      //RIL = this.props.RIL,
      providerLink = this.props.feedDataProvider,
      tabKey = this.props.tabKey;
      console.log(this.state.activeKey);
      global.setValue(this.state.activeKey);
      console.log('IN TAB JS GEO COOR', this.props.geoCoordinates);
    const handleSelect = e => console.log(e);
    const externalsEnabled = externals.length > 0 ? true : false;
    return (
      <Tab.Container
        ref="container"
        id="container"
        // defaultActiveKey="dashboard"
        activeKey={this.state.activeKey}
        onSelect={key => this.props.tabClick(key)}
      >
        <Row className="card card-nav-tabs">
          <div className="header header-primary" ref="subcontainer" style={{ display: 'block' }}>
            <div className="nav-tabs-navigation">
              <div className="nav-tabs-wrapper">
                <Nav bsStyle="tabs">
                  <NavItem eventKey="home" onClick={e => this.tabNavigation({}, 'home', '#home')}>
                    Home
                    <div className="ripple-container" />
                  </NavItem>

                  {editAllowed && (
                    <NavItem onClick={e =>this.tabNavigation({}, 'edit', '#edit')}
                      eventKey="edit"
                      onClick={() => {
                        // go to standalone editor URL
                        window.location.href = changeUrlToUrlForEdit(window.location.href);
                      }}
                    >
                      <i className="material-icons">edit</i>Edit
                      <div className="ripple-container" />
                    </NavItem>
                  )}

                  {(sensorData.length > 0) && (
                    <NavItem onClick={e =>this.tabNavigation({}, 'dashboard', '#dashboard')}
                      eventKey="dashboard"
                      disabled={!sensorData.length > 0}
                      className={""}
                    >
                      Dashboard
                      <div className="ripple-container" />
                    </NavItem>
                  )}

                  {(feed.length > 0) && (
                    <NavItem onClick={e =>this.tabNavigation({}, 'deviceProfile', '#deviceProfile')}
                      eventKey="deviceProfile"
                      disabled={!feed.length > 0}
                      className={""}
                    >
                      Device Profile
                      <div className="ripple-container" />
                    </NavItem>
                  )}  

                  {(feed.length > 0) && (
                    <NavItem onClick={e =>this.tabNavigation({}, 'feed', '#feed')}
                      eventKey="feed"
                      disabled={!feed.length > 0}
                      className={""}
                    >
                      Feed
                      <div className="ripple-container" />
                    </NavItem>
                  )}

                  {(externalsEnabled && externals.length > 0) && (
                    <NavItem onClick={e =>this.tabNavigation({}, 'collection', '#collection')}
                      eventKey="collection"
                      disabled={!externalsEnabled}
                      className={!externalsEnabled ? 'disabled' : ''}
                    >
                      Collection
                      <div className="ripple-container" />
                    </NavItem>
                  )}
                  {/*
                    RIL && RIL.length > 0 && (
                      <NavItem eventKey="ReadLater">
                        Read later <label>{RIL.length}</label>
                        <div className="ripple-container" />
                      </NavItem>
                    )
                  */}
                </Nav>
              </div>
            </div>
          </div>

          <Tab.Content animation className="card-content">
            <Tab.Pane eventKey="home">{providerLink != undefined ? <ProvideLink providerLink={providerLink}/>:null}{center}</Tab.Pane>
            {
              <Tab.Pane eventKey="collection">
                {this.props.editMode && <EditExternal />}
                {externals.map(data => <Externals data={data.blocks} />)}
              </Tab.Pane>
            }
            {
              <Tab.Pane eventKey="dashboard">
                {
                  <Dashboard geoCoordinates={this.props.geoCoordinates} sensorData={sensorData}/>                
                }
              </Tab.Pane>
            }
            {
              <Tab.Pane eventKey="feed">
                {
                  <FeedList feed={feed}/>                
                }
              </Tab.Pane>
            }
                        {
              <Tab.Pane eventKey="deviceProfile">
                {
                  <DeviceProfile />                
                }
              </Tab.Pane>
            }
            {/*
              RIL &&
              RIL.length > 0 && (
                <Tab.Pane eventKey="ReadLater">
                  <ReadItLater RIL={RIL} />
                </Tab.Pane>
              )
            */}
          </Tab.Content>
        </Row>
      </Tab.Container>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadFeed: (url) => {
      dispatch(loadFeed(url))
    }
  }
} 

const mapStateToProps = state => ({
  feedDataProvider: state.document.feed.provider,
  geoCoordinates: state.document.geoCoordinates
});

export default connect(mapStateToProps, mapDispatchToProps)(ArticleTabs);