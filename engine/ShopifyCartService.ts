import { API } from '@xrengine/client-core/src/API'
import { NotificationService } from '@xrengine/client-core/src/common/services/NotificationService'
import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import { CartInterface, CartLineInterface, CartProductAddedInterface } from '../utils/CartInterface'

export const ShopifyCartState = defineState({
  name: 'ShopifyCartState',
  initial: {
    locationHasPurchasableItems: false,
    cart: null! as CartInterface,
    addingToCart: '' as string
  }
})

export const accessCartState = () => getState(ShopifyCartState)
export const useCartState = () => useState(accessCartState())

export const CartServiceReceptor = (action) => {
  const s = getState(ShopifyCartState)
  matches(action)
    .when(CartActions.createCart.matches, (action) => s.cart.set(action.cart))
    .when(CartActions.addedToCart.matches, (action) => {
      s.addingToCart.set('')
      s.cart.lines.edges.merge(action.items)
    })
    .when(CartActions.addingToCart.matches, (action) => s.addingToCart.set(action.id))
    .when(CartActions.locationHasPurchasableItems.matches, (action) => s.locationHasPurchasableItems.set(true))
}
export const CartService = {
  createCart: async () => {
    // const response = await API.instance.client.service('shopify-cart').create({})
    // const cart = response.data.cartCreate.cart as CartInterface
    // dispatchAction(CartActions.createCart({ cart }))
  },
  addItemToCart: async (id: string) => {
    // dispatchAction(CartActions.addingToCart({ id }))
    // const cartId = accessCartState().cart.id.value
    // const response = (await API.instance.client.service('shopify-cart').patch(id, { operation: 'add', cartId })).data
    //   .cartLinesAdd.cart as CartProductAddedInterface
    // const items = response.lines.edges.map((edge) => edge.node)
    // const addedItem = items.find(item => item.merchandise.id === id)!
    // dispatchAction(CartActions.addedToCart({ items: [addedItem] }))
    // NotificationService.dispatchNotify('Added to cart', { variant: 'success' })
  }
}

export class CartActions {
  static createCart = defineAction({
    type: 'XREngine-Project-eCommerce.cart.CREATE_CART',
    cart: matches.object as Validator<unknown, CartInterface>
  })
  static addedToCart = defineAction({
    type: 'XREngine-Project-eCommerce.cart.ADDED_TO_CART',
    items: matches.array as Validator<unknown, CartLineInterface[]>
  })
  static addingToCart = defineAction({
    type: 'XREngine-Project-eCommerce.cart.ADDING_TO_CART',
    id: matches.string
  })
  static locationHasPurchasableItems = defineAction({
    type: 'XREngine-Project-eCommerce.cart.PURCHASEABLE_ITEMS_AVAILABLE'
  })
}
