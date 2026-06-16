import { createServer } from 'http'
import handler from '../server.mjs'

export default async function api(req, res) {
  return handler(req, res)
}

