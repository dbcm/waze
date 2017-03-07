// ==UserScript==
// @name         Waze Map Editor - Utils
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  set of utils to speed development
// @author       Delfim Machado - dbcm@profundos.org
// @match        https://beta.waze.com/*editor/*
// @match        https://www.waze.com/*editor/*
// @exclude      https://www.waze.com/*user/*editor/*
// @grant        none
// ==/UserScript==

/*

reusable code for all WME tools i'm building

*/

(function(root) {
    "use strict";

    var face = {
        'meh': '¯\_(ツ)_/¯',
        'angry': '(⋟﹏⋞)',
        'happy': '⎦˚◡˚⎣'
    };

    var WMEutils = function(options) {
        this.init(options);
    };

    WMEutils.prototype.init = function(opt) {
        this._VERSION = 0.1;

        opt = opt || {};

        this.debug = opt.debug;

        this.app = opt.app || 'DUH';
        this.uid = opt.uid || '___';
        this.version = opt.version || '0.0.666';
    };

    /*
    	o
    	{
    		id: "blame",
    		name: "bl",
    		title: 'blame plugin : ¯\\_(ツ)_/¯  [last 10 days]',
    		desc: 'i blame you all',
    		content: menu
    	}
    */
    WMEutils.prototype.addTab = function(o) {
        var self = this;

        // while testing and developing...
        var mdk = function(id) {
            try {
                document.getElementById(id).remove();
            } catch (e) {
                console.log("X");
            };
        }

        if (document.getElementById("t" + o.id)) {
            return;
        };

        var addon = document.createElement('div');
        addon.innerHTML += '<div><div class="side-panel-section"><h4>' + o.title + '</h4><br>';
        addon.innerHTML += o.content;
        addon.innerHTML += '</div></div>';

        var navTabs = document.getElementsByClassName("nav nav-tabs")[0];
        var tabContent = document.getElementsByClassName("tab-content")[0];

        var newtab = document.createElement('li');
        newtab.id = "t" + o.id;
        newtab.innerHTML = '<a title="' + o.desc + '" href="#sidepanel-' + o.id + '" data-toggle="tab">' + o.name + '</a>';
        //mdk("t" + o.id);
        navTabs.appendChild(newtab);

        addon.id = "sidepanel-" + o.id;
        addon.className = "tab-pane";
        //mdk("sidepanel-" + o.id);
        tabContent.appendChild(addon);


        return {
            newtab,
            addon
        };
    };

    /*
    	f = ARRAY of functions
    */
    WMEutils.prototype.loopSegments = function(f) {
        for (var segId in Waze.model.segments.objects) {
            var seg = Waze.model.segments.get(segId);

            if (!this.isOnScreen(seg)) {
                continue;
            }

            if (!this.canEdit(seg)) {
                continue;
            }

            for (var i = 0; i < f.length; i++) {
                if (f[i])
                    f[i](seg);
            }
        }
    }

    /*
    	f = ARRAY of functions
    */
    WMEutils.prototype.loopVenues = function(f) {
            for (var venId in Waze.model.venues.objects) {
                var ven = Waze.model.venues.get(venId);

                if (!this.isOnScreen(ven)) {
                    continue;
                }

                if (!this.canEdit(ven)) {
                    continue;
                }

                for (var i = 0; i < f.length; i++) {
                    if (f[i])
                        f[i](ven);
                }
            }
        }
        /*
        	if the object visible
        */
    WMEutils.prototype.isOnScreen = function(obj) {
        if (obj.geometry) {
            return (Waze.map.getExtent().intersectsBounds(obj.geometry.getBounds()));
        }
        return false;
    }

    /*
    	can i edit this object
    */
    WMEutils.prototype.canEdit = function(obj) {
        return obj.isAllowed(obj.PERMISSIONS.EDIT_GEOMETRY) || seg.hasClosures() || seg.isUpdated() || this.isPortugal(obj);
    }

    /*
    	is this object in Portugal
    */
    WMEutils.prototype.isPortugal = function(obj) {
        var att = obj.attributes;
        var street = Waze.model.streets.get(att.primaryStreetID);
        var city = segment.model.cities.get(street.cityID);
        var countryId = city.countryID;

        return countryId === 181;
    }

    /*
    	return a random color
    */
    WMEutils.prototype.rColor = function() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /*
        obj = object to highlight, can be and segment or a place (landmark/venue)
        color = highlight color
    */
    WMEutils.prototype.highlightObject = function(obj, color) {
        return new OpenLayers.Feature.Vector(obj.geometry.clone(), {}, {
            strokeColor: color,
            strokeDashstyle: "none",
            strokeLinecap: "round",
            strokeWidth: 30,
            strokeOpacity: 0.5,
            fill: true,
            fillColor: color,
            fillOpacity: 0.2
        });
    };

    /*
    	options stuff
    */
    WMEutils.prototype.loadOptions = function() {
        var self = this;

        return JSON.parse(localStorage.getItem(self.uid + "_options"));
    }
    WMEutils.prototype.saveOptions = function(options) {
        var self = this;

        return localStorage.setItem(self.uid + "_options", JSON.stringify(options));
    }

    /*
    	log stuff
    */
    WMEutils.prototype.log = function(msg) {
        var self = this;

        var now = Date.now();
        console.log("[" + this.app + "] " + now + " : " + msg);
    }

    /*
    	returns true if you are using beta editor
    */
    WMEutils.prototype.onBeta = function() {
        return -1 !== window.location.href.indexOf("beta");
    }

    root.WMEutils = WMEutils;
})(this);
