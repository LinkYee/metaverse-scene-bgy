import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'

const ModelViewer = (props: RouteComponentProps<{ itemUrl: string }>) => {
  const { itemUrl } = props.match.params

  useEffect(() => {
    let script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    document.head.appendChild(script)
  }, [])

  return (
    <div>
      {/* @ts-ignore */}
      <model-viewer
        src={window.atob(itemUrl)}
        alt={'model-viewer'}
        ar
        modes="scene-viewer quick-look webxr"
        auto-rotate
        camera-controls
        style={{ width: '100vw', height: '90vh' }}
      />
    </div>
  )
}

export default ModelViewer
