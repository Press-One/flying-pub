import PhotoSwipe from 'photoswipe';
import PhotoSwipeUIDefault from 'photoswipe/dist/photoswipe-ui-default';
import { isPc } from 'utils';

export function createPhotoSwipeStore() {
  return {
    show(image: string | Array<string>, index = 0) {
      let images: Array<any> = [];
      if (typeof image === 'string') {
        images.push({src: image, w:0, h:0});
      } else if (image instanceof Array) {
        image.forEach((item: any) => images.push({src: item, w: 0, h: 0}));
      } else {
        return;
      }
      const options = {
        index, // start at first slide
        history: false, // history modle
        shareEl: false,
        fullscreenEl: isPc,
      };
      const pswpElement = document.getElementById('pswp');
      if (pswpElement) {
        const gallery = new PhotoSwipe(pswpElement, PhotoSwipeUIDefault, images, options);
        gallery.listen('gettingData', function(index, item) {
          if (!item.w || !item.h) { // unknown size
            var img = new Image(); 
            img.onload = function() { // will get size after load
              item.w = img.width; // set image width
              item.h = img.height; // set image height
              gallery.invalidateCurrItems(); // reinit Items
              gallery.updateSize(true); // reinit Items
            }
            img.src = item.src as string; // let's download image
          }
        });
        gallery.init();
      }
    }
  };
}
