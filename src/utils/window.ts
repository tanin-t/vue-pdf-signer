export function openURL (url: string) {
  const newtab = window.open(url, '_blank')
  if (!newtab || newtab.closed) {
    window.location.href = url
  }
}

export function downloadURL (url: string) {
  // Get the file name from the URL
  const fileName = url.substring(url.lastIndexOf('/') + 1)

  // Create a new `a` element
  const link = document.createElement('a')

  // Set the `href` attribute to the URL of the image
  link.href = url

  // Set the `download` attribute to the file name
  link.download = fileName

  // Append the `a` element to the DOM
  document.body.appendChild(link)

  // Click the `a` element to trigger the download
  link.click()

  // Remove the `a` element from the DOM
  document.body.removeChild(link)
}
