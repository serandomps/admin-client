var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');

dust.loadSource(dust.compile(require('./template.html'), 'admin-client-contacts-review'));
dust.loadSource(dust.compile(require('./actions.html'), 'admin-client-contacts-review-actions'));

var find = function (id, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('apis:///v/contacts/' + id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

module.exports = function (ctx, container, options, done) {
    find(options.id,function (err, contact) {
        if (err) {
            return done(err);
        }
        var sandbox = container.sandbox;
        dust.render('admin-client-contacts-review', serand.pack(contact, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);

            $('.contact-ok', sandbox).on('click', function () {
                var thiz = $(this);
                utils.loading();
                utils.publish('contacts', contact, function (err) {
                    utils.loaded();
                    if (err) {
                        return console.error(err);
                    }
                    thiz.removeClass('text-primary').addClass('text-success')
                        .siblings('.contact-bad').addClass('hidden');

                    setTimeout(function () {
                        serand.redirect('/manage-contacts');
                    }, 500);
                });
            });

            done(null, function () {
                $('.admin-client-contacts-review', sandbox).remove();
            });
        });
    });
};
