import React from "react";
import { observer } from 'mobx-react-lite';
import ArrowBackIos from "@material-ui/icons/ArrowBackIos";
import { useHistory } from "react-router-dom";

export default observer((props: any) => {
  const { children, renderTitle, containerClassName = "" } = props;
  const history = useHistory();
  const handleClick = () => {
    if (props.backPath) {
      history.push(props.backPath);
    } else if (history.length === 1) {
      history.push("/hub");
    } else {
      history.goBack();
    }
  }

  return (
    <div className="page">
      <div className={"container mx-auto pb-16" + containerClassName}>
        <div className="mt-4 flex items-center">
          <div
            className="flex items-center gray-color cursor-pointer"
            onClick={handleClick}
          >
            <ArrowBackIos className="text-14" />
            <span className="ml-1">返回</span>
          </div>
          <div className="text-blue-400 text-16 ml-6">
            {renderTitle()}
          </div>
        </div>
        <div className="mt-4 bg-white py-6 px-4 md:px-16">
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
      `}</style>
    </div>
  );
})
