'use strict'

const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  // API_BASE_URL : '"http://localhost:3000"',
  API_BASE_URL : '"https://staging.synergy.salvushealth.id"',
  JWT_SECRET: '"8soisom1x0m21-0vk01i0-fk192ijkjisjfio"'
})
