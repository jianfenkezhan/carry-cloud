# carry-cloud

a module for uplaod the file in node app, make it easy & reliable.

## Usage

### Install

```
$ npm install carry-cloud --save-dev
```

Write the following code into the `script` field of your package.jion. e.g:

```js
 "scripts": {
    "deploy": "carry-cloud \"dist/**\" --base dist --env test"
  }

```

### Launch command in you Terminal

```
$ npm run deploy
```

## Options

| Property| Description | Default |
|----|----|----|
| name | folder name  | package.name |
|version | version | package.version |
| force  | overwrite | 'false' (@false : not overwrite, @true: force overwrite except `production`), |
| itemUploadBefore | callback upload before | @function: (err, res) => {}|
|itemCallback| callback upload finish when fileItem| @function: (err, res) => {}| 
| url | upload API | `http://127.0.0.1:7002/file/cdn` *method is must POST*|


Can get more API into `bin/carry-cloud `

## Example

For your better use of this module, i provide a express app, add POST API to test.<br>

So, you can do it.


```
$ cd carry-cloud/example
$ npm install
$ npm start
$ npm run deploy
```

You will get response like this;

```
[satrt]: dist/1.js
[satrt]: dist/2.js
[success]: dist/1.js
[success]: dist/2.js
[complete] carry 2 file(s), success 2 file(s).
```

## After

I want to make it better and better, if you are interested in this module, you can contact me by Email:980751937mu@gmail.com


## finally

Welcome fork & star, Thanks All. 