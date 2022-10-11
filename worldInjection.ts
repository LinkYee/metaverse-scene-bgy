import { isNode } from '@xrengine/engine/src/common/functions/getEnvironment'
import { World } from '@xrengine/engine/src/ecs/classes/World'

export default async (world: World) => {
  /**
   * products & carts are unnecessary on nodejs, as they're only used in the editor,
   * and will cause errors with node trying to import .tsx files
   */

  if (!isNode) {
    ;(await import('./engine/RegisterProductPrefab')).default(world)
  }
}
