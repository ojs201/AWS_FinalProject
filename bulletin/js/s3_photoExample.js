var albumBucketName = "hama-bulletin";
var bucketRegion = "ap-northeast-2";
var IdentityPoolId = "ap-northeast-2:9d74a2fa-0a5b-4206-948d-54e6082933d4";
 
AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});
 
var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName }
});
 
// UUID 생성 함수 추가
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// db에 정보 올리는 함수
function upload_to_db(img_location) {
    var article_id = uuidv4();  // UUID로 article_id 자동 생성
    var article_title = document.querySelector("#title").value;
    var article_content = document.querySelector("#content").value;

    var username = localStorage.getItem('username');

    var Item = {
        'article_id': article_id,
        'title': article_title,
        'content': article_content,
        'img_source': img_location,
        'timestamp': new Date().toISOString(), // 현재 시간을 ISO 포맷으로 추가
        'author': username  // 작성자 정보 추가
    };
    console.log(Item);

    const URL = "https://8uetkgzthk.execute-api.ap-northeast-2.amazonaws.com/2024-08-26/article_resource";

    fetch(URL, {
        method: "POST",
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            "TableName": "simple_board",
            Item
        })
    }).then(resp => console.log(resp))
      .catch(err => console.log(err));
}

 
function add_article_with_photo(albumName, callback) {
    var files = document.getElementById("article_image").files;
    if (!files.length) {
        return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
 
    var photoKey = albumPhotosKey + fileName;
 
    var upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: albumBucketName,
            Key: photoKey,
            Body: file
        }
    });
 
    var promise = upload.promise();
 
    promise.then(
        function(data) {
            let img_location = data.Location;
            upload_to_db(img_location);

            alert("Successfully uploaded photo.");
            if (callback) callback();  // 콜백 함수 호출
        },
        function(err) {
            console.log(err);
            alert("There was an error uploading your photo: " + err.message);
        }
    );
}
