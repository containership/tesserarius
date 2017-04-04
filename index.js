'use strict';

const iptables = require('./lib/iptables');
const Rule = require('./lib/rule');

const _ = require('lodash');
const async = require('async');

class Tesserarius {

    constructor() {
        this.rules = {};
    }

    add_rule(chain, options, callback) {
        if(!this.rules[chain]) {
            this.rules[chain] = [];
        }

        const rule_options = _.cloneDeep(options);
        rule_options.spec = 'APPEND';
        const rule = new Rule(chain, rule_options);

        const rules_by_fingerprint = _.keyBy(this.rules[chain], 'fingerprint');

        if(rules_by_fingerprint[rule.fingerprint]) {
            return callback(new Error('Rule already exists!'));
        }

        rule.execute((err) => {
            if(!err) {
                this.rules[chain].push(rule);
            }

            return callback(err);
        });
    }

    delete_rule(chain, options, callback) {
        if(!this.rules[chain]) {
            this.rules[chain] = [];
        }

        const rule_options = _.cloneDeep(options);
        rule_options.spec = 'DELETE';
        const rule = new Rule(chain, rule_options);

        const existing_rule_options = _.cloneDeep(options);
        existing_rule_options.spec = 'APPEND';
        const existing_rule = new Rule(chain, existing_rule_options);

        rule.execute((err) => {
            const rules_by_fingerprint = _.keyBy(this.rules[chain], 'fingerprint');

            if(rules_by_fingerprint[existing_rule.fingerprint]) {
                delete rules_by_fingerprint[existing_rule.fingerprint];
                this.rules[chain] = _.values(rules_by_fingerprint);
            }

            return callback(err);
        });
    }

    set_rules(chain, rules, callback) {
        const temp_chain = [];

        const existing_fingerprints = _.keyBy(this.rules[chain], 'fingerprint');

        _.forEach(rules, (rule_options) => {
            rule_options.spec = 'APPEND';
            const rule = new Rule(chain, rule_options);
            temp_chain.push(rule);
        });

        const new_fingerprints = _.keyBy(temp_chain, 'fingerprint');

        const rules_to_add = _.difference(_.keys(new_fingerprints), _.keys(existing_fingerprints));
        const rules_to_remove = _.difference(_.keys(existing_fingerprints), _.keys(new_fingerprints));

        async.series([
            (callback) => {
                async.eachSeries(rules_to_add, (fingerprint, callback) => {
                    const rule = new_fingerprints[fingerprint];
                    this.add_rule(chain, _.cloneDeep(rule.options), () => {
                        return callback();
                    });
                }, callback);
            },
            (callback) => {
                async.eachSeries(rules_to_remove, (fingerprint, callback) => {
                    const rule = existing_fingerprints[fingerprint];
                    this.delete_rule(chain, _.cloneDeep(rule.options), () => {
                        return callback();
                    });
                }, callback);
            }
        ], callback);
    }

    get_rules(chain, callback) {
        if(_.isFunction(chain)) {
            callback = chain;
            return callback(null, this.rules);
        } else if(this.rules[chain]) {
            return callback(null, this.rules[chain]);
        } else {
            return callback(new Error('Chain has no rules!'));
        }
    }

    create_chain(chain, options, callback) {
        iptables.create_chain(chain, options, callback);
    }

    flush(chain, options, callback) {
        iptables.flush(chain, options, callback);
    }

    set_policy(chain, policy, options, callback) {
        iptables.policy(chain, policy, options, callback);
    }

}

module.exports = Tesserarius;
