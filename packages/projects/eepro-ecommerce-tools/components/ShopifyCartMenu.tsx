import React, { useEffect } from 'react'

import { accessCartState } from '../engine/ShopifyCartService'

export function ShoppingCartMenu({ changeActiveMenu }) {
  useEffect(() => {
    changeActiveMenu()
    const checkoutUrl = accessCartState().cart.checkoutUrl.value
    window.open(checkoutUrl)
  }, [])

  return <></>
}
