// ==UserScript==
// @name         Waze Map Editor - Blame
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  show on WME what this users did in the last X days
// @author       Delfim Machado - dbcm@profundos.org
// @match        https://*.waze.com/editor
// @grant        none
// ==/UserScript==

'use strict';

// process operations
var procO = function(os, bl, ob) {
    var l = os.length;

    for (var i = 0; i < l; i++) {
        var o = os[i];
        //console.log("actionType:" + o.actionType);

        //console.log(ob);

        if (o.objectCentroid === null)
            continue;

        var coords = OpenLayers.Layer.SphericalMercator.forwardMercator(o.objectCentroid.coordinates[0], o.objectCentroid.coordinates[1]);
        //var coords = OpenLayers.Layer.SphericalMercator.forwardMercator(-9.1773645906100008, 38.723484290700000);

        var point = new OpenLayers.Geometry.Point(coords.lon, coords.lat);
        var alertPx = Waze.map.getPixelFromLonLat(new OpenLayers.LonLat(coords.lon, coords.lat));

        var aType = o.actionType;
        switch (o.actionType) {
            case "DELETE":
                aType = "D";
                break;
            case "UPDATE":
                aType = "U";
                break;
            case "ADD":
                aType = "A";
                break;
        }

        var style = {
            strokeColor: ob.color,
            strokeOpacity: 0.5,
            strokeWidth: 3,
            fillColor: ob.color,
            fillOpacity: 0.02,
            pointRadius: 6,
            fontColor: 'white',
            labelOutlineColor: ob.color,
            labelOutlineWidth: 4,
            labelAlign: 'left',
            label: ob.daysSince + "]" + aType + ":" + o.objectType
        };

        var imageFeature = new OpenLayers.Feature.Vector(point, null, style);

        bl.addFeatures([imageFeature]);
    }
}

// process transactions
var procT = function(ts, bl, o) {
    var l = ts.length;

    var daysSince;
    for (var i = 0; i < l; i++) {
        var t = ts[i];
        o.daysSince = t.daysSince;
        procO(t.operations, bl, o);
        daysSince = t.daysSince;
    }

    return daysSince;
}

var getCache = function(k) {
    var s = localStorage;
    if (k) {
        var v = JSON.parse(s.getItem("BLAME_" + k))
        if (v)
            return v.value;
    }
};
var setCache = function(k, v) {
    var s = localStorage;

    return s.setItem("BLAME_" + k, JSON.stringify({
        value: v,
        tstamp: Date.now()
    }));
};

var procBlame = function(o, jsonData) {
    //console.log(jsonData);

    var blameLayer;
    if (o.bl === undefined) {

        var blID = "__blame_" + o.uname;
        var bl = Waze.map.getLayerByUniqueName(blID);
        if (bl === undefined) {
            blameLayer = new OpenLayers.Layer.Vector("Blame " + o.uname, {
                rendererOptions: {
                    zIndexing: true
                },
                uniqueName: blID
            });
        } else {
            blameLayer = bl
        }

        blameLayer.setZIndex(9999);
        Waze.map.addLayer(blameLayer);
        Waze.map.addControl(new OpenLayers.Control.DrawFeature(blameLayer, OpenLayers.Handler.Path));
        blameLayer.setVisibility(true);
        blameLayer.destroyFeatures();
    } else {
        blameLayer = o.bl
    }

    var days = procT(jsonData.transactions, blameLayer, o);
    console.log("ROUND " + o.deep + " _ " + o.uname + " : Days retrieved " + days);

    if (o.deep > 0 && days < o.days) {
        o.deep = o.deep - 1;
        o.next = jsonData.nextTransactionDate;
        o.bl = blameLayer;
        getTransactions(o);
    }
}

var getTransactions = function(o) {
    //console.log("ROUND " + o.deep);

    //debugger;

    if (o.uname === undefined)
        o.uname = Waze.model.users.get(o.user).userName;

    var opts = o.next ? '&till=' + o.next : '';

    var jsonData = getCache(o.next + o.user);
    if (o.next && jsonData) {
        console.log("FROM CACHE");
        procBlame(o, jsonData);
    } else {
        var client = new XMLHttpRequest();
        client.open('GET', 'https://www.waze.com/row-Descartes/app/UserProfile/Transactions?userID=' + o.user + opts, true);
        client.onreadystatechange = function() {
            if (client.readyState === 4 && client.status >= 200 && client.status < 300) {
                var jsonData = JSON.parse(client.responseText);
                if (o.next)
                    setCache(o.next + o.user, jsonData);

                procBlame(o, jsonData)

            }
        }
        client.send(null);
    }
}

var clearCache = function() {
    var s = localStorage;
    var l = s.length;
    for (var i = 0; i < l; i++) {
        var key = s.key(i);
        //console.log(key + " _ " + s.getItem(key));

        if (/^BLAME_/.test(key)) {
            var o = JSON.parse(s.getItem(key));
            var d = Math.round((Date.now() - o.tstamp) / 1000);
            //console.log("DIFF: "+d);
            // 10 days
            if (d > 864000) {
                s.removeItem(key);
            }
        }
    }
}

var init = function() {
    clearCache();

    // add menu and stuff
}

init();

// how many requests do for each user?
var deep = 10;
// how many days to show?
var days = 10;

// dbcm
getTransactions({
    deep: deep,
    days: days,
    user: 10159336,
    color: 'green',
    uname: 'dbcm'
});

// davipt
getTransactions({
    deep: deep,
    days: days,
    user: 11154458,
    color: 'red',
    uname: 'davipt'
});


// matoplays
getTransactions({
    deep: deep,
    days: days,
    user: 190041988,
    color: 'blue',
    uname: 'matoplays'
});

// gilrodrigues
getTransactions({
    deep: deep,
    days: days,
    user: 22299592,
    color: 'yellow',
    uname: 'gilrodrigues'
});

// pvaladares
getTransactions({
    deep: deep,
    days: days,
    user: 19381413,
    color: 'brown',
    uname: 'pvaladares'
});

// goncalovm76
getTransactions({
    deep: deep,
    days: days,
    user: 294135634,
    color: 'black',
    uname: 'goncalovm76'
});
