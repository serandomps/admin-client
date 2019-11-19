var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var Vehicle = require('vehicles').service;

dust.loadSource(dust.compile(require('./template'), 'admin-client-vehicles-review'));
dust.loadSource(dust.compile(require('./details'), 'admin-client-vehicles-review-details'));

var findLocation = function (id, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/locations/' + id),
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
        url: utils.resolve('accounts:///apis/v/contacts/' + id),
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
    Vehicle.findOne({id: options.id, resolution: '800x450'}, function (err, vehicle) {
        if (err) return done(err);
        async.parallel({
            location: function (found) {
                findLocation(vehicle.location, function (err, location) {
                    if (err) {
                        console.error(err);
                    }
                    found(null, location);
                });
            },
            contact: function (found) {
                findContact(vehicle.contact, function (err, contact) {
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
            vehicle._.contact = o.contact;
            vehicle._.contactOK = o.contact && o.contact.status === 'published';
            vehicle._.location = o.location;
            vehicle._.locationOK = o.location && o.location.status === 'published';
            vehicle._.vehicleReady = vehicle._.locationOK && vehicle._.contactOK;
            vehicle._.vehicleOK = vehicle.status === 'published';
            /*vehicle._.picks = [
                {label: 'Published', value: 'published'},
                {label: 'Unpublished', value: 'unpublished'}
            ];*/
            vehicle = serand.pack(vehicle, container);
            dust.render('admin-client-vehicles-review', vehicle, function (err, out) {
                if (err) {
                    return done(err);
                }

                sandbox.append(out);

                $('.location-ok', sandbox).on('click', function () {
                    var thiz = $(this);
                    utils.loading();
                    utils.publish('accounts', 'locations', o.location, function (err) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        o.location.status = 'published';
                        thiz.removeClass('text-primary').addClass('text-success')
                            .siblings('.location-bad').addClass('hidden');
                        if (o.contact.status === 'published') {
                            $('.vehicle-ok', sandbox).removeClass('disabled');
                        }
                    });
                });

                $('.contact-ok', sandbox).on('click', function () {
                    var thiz = $(this);
                    utils.loading();
                    utils.publish('accounts', 'contacts', o.contact, function (err) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        o.contact.status = 'published';
                        thiz.removeClass('text-primary').addClass('text-success')
                            .siblings('.contact-bad').addClass('hidden');
                        if (o.location.status === 'published') {
                            $('.vehicle-ok', sandbox).removeClass('disabled');
                        }
                    });
                });

                $('.vehicle-ok', sandbox).on('click', function () {
                    var thiz = $(this);
                    utils.loading();
                    utils.publish('autos', 'vehicles', vehicle, function (err) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        thiz.removeClass('text-primary').addClass('text-success')
                            .siblings('.vehicle-bad').addClass('hidden');

                        setTimeout(function () {
                            serand.redirect('/manage-vehicles');
                        }, 500);
                    });
                });

                done(null, {
                    clean: function () {
                        $('.admin-client-vehicles-review', sandbox).remove();
                    },
                    ready: function () {
                        var i;
                        var o = [];
                        var images = vehicle._.images;
                        var length = images.length;
                        var image;
                        for (i = 0; i < length; i++) {
                            image = images[i];
                            o.push({
                                href: image.url,
                                thumbnail: image.url
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
