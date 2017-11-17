'use strict'
const path = require('path');
const async = require('async');
const FormData = require('form-data');
const glob = require('glob');
const request = require('../utils/requset');
const isFile = require('../utils/isfile');
const isArray = require('../utils/isArray')
const fs = require('fs');

/**
 * 
 * @param {string | Array} files 
 * @param {Objiect} options 
 * @param {function} cb --**--@if (Error) return cb && cb(res || Error); cb && cb(null, res)
 */

function carryFile (files, options, cb) {
  options = options || {};

  //check files
  if (!files) {
    cb && cb(new Error("cannot find file to be carried"))
    return
  }
  // options = {
  //   name: "mujianguo",
  //   version: '1.2.0'
  // }
  // combin info of file to create formData
  let formBody = new FormData()
  let pageFactory = {
    name: options.name,
    version: options.version,
    force: "false",
    env: "test"
  }
  if (options.env) {
    pageFactory.env = options.env; 
  }
  if (options.force && (options.env !== 'production')) {
    pageFactory.force = "true"
  }
  if (options.key !== undefined) {
    pageFactory.key = options.key
  }
  
  for (let key in pageFactory) {
    // make code strong
    if (pageFactory.hasOwnProperty(key)) {
      formBody.append(key, pageFactory[key]);
    }
  }


  /**
   * 
   * @param {string|Array} fileItem 
   */
  const appenFilecontent = (fileItem) => {
    if (isArray(fileItem)) {
      fileItem.forEach(appenFilecontent)
    } else if (typeof fileItem === 'string') {
      fileItem = path.normalize(fileItem);
      let fileKey = fileItem
      if (options.base) {
        fileKey = path.relative(options.base, fileKey);
      }
      fileKey = fileKey.replace(/\\/g, '/');
      formBody.append(fileKey, fs.createReadStream(fileItem))
    }
    return formBody;
  }

  appenFilecontent(files)

  formBody.submit(options.url, (err, res) => {
    if (err) return cb && cb(err);

    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      let parsedData;

      try {
        parsedData = JSON.parse(rawData);
      } catch (e) {
        cb && cb(rawData)
        console.error(e.message);
        return;
      }

      cb && cb(null, parsedData)
    });
  })
}

// carryFile([process.cwd() + '/dist/0.js', process.cwd() + '/dist/1.js'])
// carryFile(process.cwd() + '/dist/0.js')

function receiptFile(describe, cb) {
  // for test
  //describe = path.join(__dirname, '../', describe, "*")
  let fileArr = [];
  if (isArray(describe)) {
    let d = describe.length;
    Object.keys(describe).forEach((i, p) => {
      receiptFile(i, (err, res) => {
        if (res) {
          fileArr = fileArr.concat(res)
        }

        if (d === p) {
          cb && cb(null, fileArr)
        }
      })
    })
  }

  if (describe.key && describe.file) {
    cb && cb(null, [describe])
  } else if (isFile(describe)) {
    cb && cb(null, [describe])
  } else {

    //options is optional
    //glob("**/*.js", options, function (er, files) {
      // files is an array of filenames.
      // If the `nonull` option is set, and nothing
      // was found, then files is ["**/*.js"]
      // er is an error object or null.
    //})
    glob(describe, (er, files) => {
      if (files) {
        fileArr = fileArr.concat(files.filter(isFile));
      }
      cb(null, fileArr);
    });
  }
}

function uploadAndRetry(files, options, cb) {
  let RETRY_COUNT = 3;
  let statTimes = 0;
  let result;

  const launchTask = (taskFiles) => {
    startUpload(taskFiles, options, (err, res) => {
      if (!result) {
        result = res;
      } else if (res.success) {
        result.success += res.success;
      }
      
      result.errList = res.errList;
      
      if (err && statTimes < RETRY_COUNT &&  !!result.errList) {
        statTimes += 1;
        if (options.itemRetryCallback) {
          options.itemRetryCallback(statTimes, result.errList);
        }
        setTimeout(() => {
          launchTask(result.errList)
        }, 3000)
      } else {
        cb(err, result)
      }
    })
  }
  launchTask(files)
}

//start upload file
function startUpload(files, options, cb) {
  let result = {
    total: 0,
    failure: 0,
    success: 0,
    errList: [],
    message: '',
  }
  result.total =  files.length;

  let limitCount = 5;
  if(!!options.limitCount) {
    limitCount = options.limitCount;
  }

  //https://caolan.github.io/async/docs.html#eachLimit
  async.eachLimit(files, limitCount, (file, callback) => {
    if (options.itemUploadBefore) {
      options.itemUploadBefore(file)
    }

    carryFile(file, options, (err, res) => {
      res = res || {};
      if (!err && res.code===200 && !res.fail) {
        result.success += res.success;
        result.message = res.message;
        if (options.itemCallback) {
          options.itemCallback(null, file);
        }
      } else {
        result.message = res.message;
        result.errList.push(file);
        if (options.itemCallback) {
          options.itemCallback(err || res, res);
        }
      }
      //process control callback
      callback();
    })
    //@callback function be writed in here by me, this `eachLimit` work bad, Wasting my time to debug. 
    //callback()
  }, () => {
    if (result.errList.length) {
      cb(new Error('upload error'), result);
    } else {
      // it's here has a bug, beause @callback(); but it's fixed;
      cb(null, result);
    }
  })
}

// sende a message info of this uploadTask
function cloudMonitor(data) {
  request({
    url: `http:127.0.0.1:7002/upload/report`,
    method: 'get',
    params: data
  })
}

/**
 * 
 * @param {Object} options 
 * @param {string|Array} describe
 * @param {function} cb 
 */
module.exports = function(options, describe, cb) {
  options = options || {};

  let cdn = `http://127.0.0.1:7002/file/cdn`;
  if (!!options.url) {
    cdn = options.url;
  }

  // console.log('options', options);

  receiptFile(describe, (err, files) =>{
    if (err) console.log(err);
    if (!files || files.length===0) {
      cb && cb(null, {total: 0, success: 0, errList:[]})
      return;
    }

    uploadAndRetry(files, options, (err, res) => {
      options = {
        name: options.name,
        env: options.env || 'test',
        type: 'cdn',
      }
      // this function will be provided in the future.
      // cloudMonitor(data);
      cb && cb(err, res);
    })
  })
}