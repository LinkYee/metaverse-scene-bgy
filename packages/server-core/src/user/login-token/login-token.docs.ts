/**
 * An object for swagger documentation configiration
 */
export default {
  definitions: {
    'login-token': {
      type: 'object',
      properties: {
        identityProviderId: {
          type: 'string'
        }
      }
    },
    'login-token_list': {
      type: 'array',
      items: { $ref: '#/definitions/login-token' }
    }
  }
}
