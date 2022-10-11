export type CartInterface = {
  id: string
  checkoutUrl: string
  createdAt: string
  updatedAt: string
  lines: { edges: Array<CartLineInterface> }
  attributes: Array<{ key: string; value: string }>
  cost: {
    totalAmount: {
      amount: string
      currencyCode: string
    }
    subtotalAmount: {
      amount: string
      currencyCode: string
    }
    totalTaxAmount: any
    totalDutyAmount: any
  }
}

export type CartLineInterface = {
  id: string
  merchandise: {
    id: string
  }
}

export type CartProductAddedInterface = {
  id: string
  createdAt: string
  updatedAt: string
  lines: {
    edges: [
      {
        node: CartLineInterface
      }
    ]
  }
}
