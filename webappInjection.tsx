import React, { useEffect } from 'react'

import { HotbarMenu, UserMenuPanels } from '@xrengine/client-core/src/user/components/UserMenu'
import { addActionReceptor, removeActionReceptor } from '@xrengine/hyperflux'

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import Badge from '@mui/material/Badge'

import { ShoppingCartMenu } from './components/ShopifyCartMenu'
import { CartServiceReceptor, useCartState } from './engine/ShopifyCartService'

const ShoppingCartMenuID = 'Shopping Cart' as const

function CartMenuIcon() {
  const shoppingCartState = useCartState()

  const items = shoppingCartState.value.cart?.lines.edges.length ?? 0

  return (
    <Badge style={{ width: '100%', height: '100%' }} color="primary" badgeContent={items}>
      <ShoppingCartIcon />
    </Badge>
  )
}

type Props = {}

export default function Shopify(props: Props) {
console.log('webappInjection.tsx')
  const shoppingCartState = useCartState()

  useEffect(() => {
    addActionReceptor(CartServiceReceptor)
    return () => {
      removeActionReceptor(CartServiceReceptor)
    }
  }, [])

  useEffect(() => {
    if (!shoppingCartState.cart.value || !shoppingCartState.locationHasPurchasableItems.value) return

    UserMenuPanels.set(ShoppingCartMenuID, ShoppingCartMenu)
    HotbarMenu.set(ShoppingCartMenuID, CartMenuIcon)
  }, [shoppingCartState.cart, shoppingCartState.locationHasPurchasableItems])

  return <></>
}
