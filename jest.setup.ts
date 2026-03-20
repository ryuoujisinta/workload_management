import '@testing-library/jest-dom'

// Mock TextEncoder / TextDecoder for Node.js environment issues in some tests if required
import { TextEncoder, TextDecoder } from 'util'
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any
}
