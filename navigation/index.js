var serand = require('serand');
var navigation = require('navigation');
var utils = require('utils');

var context;

var ready = false;

var render = function (done) {
    $.ajax({
        url: utils.resolve('accounts:///apis/v/menus/2'),
        dataType: 'json',
        success: function (links) {
            done(null, links);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

var filter = function (options, token, links) {
    if (token) {
        return links;
    }
    links.signin = {url: '/signin', title: 'Sign in'};
    links.signup = {url: '/signup', title: 'Sign up'};
    return links;
};

module.exports = function (ctx, container, options, done) {
    context = {
        ctx: ctx,
        container: container,
        options: options,
        done: done
    };
    if (!ready) {
        return;
    }
    render(function(err, links) {
        if (err) {
            return done(err);
        }
        navigation(ctx, container, serand.pack(filter(options, null, links), container), done);
    });
};

serand.on('user', 'ready', function (token) {
    ready = true;
    if (!context) {
        return;
    }
    render(function(err, links) {
        if (err) {
            return context.done(err);
        }
        navigation(context.ctx, context.container, serand.pack(filter(context.options, token, links), context.container), context.done);
    });
});
