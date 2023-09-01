const config = require('./jest.config')


config.testRegex = "(/e2e/.*\\.spec\\.ts)$"


module.exports = config