// @ts-nocheck

import { isMobile } from 'utils';
import { isEmpty } from 'lodash';

export function createContextStore() {
  let ctx: any = {};
  try {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.MixinContext) {
      ctx = JSON.parse(prompt('MixinContext.getContext()'))
      ctx.platform = ctx.platform || 'iOS'
    } else if (window.MixinContext && (typeof window.MixinContext.getContext === 'function')) {
      ctx = JSON.parse(window.MixinContext.getContext())
      ctx.platform = ctx.platform || 'Android'
    }
  } catch (err) {
    console.log(err);
  }
  return {
    context: ctx,
    get isMixinImmersive() {
      return (isMobile && this.context.immersive) || false;
    },
    get isMixin() {
      return !isEmpty(this.context);
    }
  }
}
