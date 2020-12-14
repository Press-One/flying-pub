import React from "react";
import ArrowBackIos from "@material-ui/icons/ArrowBackIos";
import { history } from "utils";

import "./index.scss";

export default class extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.props.backPath) {
      history.push(this.props.backPath);
    } else if (history.length === 1) {
      history.push("/hub");
    } else {
      history.goBack();
    }
  }

  render() {
    const { children, renderTitle, containerClassName = "" } = this.props;
    return (
      <div className="bg-page-bg page pad-bottom-xxl">
        <div className={"po-center po-width-960 " + containerClassName}>
          <div className="navigator push-top flex v-center">
            <div
              className="flex v-center gray-color po-cp"
              onClick={this.handleClick}
            >
              <ArrowBackIos className="po-text-14" />
              <span className="push-left-xs">返回</span>
            </div>
            <div className="headline-color po-text-16 push-left-md">
              {renderTitle()}
            </div>
          </div>
          <div className="push-top bg-white-color pad-top-md pad-bottom-md pad-left-xxl pad-right-xxl content-contain">
            {children}
          </div>
        </div>
      </div>
    );
  }
}
