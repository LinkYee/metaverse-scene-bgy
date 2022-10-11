import { ProductType } from '../engine/ShopComponent'
import { getSettings } from './getSettings'
import { ShopifyAPI } from './ShopifyAPI'

export const getShopifyData = async (): Promise<ProductType[]> => {
  const { shopifySecret: token, domain } = await getSettings()

  if (!domain || domain == '') return console.warn('shopify domain invalid') as any
  if (!token) return console.warn('shopify token invalid') as any
  try {
    const res = await ShopifyAPI.getProducts(domain, token)
    if (!res || !res.data) return []
    const productData: any = res.data
    if (productData.data && productData.data.products && productData.data.products.edges) {
      const products: ProductType[] = []
      for (const edgeProduct of productData.data.products.edges) {
        //TODO: interact data
        const response = await ShopifyAPI.getProductInformation(domain, token, edgeProduct.node.id)
        if (response && response.data) {
          const mediaData: any = response.data
          if (mediaData.data && mediaData.data.node && mediaData.data.node.media && mediaData.data.node.media.edges) {
            const sourceData: any[] = []
            for (const edgeMedia of mediaData.data.node.media.edges) {
              if (edgeMedia.node && edgeMedia.node.sources && edgeMedia.node.sources[0]) {
                let sourceValue = edgeMedia.node.sources[0]
                if (sourceValue.format == 'glb') {
                  //3d model
                  sourceValue.extendType = 'model'
                } else {
                  sourceValue.extendType = 'video'
                }
                sourceData.push(sourceValue)
              } else if (edgeMedia.node.image && edgeMedia.node.image.originalSrc) {
                sourceData.push({
                  url: edgeMedia.node.image.originalSrc,
                  mimeType: 'image/png',
                  format: 'png',
                  extendType: 'image'
                })
              }
            }
            products.push({
              title: edgeProduct.node.title,
              description: edgeProduct.node.descriptionHtml,
              storeUrl: edgeProduct.node.onlineStoreUrl,
              id: edgeProduct.node.id,
              variants: response.data.data.node.variants.edges.map((variant) => variant.node),
              label: edgeProduct.node.title,
              media: sourceData
            })
          }
        }
      }
      return products
    }
  } catch (error) {
    console.error(error)
  }
  return []
}
