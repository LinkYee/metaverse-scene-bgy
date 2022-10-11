import { Application } from '@xrengine/server-core/declarations'

import { ShopifyCart } from './shopify-cart.class'
import hooks from './shopify-cart.hooks'

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    'shopify-cart': ShopifyCart
  }
}

export default (app: Application): void => {
  const cart = new ShopifyCart(app)
  app.use('shopify-cart', cart)

  const service = app.service('shopify-cart')
  service.hooks(hooks)
}
