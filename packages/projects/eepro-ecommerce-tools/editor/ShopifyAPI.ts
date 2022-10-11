import axios from 'axios'

const getProducts = (domain: string, token: string) =>
  axios.post(
    `${domain}/api/2022-10/graphql.json`,
    {
      query: `
          query {
            products(first: 250) {
              edges {
                node {
                  id
                  title
                  descriptionHtml
                  onlineStoreUrl 
                }
              }
            }
          }
      `
    },
    { headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' } }
  )
// name, description, type, price, category
const getProductInformation = (domain: string, token: string, id: string) =>
  axios.post(
    `${domain}/api/2022-10/graphql.json`,
    {
      query: `
        query {
          node(id: "${id}") {
            ...on Product {
              id
              variants(first: 250) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                  }
                }
              }
              media(first: 250) {
                edges {
                  node {
                    mediaContentType
                    alt
                    ...mediaFieldsByType
                  }
                }
              }
            }
          }
        }
        
        fragment mediaFieldsByType on Media {
          ...on ExternalVideo {
            id
            host
            embeddedUrl
          }
          ...on MediaImage {
            image {
              originalSrc
            }
          }
          ...on Model3d {
            sources {
              url
              mimeType
              format
              filesize
            }
          }
          ...on Video {
            sources {
              url
              mimeType
              format
              height
              width
            }
          }
        }
        
    `
    },
    { headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' } }
  )

export const ShopifyAPI = {
  getProducts,
  getProductInformation
}
