/**
 * Statsd client wrapper.
 *
 * @package openbadges
 * @author Andrew Sliwinski <andrew@diy.org>
 */

/**
 * Dependencies
 */
var StatsD = require('node-statsd').StatsD;

/**
 * Setup
 */
var configuration = require('./configuration.js');
var client = new StatsD(configuration.get('statsd'));
module.exports = client;