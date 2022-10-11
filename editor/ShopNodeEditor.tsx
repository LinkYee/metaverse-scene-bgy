import React from 'react'

import { PropertiesPanelButton } from '@xrengine/editor/src/components/inputs/Button'
import InputGroup from '@xrengine/editor/src/components/inputs/InputGroup'
import ModelInput from '@xrengine/editor/src/components/inputs/ModelInput'
import SelectInput from '@xrengine/editor/src/components/inputs/SelectInput'
import NodeEditor from '@xrengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType, updateProperty } from '@xrengine/editor/src/components/properties/Util'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

import { ProductProviders, ShopComponent } from '../engine/ShopComponent'
import { loadProduct, Products } from '../engine/ShopFunctions'

export const ShopNodeEditor: EditorComponentType = (props) => {
  const shopComponent = getComponent(props.node.entity, ShopComponent)
  const productOptions = Products[shopComponent.provider]?.map((product) => {
    return {
      value: product.id,
      label: product.label
    }
  })
  const currentProduct = Products[shopComponent.provider]?.find((product) => product.id === shopComponent.productId)
  const productVariantOptions =
    currentProduct &&
    currentProduct.variants.map((variant) => {
      return {
        value: variant.id,
        label: variant.title
      }
    })

  return (
    <NodeEditor description={'Description'} {...props}>
      <InputGroup name="Product Provider" label={'Product Provider'}>
        <SelectInput
          options={ProductProviders.map((value) => ({ label: value, value }))}
          value={shopComponent.provider}
          onChange={updateProperty(ShopComponent, 'provider')}
        />
      </InputGroup>
      {productOptions?.length > 0 && (
        <InputGroup name="Products" label={'Products'}>
          <SelectInput
            options={productOptions}
            value={shopComponent.productId}
            onChange={updateProperty(ShopComponent, 'productId')}
          />
        </InputGroup>
      )}
      {shopComponent?.productItems.length > 0 && (
        <InputGroup name="Product Items" label={'Product Items'}>
          <SelectInput
            options={shopComponent.productItems}
            value={shopComponent.productItemId}
            onChange={updateProperty(ShopComponent, 'productItemId')}
          />
        </InputGroup>
      )}
      {productVariantOptions && productVariantOptions.length > 0 && (
        <InputGroup name="Variant" label={'Variant'}>
          <SelectInput
            options={productVariantOptions}
            value={shopComponent.variantId}
            onChange={updateProperty(ShopComponent, 'variantId')}
          />
        </InputGroup>
      )}
      <InputGroup name="Media Override" label={'Media Override'}>
        <ModelInput value={shopComponent.mediaOverride} onChange={updateProperty(ShopComponent, 'mediaOverride')} />
      </InputGroup>
      <PropertiesPanelButton onClick={() => loadProduct(props.node.entity)}>Select Product</PropertiesPanelButton>
    </NodeEditor>
  )
}

ShopNodeEditor.iconComponent = ShoppingCartIcon

export default ShopNodeEditor
