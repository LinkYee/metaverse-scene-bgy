import React from 'react'
import { Route, Switch } from 'react-router-dom'

import ModelViewer from '../components/ModelViewer'

const EcommerceRoutes = () => {
  return (
    <Switch>
      <Route path="/ecommerce/item/:itemUrl" component={ModelViewer} />
    </Switch>
  )
}

export default EcommerceRoutes
