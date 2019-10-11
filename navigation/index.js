var serand = require('serand');
var navigation = require('navigation');
var utils = require('utils');

var context;

var ready = false;

var render = function (token, done) {
    async.parallel({
        admin: function (parallelDone) {
            if (!token) {
                return parallelDone();
            }
            utils.menus('admin', parallelDone);
        }
    }, function (err, menus) {
        if (err) {
            return done(err);
        }
        done(null, {
            root: {url: 'www://', title: 'serandives'},
            home: {url: '/', title: 'admin'},
            global: [],
            local: menus.admin,
            user: [
                {url: 'accounts://', title: 'Account'}
            ]
        });
    });
};

var filter = function (options, token, links) {
    links.fixed = true;
    links.background = 'bg-secondary';
    links.color = 'navbar-dark';
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
    render(ctx.token, function(err, links) {
        if (err) {
            return done(err);
        }
        navigation(ctx, container, serand.pack(filter(options, null, links), container), done);
    });
};

utils.on('user', 'ready', function (token) {
    ready = true;
    if (!context) {
        return;
    }
    render(token, function(err, links) {
        if (err) {
            return context.done(err);
        }
        navigation(context.ctx, context.container, serand.pack(filter(context.options, token, links), context.container), context.done);
    });
});
