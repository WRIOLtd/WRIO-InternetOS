import React from 'react';
import ArticleLists from './ArticleLists';
import {replaceSpaces} from './CreateDomRight.js';
import SocialPost from "./SocialPost.js";

var ArticleElement = React.createClass({
    propTypes: {
        data: React.PropTypes.object.isRequired
    },

    articleBody () {
        const element = this.props.data;

        if (element.getType() === "SocialMediaPosting") {
            return <SocialPost data={element} />;
        }
        const elements = element.getBody();
        return elements.map(function (item,i) {
            return (<div className="paragraph" key={i}>
                <div className="col-xs-12 col-md-6">
                   <div>{item}</div>
                </div>
                <div className="col-xs-12 col-md-6">
                    {/*  <aside>
                        <span className="glyphicon glyphicon-comment" title="Not yet available"></span>
                    </aside> */}
                </div>
            </div>);

        }, this);
    },

    render () {
        const element = this.props.data;
        const articleName = element.getKey('name');
        let Parts;

        if (element.hasPart()) {
            Parts = this.props.data.children.map((child, key) => {
                if (child.data.url) {
                    return <ArticleLists data={child} key={key}/>;
                } else {
                    return <ArticleElement data={child} key={key}/>;
                }
            });
        }

        var chapter = replaceSpaces(element.data.name);

        return (
            <section>
                {(element.hasPart()) ?
                    <h1 className="col-xs-12 col-md-6" id={chapter}>{articleName}</h1>:
                    <h2 className="col-xs-12 col-md-6" id={chapter}>{articleName}</h2>
                }
                <div itemProp="articleBody">{this.articleBody()}</div>
                {Parts}
            </section>
        );
    }
});

export default ArticleElement;
