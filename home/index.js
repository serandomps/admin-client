var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var Vehicles = require('model-vehicles').service;

require('gallery');

dust.loadSource(dust.compile(require('./template'), 'admin-home'));

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    Vehicles.find({
        query: {
            sort: {
                updatedAt: -1
            },
            count: 2
        }
    }, function (err, vehicles) {
        if (err) return done(err);
        dust.render('admin-home', serand.pack(vehicles, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            done(null, {
                clean: function () {
                    $('.admin-home', sandbox).remove();
                },
                ready: function () {
                    var o = [];
                    vehicles.forEach(function (vehicle) {
                        var images = vehicle._.images || [];
                        images.forEach(function (image) {
                            o.push({
                                href: image.x800
                            });
                        });
                    });
                    blueimp.Gallery(o, {
                        container: $('.blueimp-gallery-carousel', sandbox),
                        carousel: true,
                        stretchImages: true
                    });
                }
            });
        });
    });
};
