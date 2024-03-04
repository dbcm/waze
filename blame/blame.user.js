// ==UserScript==
// @name         Waze Map Editor - Blame
// @namespace    http://tampermonkey.net/
// @version      1.0.5
// @description  show on WME what this users did in the last X days
// @author       Delfim Machado - dbcm@profundos.org
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor.*$/
// @run-at       document-end
// @exclude      https://www.waze.com/*user/*editor/*
// @grant        none
// @require      https://dbcm.github.io/waze/utils/utils.user.js
// ==/UserScript==

'use strict';

var boo = false;

// process operations
var procO = function(os, bl, ob) {
    var l = os.length;

    for (var i = 0; i < l; i++) {
        var o = os[i];

        if (o.objectCentroid === null)
            continue;

        var coords = OpenLayers.Layer.SphericalMercator.forwardMercator(o.objectCentroid.coordinates[0], o.objectCentroid.coordinates[1]);

        var point = new OpenLayers.Geometry.Point(coords.lon, coords.lat);

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

        var dd = ob.daysSince;
        dd = new Date(Date.now() - (dd * 86400 * 1000));

        function appendLeadingZeroes(n) {
            if (n <= 9) {
                return "0" + n;
            }
            return n
        }

        /*dd =
            appendLeadingZeroes(dd.getDate()) + "/" +
            appendLeadingZeroes(dd.getMonth() + 1) + "/" +
            dd.getFullYear() + " " +
            appendLeadingZeroes(dd.getHours()) + ":" +
            appendLeadingZeroes(dd.getMinutes()) + ":" +
            appendLeadingZeroes(dd.getSeconds());*/

        dd =
            appendLeadingZeroes(dd.getDate()) + "/" +
            appendLeadingZeroes(dd.getMonth() + 1) + "/" +
            dd.getFullYear();

        dd = boo ? ("← [" + dd + "] " + aType + ":" + o.objectType) : (aType + ":" + o.objectType + " [" + dd + "] →");

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
            labelAlign: boo ? 'left' : 'right',
            label: dd
        };
        boo = !boo;

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

    var blameLayer;
    if (o.bl === undefined) {
        var layers = W.map.getLayersBy("uniqueName", "__blame_" + o.uname);
        for (var i = 0; i < layers.length; i++) {
            layers[i].destroy();
        }
        var blID = "__blame_" + o.uname;
        var bl = W.map.getLayerByUniqueName(blID);
        if (bl === undefined) {
            blameLayer = new OpenLayers.Layer.Vector("Blame " + o.uname, {
                rendererOptions: {
                    zIndexing: true
                },
                uniqueName: blID,
                layerGroup: 'wme_blame'
            });
        } else {
            blameLayer = bl
        }

        blameLayer.setZIndex(9999);
        W.map.addLayer(blameLayer);
        W.map.addControl(new OpenLayers.Control.DrawFeature(blameLayer, OpenLayers.Handler.Path));
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

    if (o.uname === undefined)
        o.uname = W.model.users.getObjectById(o.user).userName;

    var opts = o.next ? '&till=' + o.next : '';

    var jsonData = getCache(o.next + o.user);
    if (o.next && jsonData) {
        console.log("FROM CACHE");
        procBlame(o, jsonData);
    } else {
        var client = new XMLHttpRequest();
        client.open('GET', 'https://' + www + '.waze.com/row-Descartes/app/UserProfile/Transactions?userID=' + o.user + opts, true);
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

var doBlame = function(e) {
    if (e.target) {
        if (e.target.nodeName === 'BUTTON') {
            if (e.target.innerText === 'blame') {
                console.log("HIT HERE " + e.target.nodeName + " : " + e.target.value + " : " + e.target.alt + " : " + e.target.id);
                var color = utils.rColor();
                e.target.style.color = color;
                getTransactions({
                    deep: deep,
                    days: days,
                    user: e.target.value,
                    color: color,
                    uname: e.target.alt
                });
            }
            if (e.target.innerText === 'X') {
                var user = W.model.users.getObjectById(e.target.value);
                var layers = W.map.getLayersBy("uniqueName", "__blame_" + user.attributes.userName);
                for (var i = 0; i < layers.length; i++) {
                    layers[i].destroy();
                }
                /*var bl = W.map.getLayerByUniqueName("__blame_" + user.attributes.userName);
                if (bl) {
                    W.map.removeLayer(bl);
                    var btn = document.getElementById("blame_" + e.target.value);
                    btn.style.color = null;
                }*/

            }
        }

    }
};

var resetBlame = function() {
    var layers = W.map.getLayersBy("layerGroup", "wme_blame");
    for (var i = 0; i < layers.length; i++) {
        layers[i].destroy();
    }
    /*for (var uid in W.model.users.objects) {
        var user = W.model.users.getObjectById(uid);
        //var bl = W.map.getLayerByUniqueName("__blame_" + user.attributes.userName);
        var bl = W.map.getLayersByName("Blame " + user.attributes.userName);
        if (bl)
            W.map.removeLayer(bl);
    }*/
};

var refreshBlame = function() {
    var blUT = document.getElementById("blame_users");
    var t = document.createElement("TABLE");
    var abc = W.loginManager.user.attributes.id == sec;
    t.style.width = '100%';


    blUT.innerHTML = "<table>";
    for (var uid in W.model.users.objects) {
        var user = W.model.users.getObjectById(uid);
        if(user.attributes.rank > W.loginManager.user.attributes.rank || (W.loginManager.user.attributes.rank > 2 && abc))
            continue;
        var tr = t.insertRow();
        var tdu = tr.insertCell();
        tdu.innerHTML = "<a target='_new' href='https://" + www + ".waze.com/user/editor/" + user.attributes.userName + "'>" + (user.attributes.userName.length > 20 ? user.attributes.userName.substring(0, 20) + "..." : user.attributes.userName) + "</a> (" + (user.attributes.rank + 1) + ")";

        var tdb = tr.insertCell();
        var b = document.createElement("button");
        b.id = "blame_" + uid;
        b.alt = user.attributes.userName;
        b.value = uid;
        b.innerText = "blame";
        tdb.appendChild(b);

        var tdx = tr.insertCell();
        var bx = document.createElement("button");
        bx.id = "blameX_" + uid;
        bx.alt = user.attributes.userName;
        bx.value = uid;
        bx.innerText = "X";
        tdx.appendChild(bx);

    };

    blUT.appendChild(t);

    blUT.addEventListener('click', function(e) {
        doBlame(e)
    });

};

var addMenu = function() {
    var menu = `<button id="blame_load">refresh users</button> : <button id="blame_reset">reset blame</button><hr><div id="blame_users"></did><hr><div id="blame_history"></div>`;

    utils.addTab({
        id: "blame",
        name: "bl",
        title: 'blame plugin : ¯\\_(ツ)_/¯  [last ' + days + ' days]',
        desc: 'i blame you all',
        content: menu
    });

    var blRefresh = document.getElementById('blame_load');
    blRefresh.addEventListener("click", refreshBlame);

    var blReset = document.getElementById('blame_reset');
    blReset.addEventListener("click", resetBlame);

};

var init = function() {
    // TODO: add this to utils
    var wme_sidebar = document.getElementById('sidepanel-prefs');

    if (wme_sidebar === null) {
        setTimeout(init, 1000);
        console.log("NO SIDEBAR??? W8ing a sec...");
        return;
    }

    clearCache();

    addMenu();
};


// how many requests do for each user?
var deep = 30;

// how many days to show?
var days = 10;

var utils = new WMEutils({
    app: 'blame'
});
var www = utils.onBeta() ? 'beta' : 'www';
var sec = 837112143;

init();
