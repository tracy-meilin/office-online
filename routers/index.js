const express = require("express");
const router = express.Router();
//const WebSocket = require('ws');
//const WebSocketServer = WebSocket.Server;
var path = require("path");
var request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var mime = require('mime');
var os = require('os');

const {
    execFile, execFileSync
} = require('child_process');

console.log(process.env['PATH'])

//ws 连接
// const wss = new WebSocketServer({
//     port : 3000
// });

// wss.on('connection', function(ws){
//     console.log('[SERVER] connection()');
//     ws.on('message', function(message){
//         console.log('[SERVER] Received: ${message}');
//         ws.send(`What's your name?`, (err) => {
//             if (err) {
//                 console.log(`[SERVER] error: ${err}`);
//             }
//         });
//     });
// });

// console.log('ws server started at port 3000...');

////////////////////////////////////////////

// 获取主机的ip地址
function GetHostIP(){
    var interfaces = os.networkInterfaces;
    var IPv4 = "127.0.0.1"
    if(process.platform == 'darwin'){
        for(var i = 0; i < interfaces.en0.length; i++) {
            if(interfaces.en0[i].family == 'IPv4') {
                IPv4 = interfaces.en0[i].address;
            }
        }
    }else if(process.platform == 'win32')
    {
        for(var devName in interfaces) {
            var iface = interfaces[devName];
            for(var i = 0; i < iface.length; i++) {
                var alias = iface[i];
                if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    IPv4 = alias.address;
                }
            }
        }
    }

    return IPv4;
}

//计算md5值
function md5(data){
    if(data == undefined)
        return;
    var hashMd5 = crypto.createHash('md5');
    return hashMd5.update(data).digest('hex');
}

function requestDesktop(filename, req, res){
    try {
        var mode = "edit";
        var canEdit = req.query.canEdit == undefined ? true : req.query.canEdit;
        var type = req.query.type == undefined ? 'desktop' : req.query.type;
        var lang = 'en';
        var argss = {
            apiUrl: "web-apps/apps/api/documents/api.js",
            file: {
                name: path.basename(filename),
                ext: req.ext == undefined ? "docx" : req.ext,
                uri: "http://192.168.95.128:3000/files/__ffff_192.168.95.1/new%20(10).pptx",
                //version: countVersion,
                created: new Date().toDateString()
            },
            editor: {
                type: type,
                documentType: 'text',
                key: "0",
                token: "",
                // callbackUrl: "http://192.168.95.128:3000/track?filename=new%20(7).pptx&useraddress=__ffff_192.168.95.1",
                isEdit: canEdit && (mode == "edit" || mode == "filter"),
                review: mode == "edit" || mode == "review",
                comment: mode != "view" && mode != "embedded",
                modifyFilter: mode != "filter",
                mode: canEdit && mode != "view" ? "edit" : "view",
                canBackToFolder:false,// type != "embedded",
                // backUrl: "http://127.0.0.1:8081/back",
                //curUserHostAddress: docManager.curUserHostAddress(),
                lang: lang,
                userid: "uid-1",
                // name: "Jonn Smith",
                // fileChoiceUrl: "http://127.0.0.1:8081/fileChoice",
                plugins: JSON.stringify({
                    "pluginsData": []
                })
            },
            resData: {
                host : req.query.host == undefined? GetHostIP():req.query.host,
                url : req.query.resUrl == undefined?'':req.query.resUrl
            },
            history: {},
            historyData: {}
        };

        res.render("editor", argss);
    } catch (ex) {
        console.log(ex);
        res.status(500);
        res.render("error", {
            message: "Server error"
        });
    }
}

function x2tCacheFile(cacheFile, binFile) {
    //fs.stat(cacheFile, function (err, stat) {
        //if (stat == null || stat.isFile() == false) {
            try {
                const stdout = execFileSync(path.join(__dirname, "../converter", "x2t"), [cacheFile, binFile]);
                console.log(stdout);
            } catch (e) {}
        //}
    //});
}

router.get("/", function (req, res) {
    try {
        var mode = "edit";
        var canEdit = true;
        var type = 'desktop';
        var lang = 'en';
        var argss = {
            apiUrl: "web-apps/apps/api/documents/api.js",
            file: {
                name: "new (7).pptx",
                ext: 'pptx',
                uri: "http://192.168.95.128:3000/files/__ffff_192.168.95.1/new%20(10).pptx",
                //version: countVersion,
                created: new Date().toDateString()
            },
            editor: {
                type: type,
                documentType: 'text',
                key: "0",
                token: "",
                callbackUrl: "http://192.168.95.128:3000/track?filename=new%20(7).pptx&useraddress=__ffff_192.168.95.1",
                isEdit: canEdit && (mode == "edit" || mode == "filter"),
                review: mode == "edit" || mode == "review",
                comment: mode != "view" && mode != "embedded",
                modifyFilter: mode != "filter",
                mode: canEdit && mode != "view" ? "edit" : "view",
                canBackToFolder: type != "embedded",
                backUrl: "http://127.0.0.1:8081/back",
                //curUserHostAddress: docManager.curUserHostAddress(),
                lang: lang,
                userid: "uid-1",
                name: "Jonn Smith",
                fileChoiceUrl: "http://127.0.0.1:8081/fileChoice",
                plugins: JSON.stringify({
                    "pluginsData": []
                })
            },
            resData: {
                host : "localhost",
                url : "ppty/Edit.bin"
            },
            history: {},
            historyData: {} 
        };

        res.render("editor", argss);
    }
    catch (ex) {
        console.log(ex);
        res.status(500);
        res.render("error", { message: "Server error" });
    }
});

router.get('/priview', function(req, res) {
    //res.render("index", {});
    res.redirect('/web-apps/apps/presentationeditor/main/index.html');
});

router.get('/editor', function(req, res){

    var url = req.query.url;
    var fileExt = req.query.ext;

    console.log(url);
    if(url == undefined)
        return;

    //获取url的md5值
    var urlMd5 = md5(url);
    var ext = req.ext == undefined ? "docx" : req.ext;
    var filename = "public/cache/" + urlMd5 + "." + ext;

    var docxFile = url;
    var binFile = path.join(__dirname, "../public/ppty/Editor.bin");
    var cacheFile = path.join(__dirname, "../", filename);

    fs.stat(cacheFile, function(err, stat){
        if(stat && stat.isFile()){
            x2tCacheFile(cacheFile, binFile);
            requestDesktop(filename, req, res);
        }else{
            var stream = fs.createWriteStream(filename);

            request(url).pipe(stream).on('close', function (err) {
                console.log("文件[" + filename + "]下载完毕");
                x2tCacheFile(cacheFile, binFile);
                requestDesktop(filename, req, res);
            });
        }
    });
});

router.get('/getRes', function(req, res){
    var url = req.query.url;

    var urlMd5 = md5(url);
    var ext = req.ext == undefined ? "docx" : req.ext;
    var filename = "public/cache/" + urlMd5 + "." + ext;

    var pptyDir = path.join(__dirname, "../public/ppty/" + urlMd5);
    fs.stat(pptyDir, function(err, stat){
        if(stat == null || stat.isDirectory() == false){
            fs.mkdirSync(pptyDir);
        }   

        var binFile = pptyDir + "/Editor.bin";
        var cacheFile = path.join(__dirname, "../", filename);

        fs.stat(binFile, function(err, stat){
            if(stat && stat.isFile()){
                res.download(binFile);
            }else{
                var stream = fs.createWriteStream(filename);

                request(url).pipe(stream).on('close', function (err) {
                    console.log("文件[" + filename + "]下载完毕");
                    x2tCacheFile(cacheFile, binFile);
                    res.download(binFile);
                });
            }
        });
    });
});

router.get('/doc', function(req, res){
    var url = req.query.url;
    if(url == undefined)
        return;

    //获取url的md5值
    var urlMd5 = md5(url);
    var pptyDir = path.join(__dirname, "../public/ppty/" + urlMd5);
    fs.stat(pptyDir, function(err, stat){
        if(stat == null || stat.isDirectory() == false){
            fs.mkdirSync(pptyDir);
        }    

        var binFile = pptyDir + "/Editor.bin";
        fs.stat(binFile, function(err, stat){
            if(stat && stat.isFile()){
                requestDoc("ppty/" + urlMd5 + "/Editor.bin", "", req, res);
            }else{
                var resUrl = "getRes?url=" + url;
                requestDoc(resUrl, "", req, res);
            }
        });
    });
});

function requestDoc(resUrl, filename, req, res){
    try {
        var mode = req.query.mode == undefined? "edit" : req.query.mode;
        var canEdit = req.query.canEdit == undefined ? true : req.query.canEdit;
        var type = req.query.type == undefined ? 'desktop' : req.query.type;
        var lang = 'en';
        //var hostIP = GetHostIP();
        var argss = {
            apiUrl: "web-apps/apps/api/documents/api.js",
            file: {
                name: "",
                ext: req.ext == undefined ? "docx" : req.ext,
                uri: "http://192.168.95.128:3000/files/__ffff_192.168.95.1/new%20(10).pptx",
                //version: countVersion,
                created: new Date().toDateString()
            },
            editor: {
                type: type,
                documentType: 'text',
                key: "0",
                token: "",
                // callbackUrl: "http://192.168.95.128:3000/track?filename=new%20(7).pptx&useraddress=__ffff_192.168.95.1",
                isEdit: canEdit && (mode == "edit" || mode == "filter"),
                review: mode == "edit" || mode == "review",
                comment: mode != "view" && mode != "embedded",
                modifyFilter: mode != "filter",
                mode: canEdit && mode != "view" ? "edit" : "view",
                canBackToFolder:false,// type != "embedded",
                // backUrl: "http://127.0.0.1:8081/back",
                //curUserHostAddress: docManager.curUserHostAddress(),
                lang: lang,
                userid: "uid-1",
                // name: "Jonn Smith",
                // fileChoiceUrl: "http://127.0.0.1:8081/fileChoice",
                plugins: JSON.stringify({
                    "pluginsData": []
                })
            },
            resData: {
                host : req.query.host == undefined? "localhost:8080" :req.query.host,
                url : resUrl
            },
            history: {},
            historyData: {}
        };

        res.render("editor", argss);
    } catch (ex) {
        console.log(ex);
        res.status(500);
        res.render("error", {
            message: "Server error"
        });
    }
}

module.exports = router;