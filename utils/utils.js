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

	WMEutils.prototype.init = function(options) {
		this._VERSION = 0.1;

		options = options || {};

		this.debug = options.debug;

		this.app = options.app || 'DUH';
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

		var addon = document.createElement('div');
		addon.innerHTML += '<div><div class="side-panel-section"><h4>' + o.title + '</h4><br>';
		addon.innerHTML += o.content;
		addon.innerHTML += '</div></div>';

		var navTabs = document.getElementsByClassName("nav nav-tabs")[0];
		var tabContent = document.getElementsByClassName("tab-content")[0];

		var newtab = document.createElement('li');
		newtab.id = "t" + o.id;
		newtab.innerHTML = '<a title="' + o.desc + '" href="#sidepanel-' + o.id + '" data-toggle="tab">' + o.name + '</a>';
		mdk("t" + o.id);
		navTabs.appendChild(newtab);

		addon.id = "sidepanel-" + o.id;
		addon.className = "tab-pane";
		mdk("sidepanel-" + o.id);
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
				f[i](seg);
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
		log stuff
	*/
	WMEutils.prototype.log = function(msg) {
		var self = this;

		var now = Date.now();
		console.log("[" + this.app + "] " + now + " : " + msg);
	}


	root.WMEutils = WMEutils;
})(this);
