'use strict';

module.exports = {
    EXECUTABLE: 'iptables',
    FLAGS: {
        COMMENT: ['-m', 'comment', '--comment'],
        DESTINATION: '-d',
        DESTINATION_PORT: '--dport',
        INTERFACE: '-i',
        FLUSH: '-F',
        JUMP: '-j',
        NEW_CHAIN: '-N',
        POLICY: '-P',
        PROTOCOL: '-p',
        SOURCE: '-s',
        SOURCE_MAC: ['-m', 'mac', '--mac-source'],
        SOURCE_PORT: '--sport',
        STATE: ['-m', 'state', '--state'],
        TABLE: '-t'
    },
    PROTOCOLS: [
        'ah',
        'all',
        'esp',
        'icmp',
        'icmpv6',
        'mh',
        'sctp',
        'tcp',
        'udp',
        'udplite'
    ],
    SPECS: {
        APPEND: '-A',
        DELETE: '-D'
    }
};
