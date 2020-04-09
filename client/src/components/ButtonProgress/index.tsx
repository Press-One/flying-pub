import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import Done from '@material-ui/icons/Done';

interface IProps {
  size?: number;
  color?: string;
  isDoing: boolean;
  isDone?: boolean;
  noMargin?: boolean;
}

interface IState {
  isShowDone: boolean;
}

export default class ButtonProgress extends React.Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isShowDone: false,
    };
  }

  componentWillReceiveProps(nextProps: any) {
    const isDoneChangedFromFalseToTrue = !this.props.isDone && nextProps.isDone;
    if (isDoneChangedFromFalseToTrue) {
      this.setState({ isShowDone: true });
      setTimeout(() => {
        this.setState({ isShowDone: false });
      }, 1500);
    }
  }

  render() {
    const { isDoing, color = 'text-white', size = 12 } = this.props;
    const { isShowDone } = this.state;
    if (isDoing) {
      return (
        <span className={`flex justify-center items-center ${color} ml-2`}>
          <CircularProgress size={size} color="inherit" />
        </span>
      );
    }
    if (isShowDone) {
      return (
        <span className="ml-2 font-bold">
          <Done className={`${color}"`} />
        </span>
      );
    }
    return null;
  }
}
