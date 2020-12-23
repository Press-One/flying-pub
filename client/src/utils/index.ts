import qs from 'query-string';
import moment from 'moment';

export { default as Endpoint } from './endpoint';
export { default as MimeType } from './mimeType';

export const getQueryObject = () => {
  return qs.parse(window.location.search);
};

export const getQuery = (name: string) => {
  return qs.parse(window.location.search)[name];
};

export const setQuery = (param: any = {}) => {
  let parsed = qs.parse(window.location.search);
  parsed = {
    ...parsed,
    ...param,
  };
  if (window.history.replaceState) {
    const newUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      `?${decodeURIComponent(qs.stringify(parsed))}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }
};

export const removeQuery = (name: string) => {
  let parsed = qs.parse(window.location.search);
  delete parsed[name];
  const isEmpty = Object.keys(parsed).length === 0;
  if (window.history.replaceState) {
    const newUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      `${isEmpty ? '' : '?' + decodeURIComponent(qs.stringify(parsed))}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }
};

export const isDevelopment = process.env.REACT_APP_ENV === 'development';

export const isStaging = process.env.REACT_APP_ENV === 'staging';

export const isProduction = process.env.REACT_APP_ENV === 'production';

export const getApiEndpoint = () => {
  return isDevelopment ? `http://${window.location.hostname}:9000` : window.location.origin;
};

export const ago = (timestamp: string) => {
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diffValue = now - past;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  let result = '';
  const isLastYear = Number(moment().format('YYYY')) > Number(moment(timestamp).format('YYYY'));
  if (isLastYear) {
    result = moment(timestamp).format('YYYY-MM-DD');
  } else if (_week >= 1) {
    result = moment(timestamp).format('MM-DD');
  } else if (_day >= 1) {
    result = Math.floor(_day) + '天前';
  } else if (_hour >= 1) {
    result = Math.floor(_hour) + '小时前';
  } else if (_min >= 1) {
    result = Math.floor(_min) + '分钟前';
  } else {
    result = '刚刚';
  }
  return result;
};

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent,
);

export const isAndroid = /Android/i.test(navigator.userAgent);

export const isIPhone = isMobile && !isAndroid;

export const isPc = !isMobile;

export const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

export const isFirefox = navigator.userAgent.indexOf("Firefox") > 0;

export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const isMI = /; MI /i.test(navigator.userAgent);

export const getImageWidth = (width: number) => {
  return (window.devicePixelRatio || 1) * width
}

export const sleep = (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(resolve, duration);
  });

export const getLoginUrl = () =>
  `${getApiEndpoint()}/api/auth/mixin/login?redirect=${window.location.href}`;

export const getTokenUrl = () => {
  return isDevelopment ? 'https://dev-reader.prsdev.club/api/token' : '/api/token';
};

let stoppedBodyScroll = false;
let scrollTop = 0;
export const stopBodyScroll = (isFixed: boolean, options: any = {}) => {
  if (isPc || isWeChat) {
    return;
  }
  const { disabled } = options;
  const bodyEl = document.body;
  if (disabled) {
    bodyEl.style.position = 'static';
    return;
  }
  if (isFixed === stoppedBodyScroll) {
    return;
  }
  if (isFixed) {
    if (stoppedBodyScroll) {
      return;
    }
    scrollTop = window.scrollY;
    bodyEl.style.position = 'fixed';
    if (scrollTop > 0) {
      bodyEl.style.top = -scrollTop + 'px';
    }
  } else {
    bodyEl.style.position = 'static';
    bodyEl.style.top = '';
    window.scrollTo(0, scrollTop);
  }
  stoppedBodyScroll = isFixed;
};

export const onlyForLogin = () => false;

export const getDefaultDeprecatedAvatar = () => 'https://static.press.one/pub/avatar.png';

export const getDefaultAvatar = () => 'https://static-assets.xue.cn/images/435d111.jpg';

export const getScrollTop = () => {
  const scrollElement = document.scrollingElement || document.documentElement;
  return scrollElement.scrollTop;
}

export const scrollToHere = (top: number) => {
  const scrollElement = document.scrollingElement || document.documentElement;
  try {
    scrollElement.scrollTo({
      top,
    });
  } catch (err) {
    scrollElement.scrollTop = top;
  }
};

export const getProtectedPhone = (phone: string) => {
  return phone
    .split('')
    .map((s: string, idx: number) => {
      if (idx > 2 && idx < 7) {
        return '*';
      } else {
        return s;
      }
    })
    .join('');
};


export const removeUrlHost = (url: string) => `/${url.split('/').slice(3).join('/')}`

export const resizeImage = (url: any, width: number = 80) => {
  if (!url) {
    return url;
  }
  return `${url}?image=&action=resize:w_${width}`;
}

export const resizeFullImage = (url: any) => {
  if (!url) {
    return url;
  }
  if (isMobile) {
    return `${url}?image=&action=resize:w_${window.innerWidth * window.devicePixelRatio}`;
  }
  return `${url}?image=&action=resize:w_${700 * window.devicePixelRatio}`;
}

export const scrollToElementById = (id: string, options: any = {}) => {
  const commentEle: any = document.querySelector(id);
  if (!commentEle) {
    return;
  }
  const scrollElement: any = document.scrollingElement || document.documentElement;
  const top = commentEle.offsetTop;
  if (options.disabledScrollIfVisible) {
    if (!checkVisible(commentEle)) {
      scrollElement.scrollTop = top - window.innerHeight - commentEle.scrollHeight + 300;
    }
    return commentEle;
  }
  if (options.useScrollIntoView) {
    commentEle.scrollIntoView();
    return commentEle;
  }
  if (options.behavior) {
    try {
      scrollElement.scrollTo({
        top,
        behavior: options.behavior
      });
    } catch (e) {
      scrollElement.scrollTop = top;
    }
  } else {
    scrollElement.scrollTop = top;
  }
  return commentEle;
}

const checkVisible = (element: any) => {
  var rect = element.getBoundingClientRect();
  var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

export const disableBackgroundScroll = (disable: boolean) => {
  if (disable) {
    document.body.style.overflow = 'hidden';
    if (document.body.scrollHeight > document.body.clientHeight) {
      document.body.style.paddingRight = '15px';
    }
  } else {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

export const resizeImageByWidth = (width: number, img: HTMLImageElement, file: File) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = width * img.height / img.width;
    context?.drawImage(img, 0, 0, width, width * img.height / img.width);
    canvas.toBlob((blob: any) => {
      blob.lastModifiedDate = new Date();     
      blob.name = file.name;     
      resolve(blob);
    }, file.type, 1);
  });
}

export const limitImageWidth = (width: number, file: File) => {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = (e: any) => {
      URL.revokeObjectURL(objectURL);
      e.msg = 'INVALID_IMG';
      reject(e)
    };
    img.onload = async () => {
      URL.revokeObjectURL(objectURL);
      if (img.width > width) {
        const newFile = await resizeImageByWidth(width, img, file);
        resolve(newFile);
      } else {
        resolve(file);
      }
    }
    img.src = objectURL;
  })
}

export const urlify = (text: string) => {
  if (!text) {
    return text;
  }
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a class="text-blue-400" href="$1">$1</a>')
}

export const getViewport = () => {
  if ((window as any).visualViewport) {
    return {
      width: (window as any).visualViewport.width,
      height: (window as any).visualViewport.height
    };
  }
  return {
    width: (window as any).innerWidth || (document.scrollingElement || document.documentElement).clientWidth,
    height: (window as any).innerHeight || (document.scrollingElement || document.documentElement).clientHeight
  };
}
