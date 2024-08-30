var albumBucketName = "hama-bulletin";
var bucketRegion = "ap-northeast-2";
var IdentityPoolId = "ap-northeast-2:9d74a2fa-0a5b-4206-948d-54e6082933d4";
let currentPage = 1;
const articlesPerPage = 10;

function getArticles() {
    fetch(URL, {
        method: "GET",
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(resp => resp.json())
    .then(function(data) {
        article_arr = data.Items;

        // timestamp 기준으로 최신순으로 정렬
        article_arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        displayArticles(article_arr, currentPage);
    })
    .catch(err => console.log(err));
}

function displayArticles(articles, page) {
    const articlesList = document.getElementById('articles');
    articlesList.innerHTML = '';

    const startIndex = (page - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const paginatedArticles = articles.slice(startIndex, endIndex);

    paginatedArticles.forEach(function(article) {
        let li = document.createElement('li'); 
        li.innerHTML = `
            <h3>${article.title}</h3>
            <p>작성자: ${article.author}</p>
            <p>작성 시간: ${new Date(article.timestamp).toLocaleString()}</p>
        `;
        li.onclick = function() {
            viewArticleDetail(article.article_id);
        };
        articlesList.appendChild(li);
    });

    // 페이지네이션 업데이트
    updatePagination(articles.length, page);
}

function updatePagination(totalArticles, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(totalArticles / articlesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        let button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';

        button.onclick = function() {
            changePage(i);
        };

        pagination.appendChild(button);
    }
}

function changePage(page) {
    currentPage = page;
    displayArticles(article_arr, currentPage);
}

function filterArticles() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filteredArticles = article_arr.filter(article => 
        article.title.toLowerCase().includes(searchInput) || 
        article.content.toLowerCase().includes(searchInput)
    );
    currentPage = 1; // 검색 시 첫 페이지로 이동
    displayArticles(filteredArticles, currentPage);
}

 
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
