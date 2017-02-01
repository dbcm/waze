// ==UserScript==
// @name         Waze Map Events Unready - Address
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  add location to events, easy to look for the ones you can help
// @author       Delfim Machado - dbcm@profundos.org
// @match        https://*.waze.com/events/unready
// @grant        none
// ==/UserScript==

'use strict';

// Google Maps API key
// get yours here: https://developers.google.com/maps/documentation/javascript/get-api-key
var key = null;

// add country to event
var setData = function(i, r) {
    var e = document.getElementsByClassName("mte-unready")[i];
    if (/\[/.test(e.innerText) === false) {
        var a = e.getElementsByClassName("mte-unready__address")[0];
        a.innerText = a.innerText + " [" + r + "] ";
        a.style.color = "red";
    }
};

var getCache = function(k) {
    var s = localStorage;

    return s.getItem("UNREADY_" + k);
};
var setCache = function(k, v) {
    var s = localStorage;

    return s.setItem("UNREADY_" + k, v);
};

// get country from Google API
var getAddress = function(lat, lon, i) {

    var r = getCache(lat + "_" + lon);
    if (r) {
        //console.log("FROM CACHE");
        setData(i, r);
    } else {
        var client = new XMLHttpRequest();
        client.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon + '&key=' + key, true);
        client.onreadystatechange = function() {
            if (client.readyState === 4 && client.status >= 200 && client.status < 300) {
                var jsonData = JSON.parse(client.responseText);
                var r = jsonData.results[0].formatted_address;

                setCache(lat + "_" + lon, r);
                setData(i, r);
            }
        };
        client.send(null);
    }
};

// loop thgough all events
var loopUnready = function() {
    var events = document.getElementsByClassName("mte-unready");

    var l = events.length;
    for (var i = 0; i < l; i++) {
        var e = events[i];

        var lat = e.href.match(/lat=([\-\d\.]+)/)[1];
        var lon = e.href.match(/lon=([\-\d\.]+)/)[1];

        getAddress(lat, lon, i);
    }
};

var init = function() {

    key = getCache("GoogleMapsAPIKey");

    var header = document.getElementsByClassName('events-header')[0];

    header.innerHTML = header.innerHTML + " [<a id='undeady_load'>SHOW ADDRESSES</a>]";

    header.innerHTML = header.innerHTML + " : Add your <a href='https://developers.google.com/maps/documentation/javascript/get-api-key'>Google Maps API</a> key here: <input style='width:350px' id='unready_key' value='" + key + "'></input> [<a id='unready_save'>SAVE</a>]";

    document.getElementById("undeady_load").addEventListener('click', function() {
        loopUnready();
    }, false);
    document.getElementById("unready_save").addEventListener('click', function() {
        setCache('GoogleMapsAPIKey', document.getElementById("unready_key").value);
    }, false);
};

init();


/*
Goodies:

for (var i = 0; i < localStorage.length; i++){
    console.log(localStorage.key(i) + " _ " +localStorage.getItem(localStorage.key(i)));
}
*/
