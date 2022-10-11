import { Id, NullableId, Params, ServiceMethods } from '@feathersjs/feathers'
import axios from 'axios'

import { Application } from '@xrengine/server-core/declarations'
import { getProjectEnv } from '@xrengine/server-core/src/projects/project/project-helper'

import { CartInterface } from '../../utils/CartInterface'
import { SettingsInterface } from '../../utils/SettingsInterface'

const createCart = (domain: string, token: string) =>
  axios.post(
    `${domain}api/2022-07/graphql.json`,
    {
      query: `mutation {
      cartCreate(
        input: {
          lines: []
          attributes: { key: "cart_attribute", value: "This is a cart attribute" }
        }
      ) {
        cart {
          id
          createdAt
          updatedAt
          lines(first: 10) {
            edges {
              node {
                id
                merchandise {
                  ... on ProductVariant {
                    id
                  }
                }
              }
            }
          }
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
            totalDutyAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }`
    },
    { headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' } }
  )

const addToCart = (domain: string, token: string, cartId: string, lines: Lines) =>
  axios.post(
    `${domain}api/2022-07/graphql.json`,
    {
      query: `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          createdAt
          updatedAt
          lines(first: 10) {
            edges {
              node {
                id
                merchandise {
                  ... on ProductVariant {
                    id
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }`,
      variables: {
        cartId,
        lines
      }
    },
    { headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' } }
  )

const getCheckoutURL = (domain: string, token: string, cartId: string) =>
  axios.post(
    `${domain}api/2022-07/graphql.json`,
    {
      query: `query checkoutURL {
      cart(id: "${cartId}") {
        checkoutUrl
      }
    }`
    },
    { headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' } }
  )

type Lines = {
  merchandiseId: string
  quantity: number
}

/**
 * @todo store cart id and user id in a table to ensure a user is only accessing their own cart
 */

export class ShopifyCart implements ServiceMethods<any> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }
  async get(id: Id, params?: Params): Promise<any> {}
  async find(params?: Params): Promise<any> {}
  async update(id: NullableId, data: Partial<any>, params?: Params): Promise<any> {}
  async remove(id: NullableId, params?: Params): Promise<any> {}
  async setup(app: Application, path: string): Promise<void> {}

  async create(data: {}, params?: Params | undefined) {
    try {
      const { domain, shopifySecret } = (await getProjectEnv(
        this.app,
        'XREngine-Project-eCommerce'
      )) as any as SettingsInterface
      const cartResponse = (await createCart(domain, shopifySecret)).data
      const checkoutResponse = (
        await getCheckoutURL(domain, shopifySecret, (cartResponse.data.cartCreate.cart as CartInterface).id)
      ).data
      cartResponse.data.cartCreate.cart.checkoutUrl = checkoutResponse.data.cart.checkoutUrl
      return cartResponse
    } catch (e) {
      console.error(e)
    }
  }

  async patch(id: string, data: { cartId: string; operation: string }) {
    const { domain, shopifySecret } = (await getProjectEnv(
      this.app,
      'XREngine-Project-eCommerce'
    )) as any as SettingsInterface
    if (data.operation === 'add') {
      const lines = {
        merchandiseId: id,
        quantity: 1
      } as Lines
      const cartResponse = (await addToCart(domain, shopifySecret, data.cartId, lines)).data
      return cartResponse
    }

    return null
  }
}
