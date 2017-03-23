const express = require('express');
const app = express();
const csv=require('csvtojson');
const fs = require('fs');
const gpx = require('gps-util');
const request = require('request');
const points_in_pack = 10000;
const moment = require('moment');

const converter=csv({
    trim:true,
});
const csvFilePath = 'files/Coord.csv';
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
        jsonObj.lat=csvRow[0];
        jsonObj.lng=csvRow[1];
        jsonObj.time=new Date(moment(csvRow[2], "DD.MM.YYYY HH:mm").toDate());

    })
    .on('end_parsed',(data)=>{
        console.log(data.length);
        const ppp = Math.min(points_in_pack,data.length);
        for(var i=0;i<data.length;i+=ppp) {
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