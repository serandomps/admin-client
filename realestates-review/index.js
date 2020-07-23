var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var RealEstates = require('model-realestates').service;

dust.loadSource(dust.compile(require('./template'), 'admin-client-realestates-review'));
dust.loadSource(dust.compile(require('./details'), 'admin-client-realestates-review-details'));

var findLocation = function (id, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('apis:///v/locations/' + id),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

var findContact = function (id, done) {
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
    var sandbox = container.sandbox;
    RealEstates.findOne({id: options.id}, function (err, realestate) {
        if (err) return done(err);
        async.parallel({
            location: function (found) {
                findLocation(realestate.location, function (err, location) {
                    if (err) {
                        console.error(err);
                    }
                    found(null, location);
                });
            },
            contact: function (found) {
                findContact(realestate.contact, function (err, contact) {
                    if (err) {
                        console.error(err);
                    }
                    found(null, contact);
                })
            }
        }, function (err, o) {
            if (err) {
                return done(err);
            }
            realestate._.contact = o.contact;
            realestate._.contactOK = o.contact && o.contact.status === 'published';
            realestate._.location = o.location;
            realestate._.locationOK = o.location && o.location.status === 'published';
            realestate._.realestateReady = realestate._.locationOK && realestate._.contactOK;
            realestate._.realestateOK = realestate.status === 'published';
            /*realestate._.picks = [
                {label: 'Published', value: 'published'},
                {label: 'Unpublished', value: 'unpublished'}
            ];*/
            realestate = serand.pack(realestate, container);
            dust.render('admin-client-realestates-review', realestate, function (err, out) {
                if (err) {
                    return done(err);
                }

                sandbox.append(out);

                $('.location-ok', sandbox).on('click', function () {
                    var thiz = $(this);
                    utils.loading();
                    utils.publish('locations', o.location, function (err) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        o.location.status = 'published';
                        thiz.removeClass('text-primary').addClass('text-success')
                            .siblings('.location-bad').addClass('hidden');
                        if (o.contact.status === 'published') {
                            $('.realestate-ok', sandbox).removeClass('disabled');
                        }
                    });
                });

                $('.contact-ok', sandbox).on('click', function () {
                    var thiz = $(this);
                    utils.loading();
                    utils.publish('contacts', o.contact, function (err) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        o.contact.status = 'published';
                        thiz.removeClass('text-primary').addClass('text-success')
                            .siblings('.contact-bad').addClass('hidden');
                        if (o.location.status === 'published') {
                            $('.realestate-ok', sandbox).removeClass('disabled');
                        }
                    });
                });

                $('.realestate-ok', sandbox).on('click', function () {
                    var thiz = $(this);
                    utils.loading();
                    utils.publish('realestates', realestate, function (err) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        thiz.removeClass('text-primary').addClass('text-success')
                            .siblings('.realestate-bad').addClass('hidden');

                        setTimeout(function () {
                            serand.redirect('/manage-realestates');
                        }, 500);
                    });
                });

                done(null, {
                    clean: function () {
                        $('.admin-client-realestates-review', sandbox).remove();
                    },
                    ready: function () {
                        var i;
                        var o = [];
                        var images = realestate._.images;
                        var length = images.length;
                        var image;
                        for (i = 0; i < length; i++) {
                            image = images[i];
                            o.push({
                                href: image.x800,
                                thumbnail: image.x160
                            });
                        }
                        blueimp.Gallery(o, {
                            container: $('.blueimp-gallery-carousel', sandbox),
                            carousel: true,
                            thumbnailIndicators: true,
                            stretchImages: true
                        });
                    }
                });
            });
        });
    });
};
