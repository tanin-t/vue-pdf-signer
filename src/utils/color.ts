export function updateRgbaAlpha (rgba: string, newAlpha: number) {
  const parts: string[] | null = rgba.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(?:\.\d+)?)\)$/
  )

  if (!parts) {
    throw new Error(`Invalid rgba value: ${rgba}`)
  }

  const r = parseInt(parts[1])
  const g = parseInt(parts[2])
  const b = parseInt(parts[3])

  return 'rgba(' + r + ',' + g + ',' + b + ',' + newAlpha + ')'
}
