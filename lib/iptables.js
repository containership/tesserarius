'use strict';

const constants = require('./constants');

const _ = require('lodash');
const child_process = require('child_process');
const Joi = require('joi');

module.exports = {

    create_chain(chain, options, callback) {
        if(_.isFunction(chain)) {
            callback = chain;
            return callback(new Error('Chain must be defined!'));
        } else if(_.isFunction(options)) {
            callback = options;
            options = {};
        }

        const args = [];

        if(options.table) {
            args.push(constants.FLAGS.TABLE);
            args.push(options.table);
        }

        args.push(constants.FLAGS.NEW_CHAIN);
        args.push(chain);

        execute_command(args, callback);
    },

    flush(chain, options, callback) {
        if(_.isFunction(chain)) {
            callback = chain;
            options = {};
            chain = undefined;
        } else if(_.isPlainObject(chain)) {
            callback = options;
            options = chain;
            chain = undefined;
        } else if(_.isFunction(options)) {
            callback = options;
            options = {};
        }

        const args = [];

        if(options.table) {
            args.push(constants.FLAGS.TABLE);
            args.push(options.table);
        }

        args.push(constants.FLAGS.FLUSH);

        if(chain) {
            args.push(chain);
        }

        execute_command(args, callback);
    },

    add_rule(chain, rule, callback) {
        if(rule.source_port) {
            rule.source_port = rule.source_port.toString();
        }

        if(rule.destination_port) {
            rule.destination_port = rule.destination_port.toString();
        }

        const schema = {
            spec: Joi.string().valid(_.keys(constants.SPECS)).required(),
            source_port: Joi.string(),
            comment: Joi.string(),
            destination_port: Joi.string(),
            interface: Joi.string(),
            policy: Joi.string().required(),
            protocol: Joi.string().valid(constants.PROTOCOLS),
            source: Joi.string(),
            destination: Joi.string(),
            source_mac: Joi.string().regex(/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/),
            state: Joi.array(),
            table: Joi.string()
        };

        Joi.validate(rule, schema, (err) => {
            if(err) {
                return callback(err);
            }

            const args = [];

            if(rule.table) {
                args.push(constants.FLAGS.TABLE);
                args.push(rule.table);
            }

            args.push(constants.SPECS[rule.spec]);
            args.push(chain);

            if(rule.interface) {
                args.push(constants.FLAGS.INTERFACE);
                args.push(rule.interface);
            }

            if(rule.protocol) {
                args.push(constants.FLAGS.PROTOCOL);
                args.push(rule.protocol);
            }

            if(rule.source_port) {
                args.push(constants.FLAGS.SOURCE_PORT);
                args.push(rule.source_port);
            }

            if(rule.destination_port) {
                args.push(constants.FLAGS.DESTINATION_PORT);
                args.push(rule.destination_port);
            }

            if(rule.source) {
                args.push(constants.FLAGS.SOURCE);
                args.push(rule.source);
            }

            if(rule.destination) {
                args.push(constants.FLAGS.DESTINATION);
                args.push(rule.destination);
            }

            if(rule.source_mac) {
                args.push(...constants.FLAGS.SOURCE_MAC);
                args.push(rule.source_mac);
            }

            if(rule.state) {
                args.push(...constants.FLAGS.STATE);
                args.push(rule.state.join(','));
            }

            if(rule.comment) {
                args.push(...constants.FLAGS.COMMENT);
                args.push(rule.comment);
            }

            args.push(constants.FLAGS.JUMP);
            args.push(rule.policy);

            execute_command(args, callback);
        });
    },

    policy(chain, policy, options, callback) {
        if(_.isFunction(chain)) {
            callback = chain;
            return callback(new Error('Chain must be defined!'));
        } else if(_.isFunction(policy)) {
            callback = policy;
            policy = 'accept';
            options = {};
        } else if(_.isPlainObject(policy)) {
            callback = options;
            options = policy;
            policy = 'accept';
        } else if(_.isFunction(options)) {
            callback = options;
            options = {};
        }

        policy = policy.toUpperCase();

        const args = [];

        if(options.table) {
            args.push(constants.FLAGS.TABLE);
            args.push(options.table);
        }

        args.push(constants.FLAGS.POLICY);
        args.push(chain);
        args.push(policy);

        execute_command(args, callback);
    }

};

function execute_command(args, callback) {
    if(process.env.TESSERARIUS_DRY_RUN && (process.env.TESSERARIUS_DRY_RUN === 'true' || process.env.TESSERARIUS_DRY_RUN === '1')) {
        // eslint-disable-next-line no-console
        console.log(`Tesserarius would execute command: ${constants.EXECUTABLE} ${args.join(' ')}`);

        return callback();
    }

    const proc = child_process.spawn(constants.EXECUTABLE, args);

    proc.on('close', (code) => {
        if(code !== 0) {
            return callback(new Error(`Process returned exit code: ${code}`));
        } else {
            return callback();
        }
    });
}
