var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var form = require('form');
var messages = require('model-messages');
var Messages = messages.service;

dust.loadSource(dust.compile(require('./template'), 'admin-messages'));

var from = function (o) {
    var oo = {};
    Object.keys(o).forEach(function (name) {
        oo[name.replace(/:/g, '-')] = o[name];
    });
    return oo;
};

var findQuery = function (vform, done) {
    vform.find(function (err, data) {
        if (err) {
            return done(err);
        }
        vform.validate(data, function (err, errors, data) {
            if (err) {
                return done(err);
            }
            if (errors) {
                return vform.update(errors, data, done);
            }
            done(null, data);
        });
    });
};


var configs = {
    status: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.status', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        serand.redirect('/manage-messages?' + utils.toQuery(query));
                    });
                }
            }, done);
        }
    }
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    utils.configs('groups', function (err, groups) {
        if (err) {
            return done(err);
        }
        Messages.find({
            sort: {
                updatedAt: 1
            },
            query: {
                status: 'sent'
            }
        }, function (err, messages) {
            if (err) return done(err);
            dust.render('admin-messages', serand.pack({
                _: {
                    statuses: [
                        {label: 'Pending', value: 'pending'},
                        {label: 'Approved', value: 'approved'}
                    ]
                },
                messages: messages
            }, container), function (err, out) {
                if (err) {
                    return done(err);
                }
                var query = _.cloneDeep(options.query) || {};
                var elem = sandbox.append(out);
                var filters = form.create(container.id, elem, configs);
                filters.render(ctx, from(query), function (err) {
                    if (err) {
                        return done(err);
                    }
                    done(null, {
                        clean: function () {
                            $('.admin-messages', sandbox).remove();
                        }
                    });
                });
            });
        });
    });
};
