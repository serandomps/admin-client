var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var form = require('form');

dust.loadSource(dust.compile(require('./template'), 'admin-transits'));

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
                        serand.redirect('/manage-transits?' + utils.toQuery(query));
                    });
                }
            }, done);
        }
    }
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    var status = options.status;
    var workflow = options.workflow || 'model-messages';
    utils.workflow(workflow, function (err, workflow) {
        if (err) {
            return done(err);
        }
        var transitions = workflow.transitions[status];
        var o = serand.pack({
            model: options.model,
            id: options.id,
            status: options.status,
            location: options.location,
            actions: transitions
        }, container);
        dust.render('admin-transits', o, function (err, out) {
            if (err) {
                return done(err);
            }
            var elem = sandbox.append(out);
            $('.actions', elem).on('click', '.transit', function () {
                var thiz = $(this);
                var action = thiz.data('action');
                utils.loading(500);
                utils.transit(options.domain, options.model, options.id, action, function (err) {
                    utils.loaded();
                    if (err) {
                        return console.error(err);
                    }
                    var location = '/transits/' + options.id + '?domain=' + options.domain +
                        '&model=' + options.model + '&status=' + transitions[action] + '&location=' + options.location;
                    serand.redirect(location);
                });
            });
            $('.actions', elem).on('click', '.cancel', function () {
                serand.redirect(options.location);
            });
            done(null, function () {
                $('.admin-transits', sandbox).remove();
            });
        });
    });
};
