/*
 * @Author: Zhaoheng && hellolad@126.com
 * @Date: 2023-09-18 10:39:42
 * @LastEditors: Zhaoheng && hellolad@126.com
 * @LastEditTime: 2023-09-19 14:46:06
 * @FilePath: /code-test/app/index.js
 * @Description:
 *
 * Copyright (c) 2023 by Zhaoheng, All Rights Reserved.
 */
const ExifTool = require("exiftool-vendored").ExifTool;
const fs = require("fs");
const path = require("path");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const jimp = require("jimp");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: "app/uploads/" }).array("file"));

app.get("/index.html", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});
app.get("/exchange", (req, res) => {
  res.send({ text: "Hello" });
});
app.post("/upload", function (req, res) {
  console.log("req", req.files[0]);
  const file = req.files[0];
  const inputpath = path.join(__dirname, "/uploads") + "/" + file.filename;
  const output = path.join(__dirname, "/output");
  const outputpath = output + "/" + file.filename + ".jpg";
  fs.stat(output, (err) => {
    if (!err) {
      exchange(inputpath, outputpath);
    } else {
      fs.mkdirSync(output);
      exchange(inputpath, outputpath);
    }
  });

  function exchange(inputpath, outputpath) {
    const exiftool = new ExifTool({ taskTimeoutMillis: 15000 });
    exiftool.readRaw(inputpath).then((result) => {
      console.log("result", result.CameraOrientation);
      const [_, angle, end] = result.CameraOrientation.split(" ");
      exiftool
        .extractPreview(inputpath, outputpath)
        .then((_) => {
          if (angle === "(normal)") {
            res.send({
              path: outputpath,
            });
            return;
          }
          jimp.read(outputpath, (err, lenna) => {
            if (err) throw err;
            const rotateAngle = 360 - +angle;
            console.log("rotateAngle", rotateAngle, angle);
            lenna.rotate(rotateAngle).write(outputpath, (err) => {
              if (err) throw err;
              res.send({
                path: outputpath,
              });
            });
          });
        })
        .catch((err) => {
          console.log("err", err);
        })
        .finally(() => exiftool.end());
    });
  }
});

app.listen(7001, () => {
  console.log("web server runing at http://127.0.0.1:7001");
});
