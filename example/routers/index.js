'use strict';

const Busboy = require('busboy');
const MemoryStream = require('memorystream');
const config = require('../combo.config');
const fileutil = require('fileutil');
const path = require('path');
const fs  = require('fs');

module.exports = function(app) {
  
  app.post('/file/cdn', function(req, res) {
    
    // 创建 Busboy 解析上传的文件
    let busboy = new Busboy({ headers: req.headers });
    let params = {};
    let files = {};
    let cdnEnv;
    
    // 解析文件，将文件写入内容
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      let memorystream = new MemoryStream;
      files[fieldname] = {
        stream: memorystream,
        encoding: encoding
      }
      file.pipe(memorystream);
    });
    
    // 解析表单
    busboy.on('field', function(fieldname, value) {
      params[fieldname] = value;
    });
    
    // 解析完成
    busboy.on('finish', function() {
      const fileList = Object.keys(files);
      console.log("遍历文件，保存finish至指定目录", fileList)
      const length = fileList.length;
      let count = length;
      
      // 没有指定名称和版本，给出错误提升
      if (!params.name || !params.version) {
        res.end(JSON.stringify({
          code: 400,
          total: length,
          message: 'the name or version is missing'
        }));
        return;
      }
      
      
      if (params.env === 'production') {
        cdnEnv = 'production';
      } else {
        cdnEnv = 'test';
      }
      
      // 如果没有文件，直接给出提示
      if (count === 0) {
        res.end(JSON.stringify({
          code: 400,
          total: length,
          message: 'No file found'
        }));
        return;
      }
      
      let errors = [];
      
      function onComplete() {
        if (errors.length === 0) {
          res.end(JSON.stringify({
            code: 200,
            total: length,
            success: length,
            message: `total ${length} file uploaded successful.`
          }));
        } else {
          res.end(JSON.stringify({
            code: 200,
            total: length,
            success: length - errors.length,
            fail: errors,
            message: `total ${length} file, ${errors.length} failed.`
          }))
        }
      }
      
      // 遍历文件，保存至指定目录
      Object.keys(files).forEach((name) => {
        
        let filepath = path.join(path.join('../', '/data'), cdnEnv, params.name, params.version, name);
        const dir = path.dirname(filepath);

        // 如果文件存在，并且没有 force 参数，则无法覆盖
        if (fileutil.isFile(filepath)) {
          if (params.force !== 'true' && params.force !== '1') {
            errors.push({
              file: name,
              message: 'Cannot overwrite file without force parameter.'
            })
            if (--count === 0) {
              onComplete();
            }
            return;
          }
        }
        
        // 如果目录不存在，则创建目录
        if (!fileutil.isDirectory(dir)) {
          try{
            fileutil.mkdir(dir);
          } catch (err) {
            errors.push({
              file: name,
              message: err.message
            })
            if (--count === 0) {
              onComplete();
            }
            return; 
          }
        }
        
        const encoding = files[name].encoding;
        const stream = files[name].stream;
        const saveStream = fs.createWriteStream(filepath, {
          defaultEncoding: encoding
        });
        saveStream.on('finish', () => {
          if (--count === 0) {
            onComplete();
          }
        });
        saveStream.on('error', (err) => {
          errors.push({
            file: name,
            message: err.message
          });
          if (--count === 0) {
            onComplete();
          }
        });
        stream.pipe(saveStream);
      });

    }).on('error', function(err) {
      res.end(JSON.stringify({
        code: 500,
        message: err.message
      }));
    });
    
    req.pipe(busboy);
  })
};