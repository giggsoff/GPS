const express = require('express');
const app = express();
const csv=require('csvtojson');
const fs = require('fs');
const gpx = require('gps-util');
const request = require('request');
const points_in_pack = 2000;

const converter=csv({
    trim:true,
    ignoreColumns:[0,2,3,8,9,10,17,18]
});
const csvFilePath = 'files/data.csv';
const gpxFilePath = function(num){
    return 'files/data'+num+'.gpx';
};
const toDeg = function(raw) {
    const degree = Math.floor(raw / 100);
    const t = raw - degree * 100;
    return (degree + t / 60);
};
converter
    .fromFile(csvFilePath)
    .transf((jsonObj,csvRow,index)=>{
        jsonObj.lat=toDeg(csvRow[2]);
        jsonObj.lng=toDeg(csvRow[3]);
        jsonObj.angle = Number(csvRow[0]);
        jsonObj.ele = Number(csvRow[1]);
        jsonObj.speed = Number(jsonObj.speed);
        jsonObj.time = new Date(jsonObj.eventdt);
        delete jsonObj.eventdt;
        delete jsonObj.height;
        delete jsonObj.lon;
    })
    .on('end_parsed',(data)=>{
        console.log(data.length);
        const ppp = Math.min(points_in_pack,data.length);
        for(var i=0;i<=data.length-ppp;i+=ppp) {
            (function(t) {
                const jsdata = data.slice(t,t+ppp);
                gpx.toGPX({points: jsdata}, function (err, result) {
                    (function(res) {
                        if (err) return console.log(err);
                        console.log('GPX GEN: ' + t);
                        fs.writeFile(gpxFilePath(t), res, function (err) {
                            if (err) return console.log(err);
                            console.log('GPX OK: ' + t);
                        });
                        request.post({
                            headers: {'content-type': 'application/gpx+xml'},
                            url: 'http://192.168.1.199:8988/match?vehicle=car&type=gpx&gpx.route=false&max_visited_nodes=5000&elevation=true&millis='+jsdata[0].time.getTime(),
                            body: res
                        }, function (error, response, body) {
                            if (error) return console.log(error);
                            fs.writeFile(gpxFilePath(t + '_filtered'), body, function (err) {
                                if (err) return console.log(err);
                                console.log('GPX FILTER OK: ' + t);
                            });
                        });
                    })(result);
                    //console.log(res);
                });
            })(i);
            //console.log(data);
        }
    })
    .on('done',(error)=>{
        if(error) {
            console.log(error);
        }
        console.log('end')
    });

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});