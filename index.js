const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const LoremIpsum = require("lorem-ipsum").LoremIpsum;
const AWS = require('aws-sdk');
const dayjs = require('dayjs');

require('dotenv').config()

const folderDatePath = dayjs().format('YYYYMMDDHH') // display


const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
  });
var filenameUUID = uuidv4(); // '110ec58a-a0f2-4ac4-8393-c866d813b8d1'

let lyrics =  lorem.generateParagraphs(7);
const filename = `${folderDatePath}/${filenameUUID}.txt`;

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const uploadFile = (data) => {
    return new Promise(function(resolve, reject){
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME, // pass your bucket name
          Key: filename, // file will be saved as testBucket/contacts.csv
          Body: data,
          Expires: 60,
          ContentType: 'plain/txt',
          //ACL: 'public-read'
      };
      s3.upload(params, function(s3Err, data) {
          if (s3Err) reject(s3Err);
          data = {...data, folder: folderDatePath};
          
          resolve(data);
      });
    })
};

function viewFiles(folder){
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME, // pass your bucket name
    Prefix: folder
};
  return new Promise(function(resolve, reject){
    s3.listObjects(params, function(s3Err, data) {
        if (s3Err){
          reject(s3Err);
        } 
        else{
          var href = this.request.httpRequest.endpoint.href;
          var bucketUrl = href + folder + "/";
          resolve({...data, bucketUrl: bucketUrl, folder: folder});
        }
      }
    );
  });
}

function displayItems(data){
  const bucketUrl = data.bucketUrl;
  const folder = data.folder;
  var photos = data.Contents.map(function(photo) {
    var photoKey = photo.Key;
    var photoUrl = bucketUrl + encodeURIComponent(photoKey);
    console.log(`Folder: ${folder} [${photoKey}], photoUrl: ${photoUrl}`);
    
  });
}

uploadFile(lyrics)
.then((data) => {
  console.log(`Upload Promise resolved:`, data);
  return data;
})
.then((data) => {
  console.log(`Fetch folder:`, data.folder);
  return viewFiles(data.folder);
})
.then((data) => {
  console.log(`List Promise resolved:`);
  displayItems(data);
})
.catch((data) => {
  console.log(`Promise rejected: ${data}`, data);
});
