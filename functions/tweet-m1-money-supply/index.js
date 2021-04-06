// Internal dependencies.
const { main } = require('./src/main')

// External dependencies.
const axios = require('axios')
const { DateTime } = require('luxon')
const querystring = require('querystring')
const Twitter = require('twitter')
const urljoin = require('url-join')

// AWS dependencies.
const AWS = require('aws-sdk')
const secretsmanager = new AWS.SecretsManager()

// Mock console logger for unit tests.
const logger = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    warn: console.warn
}

exports.handler = async (event, context) => {
    // Log event.
    logger.info(`Received event: ${JSON.stringify(event, null, 2)}`)

    // Build payload.
    const options = {
        deps: {
            axios,
            DateTime,
            logger,
            querystring,
            secretsmanager,
            Twitter,
            urljoin
        },
        env: process.env,
        event
    }

    // Execute.
    try {
        const response = await main(options)
        logger.info(`Received successful response:`, response)
        return `Succeeded`
    } catch (e) {
        logger.error(`An uncaught exception occurred:`, e)
        return `Failed`
    }
}
