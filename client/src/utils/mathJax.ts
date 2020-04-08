let ready = false;

const tryInit = (container: any) => {
  const MathJax: any = (window as any).MathJax;
  if (!MathJax) {
    return;
  }
  if (!ready) {
    MathJax.Hub.Config({
      showProcessingMessages: false,
      messageStyle: 'none',
      jax: ['input/TeX', 'output/HTML-CSS'],
      tex2jax: {
        inlineMath: [
          ['$', '$'],
          ['\\(', '\\)'],
        ],
        displayMath: [
          ['$$', '$$'],
          ['\\[', '\\]'],
        ],
        skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'a'],
      },
      'HTML-CSS': {
        availableFonts: ['STIX', 'TeX'],
        showMathMenu: false,
      },
    });
  }
  MathJax.Hub.Queue(['Typeset', MathJax.Hub, container]);
  ready = true;
};

const tryUntilReady = (container: any) => {
  const timer = setInterval(() => {
    tryInit(container);
    if (ready) {
      clearInterval(timer);
      return;
    }
  }, 100);
};

export const initMathJax = tryUntilReady;
