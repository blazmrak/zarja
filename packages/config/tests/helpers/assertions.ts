export function extractError(callback: Function): any {
  try {
    callback()
    return undefined
  } catch (e) {
    return e
  }
}
