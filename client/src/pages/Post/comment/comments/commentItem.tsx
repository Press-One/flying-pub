import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { ago, isMobile, urlify } from 'utils';
import { faComment, faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DeleteOutline from '@material-ui/icons/Close';
import Img from 'components/Img';

export default class CommentItem extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      canExpand: false,
      expand: false,
    };
    this.commentRef = React.createRef();
    this.setCanExpand = this.setCanExpand.bind(this);
  }

  private commentRef: any;

  componentDidMount() {
    this.setCanExpand();
    window.addEventListener('resize', this.setCanExpand);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setCanExpand);
  }

  setCanExpand() {
    if (
      this.commentRef.current &&
      this.commentRef.current.scrollHeight > this.commentRef.current.clientHeight
    ) {
      this.setState({
        canExpand: true,
      });
    } else {
      this.setState({
        canExpand: false,
      });
    }
  }

  render() {
    const {
      hideDivider,
      user,
      replyTo,
      upVote,
      resetVote,
      tryDeleteComment,
      comment,
      selectComment,
      highlight,
    } = this.props;
    const isOwner = !!user && comment.userId === user.id;
    return (
      <div
        className={classNames(
          {
            highlight: highlight,
            'border-b border-gray-200 duration-500 ease-in-out transition-all': !hideDivider,
          },
          'comment-item pt-4 md:pt-6 px-4',
        )}
        id={`comment_${comment.id}`}
      >
        <div className="relative">
          <div className="avatar rounded absolute top-0 left-0">
            <Link to={`/authors/${comment.user.address}`}>
              <Img
                src={comment.user.avatar}
                width="36px"
                height="36px"
                alt="avatar"
                className="rounded"
              />
            </Link>
          </div>
          <div className="ml-3 md:ml-4" style={{ paddingLeft: '36px' }}>
            <div className="flex justify-between items-start md:items-center">
              <div className="flex items-center leading-none text-gray-99 text-14">
                <div>
                  <div className="flex items-center">
                    <Link to={`/authors/${comment.user.address}`}>
                      <span
                        className={classNames(
                          { 'name-max-width block': isMobile },
                          'truncate text-13 md:text-14 text-gray-99',
                        )}
                      >
                        {comment.user.nickname}
                      </span>
                    </Link>
                  </div>
                </div>
                <span className="mx-1 w-2 text-center opacity-75">·</span>
                <span className="text-12">{ago(comment.createdAt)}</span>
                {isOwner && <span className="mx-1 w-2 text-center opacity-75">·</span>}
                {isOwner && (
                  <span
                    className="text-12 text-gray-af cursor-pointer"
                    onClick={() => tryDeleteComment(comment.id)}
                  >
                    <span className="flex items-center text-16 md:text-18">
                      <DeleteOutline />
                    </span>
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="flex items-center text-gray-88 leading-none absolute top-0 right-0 -mt-1 md:-mt-3">
                  {!isOwner && (
                    <span
                      className="flex items-center cursor-pointer text-xs p-1 w-12 md:w-16 justify-end"
                      onClick={() => replyTo(comment)}
                    >
                      <span className="flex items-center text-16 md:text-18 pr-2 md:pr-1">
                        <FontAwesomeIcon icon={faComment} />
                      </span>
                      {!isMobile && <span>回复</span>}
                    </span>
                  )}
                  <div
                    className={classNames(
                      {
                        'text-blue-400': comment.voted,
                      },
                      'flex items-center justify-end cursor-pointer p-1 pr-0 w-12 md:w-16',
                    )}
                    onClick={() => (comment.voted ? resetVote(comment.id) : upVote(comment.id))}
                  >
                    <span className="flex items-center text-16 md:text-18 pr-1 md">
                      <FontAwesomeIcon icon={faThumbsUp} />
                    </span>
                    <span className="font-bold">{Number(comment.upVotesCount) || ''}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 pb-4 md:pb-5">
              <div className="mb-1">
                {comment.replyComment && (
                  <div
                    className="border-blue-300 pl-2 text-12 cursor-pointer md:mt-0"
                    style={{ borderLeftWidth: '3px' }}
                    onClick={() => {
                      selectComment(comment.replyComment.id, {
                        behavior: 'smooth',
                      });
                    }}
                  >
                    <div className="text-blue-400">{comment.replyComment.user.nickname}</div>
                    <div className="truncate text-gray-99">{comment.replyComment.content}</div>
                  </div>
                )}
              </div>
              <div
                className={classNames(
                  {
                    'comment-expand': this.state.expand,
                  },
                  'comment-body comment text-gray-1e break-words whitespace-pre-wrap',
                )}
                onClick={() => isMobile && replyTo(comment)}
                ref={this.commentRef}
                dangerouslySetInnerHTML={{ __html: urlify(comment.content) }}
              />
              {this.state.canExpand && (
                <div
                  className="text-blue-400 cursor-pointer pt-1"
                  onClick={() => this.setState({ expand: !this.state.expand })}
                >
                  {this.state.expand ? '收起' : '展开'}
                </div>
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          .name-max-width {
            max-width: 140px;
          }
          .gray {
            color: #8b8b8b;
          }
          .dark {
            color: #404040;
          }
          .highlight {
            background: #e2f6ff;
          }
          .comment-body {
            font-size: 14px;
            line-height: 1.625;
            overflow: hidden;
            text-overflow: ellipsis;
            -webkit-line-clamp: 10;
            -webkit-box-orient: vertical;
            display: -webkit-box;
          }
          .comment-expand {
            max-height: unset !important;
            -webkit-line-clamp: unset !important;
          }
        `}</style>
      </div>
    );
  }
}
