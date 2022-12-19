export function getFileExtension (url: string) {
  // Find the last occurrence of the "." character
  const lastDotIndex = url.lastIndexOf('.')

  // Find the first occurrence of the "?" character
  const firstQuestionMarkIndex = url.indexOf('?')

  // Check if the URL includes a "?" character
  if (firstQuestionMarkIndex === -1) {
    // Return the entire string starting from the last "." character
    return url.substring(lastDotIndex + 1)
  } else {
    // Extract the file extension from the URL
    return url.substring(lastDotIndex + 1, firstQuestionMarkIndex)
  }
}

// describe('getFileExtension', () => {
//   it('should return the file extension of the given URL', () => {
//     const testCases = [
//       { url: 'https://test-media.jeracloud.com/clinic_1/files/before_after/image/49d27ce2-4914-4bbc-9e07-50815094ab59.jpg?Expires=<...>&Signature=<...>', expected: 'jpg' },
//       { url: 'https://test-media.jeracloud.com/clinic_1/files/before_after/image/49d27ce2-4914-4bbc-9e07-50815094ab59.jpg', expected: 'jpg' }]

//     testCases.forEach(testCase => {
//       const { url, expected } = testCase
//       const result = getFileExtension(url)
//       expect(result).toBe(expected)
//     })
//   })
// })
