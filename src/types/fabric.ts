
export interface FabricObject extends fabric.Object {
  attrs: {
    type: 'signature'|'pdf-page'|'drawing'
  }
}

export interface FabricCanvas extends fabric.Canvas {
  boundary: {
    top: number
    bottom: number
    left: number
    right: number
  }
}
