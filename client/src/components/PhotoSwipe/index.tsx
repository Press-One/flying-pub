import React from 'react';
import 'photoswipe/dist/photoswipe.css';
import 'photoswipe/dist/default-skin/default-skin.css';

export default () => {
  return (
    <div id="pswp" className="pswp" tabIndex={-1} role="dialog" aria-hidden="true">
    {/* Root element of PhotoSwipe. Must have className pswp. */}
        <div className="pswp__bg"></div>
        {/* Background of PhotoSwipe. */}
        {/*     It's a separate element as animating opacity is faster than rgba(). */}
        <div className="pswp__scroll-wrap">
        {/* Slides wrapper with overflow:hidden. */}
            <div className="pswp__container">
            {/* Container that holds slides. 
                PhotoSwipe keeps only 3 of them in the DOM to save memory.
                Don't modify these 3 pswp__item elements, data is added later on. */}
                <div className="pswp__item"></div>
                <div className="pswp__item"></div>
                <div className="pswp__item"></div>
            </div>
            <div className="pswp__ui pswp__ui--hidden">
            {/* Default (PhotoSwipeUI_Default) interface on top of sliding area. Can be changed. */}
                <div className="pswp__top-bar">
                    <div className="pswp__counter"></div>
                    {/*  Controls are self-explanatory. Order can be changed. */}
                    <button className="pswp__button pswp__button--close" title="关闭 (Esc)"></button>
                    <button className="pswp__button pswp__button--share" title="分享"></button>
                    <button className="pswp__button pswp__button--fs" title="全屏"></button>
                    <button className="pswp__button pswp__button--zoom" title="放大/缩小"></button>
                    <div className="pswp__preloader">
                    {/* Preloader demo https://codepen.io/dimsemenov/pen/yyBWoR */}
                    {/* element will get className pswp__preloader--active when preloader is running */}
                        <div className="pswp__preloader__icn">
                          <div className="pswp__preloader__cut">
                            <div className="pswp__preloader__donut"></div>
                          </div>
                        </div>
                    </div>
                </div>
                <div className="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
                    <div className="pswp__share-tooltip"></div> 
                </div>
                <button className="pswp__button pswp__button--arrow--left" title="上一张 (左键头)">
                </button>
                <button className="pswp__button pswp__button--arrow--right" title="下一张 (右箭头)">
                </button>
                <div className="pswp__caption">
                    <div className="pswp__caption__center"></div>
                </div>
            </div>
        </div>
    </div>
  );
};
