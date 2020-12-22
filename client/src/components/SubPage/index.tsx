import React from "react";
import ArrowBackIos from "@material-ui/icons/ArrowBackIos";
import { history } from "utils";

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
      <div className="page">
        <div className={"container mx-auto pb-16" + containerClassName}>
          <div className="mt-4 flex items-center">
            <div
              className="flex items-center gray-color cursor-pointer"
              onClick={this.handleClick}
            >
              <ArrowBackIos className="text-14" />
              <span className="ml-1">返回</span>
            </div>
            <div className="text-blue-400 text-16 ml-6">
              {renderTitle()}
            </div>
          </div>
          <div className="mt-4 bg-white py-6 px-16 content-contain">
            {children}
          </div>
        </div>
        <style jsx>{`
          .page {
            overflow: hidden;
            min-height: 90vh;
          }
          .page .container {
            width: 960px;
            max-width: 90%;
          }
          @media screen and (max-width: 975px) {
            .content-contain {
              padding-right: 16px !important;
              padding-left: 16px !important;
            }
          }
        `}</style>
      </div>
    );
  }
}
