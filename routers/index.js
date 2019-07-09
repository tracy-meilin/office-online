const express = require("express");
const router = express.Router();
var path = require("path");
var request = require('request');
var fs = require('fs');

const {
    execFile, execFileSync
} = require('child_process');

console.log(process.env['PATH'])



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

router.get('/editor', function(req, res) {
    res.redirect('/web-apps/apps/api/documents/index.html');
});

router.get('/priview', function(req, res) {
    //res.render("index", {});
    res.redirect('/web-apps/apps/presentationeditor/main/index.html');
});

router.get('/desktop', function(req, res){
    var url = req.query.url;
    console.log(url);

    var docxFile = url;
    var binFile = path.join(__dirname, "../public/ppty/Editor.bin");

    var filename = "public/docx/test.docx";
    var stream = fs.createWriteStream(filename);
    var docxFile = "";

    request(url).pipe(stream).on('close', function (err) {
        console.log("文件[" + filename + "]下载完毕");
        docxFile = path.join(__dirname, "../", filename);

        try {
            const stdout = execFileSync(path.join(__dirname, "../converter", "x2t"), [docxFile, binFile]);
            console.log(stdout);
        } catch (e) {}

        try {
            var mode = "edit";
            var canEdit = true;
            var type = 'desktop';
            var lang = 'en';
            var argss = {
                apiUrl: "web-apps/apps/api/documents/api.js",
                file: {
                    name: path.basename(filename),
                    ext: 'docx',
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
    });
});

router.get('/desktop/:url', function(req, res){
    var docxFile = path.join(__dirname, "../public/docx/1.docx");
    var binFile = path.join(__dirname, "../public/ppty/Editor.bin");

    try {
        const stdout = execFileSync(path.join(__dirname, "../converter", "x2t.exe"), [docxFile, binFile]);
        console.log(stdout);
    } catch (e) {}

    try {
        var mode = "edit";
        var canEdit = true;
        var type = 'desktop';
        var lang = 'en';
        var argss = {
            apiUrl: "web-apps/apps/api/documents/api.js",
            file: {
                name: path.basename(req.params.url),
                ext: path.extname(req.params.url),
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
});

module.exports = router;