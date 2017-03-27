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
const gpxFilePath = function(par){
    return 'files/data'+par+'.gpx';
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
        var rotatearr = [];
        var movearr = [];
        var forwardarr = [];
        for(var i=0;i<data.length-1;i++){
            var angl = getAngle(data[i].xacc,data[i].yacc,data[i+1].xacc,data[i+1].yacc);
            if(angl>10){
                rotatearr.push(data[i]);
            }else if(angl>5){
                movearr.push(data[i]);
            }else{
                forwardarr.push(data[i]);
            }
        }
        var ppp = Math.min(points_in_pack,rotatearr.length);
        for(var i=0;i<rotatearr.length;i+=ppp) {
            (function(t) {
                const jsdata = rotatearr.slice(t,t+ppp);
                gpx.toGPX({points: jsdata}, function (err, result) {
                    (function(res) {
                        res = res.replace(/trkpt/g, 'wpt');
                        res = res.replace(/<\/trkseg><\/trk>/g, '');
                        res = res.replace(/<trk>/g, '');
                        res = res.replace(/<trkseg>/g, '');
                        res = res.replace(/ele><time>/g, 'ele><name>');
                        res = res.replace(/<\/time><\/w/g, '<\/name><\/w');
                        if (err) return console.log(err);
                        console.log('GPX GEN: ' + t);
                        fs.writeFile(gpxFilePath(t+"_rota"), res, function (err) {
                            if (err) return console.log(err);
                            console.log('GPX OK: ' + t);
                        });
                    })(result);
                    //console.log(res);
                });
            })(i);
            //console.log(data);
        }
        var ppp = Math.min(points_in_pack,movearr.length);
        for(var i=0;i<movearr.length;i+=ppp) {
            (function(t) {
                const jsdata = movearr.slice(t,t+ppp);
                gpx.toGPX({points: jsdata}, function (err, result) {
                    (function(res) {
                        res = res.replace(/trkpt/g, 'wpt');
                        res = res.replace(/<\/trkseg><\/trk>/g, '');
                        res = res.replace(/<trk>/g, '');
                        res = res.replace(/<trkseg>/g, '');
                        res = res.replace(/ele><time>/g, 'ele><name>');
                        res = res.replace(/<\/time><\/w/g, '<\/name><\/w');
                        if (err) return console.log(err);
                        console.log('GPX GEN: ' + t);
                        fs.writeFile(gpxFilePath(t+"_move"), res, function (err) {
                            if (err) return console.log(err);
                            console.log('GPX OK: ' + t);
                        });
                    })(result);
                    //console.log(res);
                });
            })(i);
            //console.log(data);
        }
        var ppp = Math.min(points_in_pack,forwardarr.length);
        for(var i=0;i<forwardarr.length;i+=ppp) {
            (function(t) {
                const jsdata = forwardarr.slice(t,t+ppp);
                gpx.toGPX({points: jsdata}, function (err, result) {
                    (function(res) {
                        res = res.replace(/trkpt/g, 'wpt');
                        res = res.replace(/<\/trkseg><\/trk>/g, '');
                        res = res.replace(/<trk>/g, '');
                        res = res.replace(/<trkseg>/g, '');
                        res = res.replace(/ele><time>/g, 'ele><name>');
                        res = res.replace(/<\/time><\/w/g, '<\/name><\/w');
                        if (err) return console.log(err);
                        console.log('GPX GEN: ' + t);
                        fs.writeFile(gpxFilePath(t+"_forw"), res, function (err) {
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

getAngle = function(x0,y0,x1,y1){
  return Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
};

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});