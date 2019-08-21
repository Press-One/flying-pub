import React from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import { ago, isMobile } from '../../utils';

import './index.scss';

export default observer((props: any) => {
  const { feedStore } = useStore();

  React.useEffect(() => {
    if (feedStore.currentPost) {
      document.title = feedStore.currentPost.title;
    }
  });

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const bindOpenInNewTab = (e: any) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        window.open(href);
        e.preventDefault();
      }
    };
    setTimeout(() => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindOpenInNewTab);
      }
    }, 2000);

    return () => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindOpenInNewTab);
      }
    };
  }, []);

  if (!feedStore.isFetched) {
    return null;
  }

  const backToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      window.scroll(0, 0);
    }
  };

  const { guid } = props.match.params;
  feedStore.setGuid(decodeURIComponent(guid));
  const { currentPost: post } = feedStore;

  return (
    <div className="post po-fade-in">
      {!isMobile && (
        <Link to={`/${feedStore.rssUrl}`}>
          <div className="back-btn flex h-center gray-color po-cp">
            <ArrowBackIos /> 返回
          </div>
        </Link>
      )}
      <h2 className={`po-text-${isMobile ? '24' : '26'} dark-color push-none title po-height-15`}>
        {post.title}
      </h2>
      <div className={`push-top gray-color po-text-${isMobile ? '14' : '16'}`}>
        用户名 | {ago(post.pubDate)}
      </div>
      <div
        className={`push-top-lg po-text-18 black-color markdown-body pad-bottom-md`}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      {!isMobile && (
        <div className="back-top-btn flex v-center gray-color po-cp po-text-22" onClick={backToTop}>
          <ArrowUpward />
        </div>
      )}
    </div>
  );
});
