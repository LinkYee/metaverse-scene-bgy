import React from 'react'

import InputGroup from '@xrengine/editor/src/components/inputs/InputGroup'
import { ControlledStringInput } from '@xrengine/editor/src/components/inputs/StringInput'
import NodeEditor from '@xrengine/editor/src/components/properties/NodeEditor'
import { EditorComponentType, updateProperty } from '@xrengine/editor/src/components/properties/Util'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'

import { ProductComponent } from '../engine/ProductComponent'

export const ProductNodeEditor: EditorComponentType = (props) => {
  const productComponent = getComponent(props.node.entity, ProductComponent)
  return (
    <NodeEditor description={'Description'} {...props}>
      <InputGroup name="URL" label={'URL'}>
        <ControlledStringInput value={productComponent.url} onChange={updateProperty(ProductComponent, 'url')} />
      </InputGroup>
      <InputGroup name="Product ID" label={'Product ID'}>
        <ControlledStringInput
          value={productComponent.productId}
          onChange={updateProperty(ProductComponent, 'productId')}
        />
      </InputGroup>
      <InputGroup name="Variant ID" label={'Variant ID'}>
        <ControlledStringInput
          value={productComponent.variantId}
          onChange={updateProperty(ProductComponent, 'variantId')}
        />
      </InputGroup>
      <InputGroup name="Description" label={'Description'}>
        <ControlledStringInput
          value={productComponent.description}
          onChange={updateProperty(ProductComponent, 'description')}
        />
      </InputGroup>
      <InputGroup name="Title" label={'Title'}>
        <ControlledStringInput value={productComponent.title} onChange={updateProperty(ProductComponent, 'title')} />
      </InputGroup>
      <InputGroup name="Price" label={'Price'}>
        <ControlledStringInput value={`${productComponent.price}`} onChange={updateProperty(ProductComponent, 'price')} />
      </InputGroup>
      <InputGroup name="Currency Code" label={'Currency Code'}>
        <ControlledStringInput
          value={productComponent.currencyCode}
          onChange={updateProperty(ProductComponent, 'currencyCode')}
        />
      </InputGroup>
    </NodeEditor>
  )
}

ProductNodeEditor.iconComponent = AddShoppingCartIcon

export default ProductNodeEditor
