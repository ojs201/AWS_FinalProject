/*document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn').addEventListener('click', () => {
        alert('User Data 버튼이 클릭되었습니다.');
    });
});*/


// AWS Cognito 및 S3 설정
AWS.config.update({
    region: 'ap-northeast-2',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'ap-northeast-2:9d74a2fa-0a5b-4206-948d-54e6082933d4'
    })
});

var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: "hama-bulletin" }
});

// 사용자 프로필 로드 함수
function loadUserProfile() {
    getCurrentUserEmail(function(email) {
        document.getElementById('user-email').textContent = email;
        // 추가적으로 이메일에 연관된 S3의 프로필 이미지를 불러오려면 여기에 로직 추가 가능
    });
}

// 사용자 이메일 정보 가져오기
function getCurrentUserEmail(callback) {
    const poolData = {
        UserPoolId: 'ap-northeast-2_XnwnHB64H', // 기존 script.js에서 사용하던 사용자 풀 ID
        ClientId: '30ru3mhl5fgmsm9ll9h7kmh2p5', // 기존 script.js에서 사용하던 클라이언트 ID
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.log("Session error: ", err);
                return;
            }
            cognitoUser.getUserAttributes((err, attributes) => {
                if (err) {
                    console.log("Attribute error: ", err);
                    return;
                }

                const emailAttribute = attributes.find(attr => attr.getName() === 'email');
                const email = emailAttribute ? emailAttribute.getValue() : null;

                if (callback) {
                    callback(email);
                }
            });
        });
    } else {
        console.log("No current user");
    }
}


function triggerFileInput() {
    document.getElementById('profile_image').click();
}

document.getElementById('profile_image').addEventListener('change', function() {
    uploadProfileImage();
});

// 프로필 이미지 업로드 함수
function uploadProfileImage() {
    getCurrentUserEmail(function(email) {
        var files = document.getElementById("profile_image").files;
        if (!files.length) {
            return alert("Please choose a file to upload first.");
        }
        var file = files[0];
        var fileName = `User_Data/${email}/profile/${file.name}`;  // 이메일을 경로의 일부로 사용

        var upload = new AWS.S3.ManagedUpload({
            params: {
                Bucket: "hama-bulletin",
                Key: fileName,
                Body: file,
                ACL: 'public-read'  // 공개 접근 가능, 필요에 따라 수정 가능
            }
        });

        var promise = upload.promise();

        promise.then(
            function(data) {
                alert("Successfully uploaded profile image.");
                console.log("Image URL:", data.Location);
                document.getElementById('profile-picture').src = data.Location;
                document.getElementById('upload-status').textContent = "Upload successful!";
            },
            function(err) {
                console.log("Error uploading profile image:", err);
                alert("There was an error uploading your profile image: " + err.message);
                document.getElementById('upload-status').textContent = "Upload failed.";
            }
        );
    });
}

function showUploadedImage() {
    var profileImageUrl = document.getElementById('profile-picture').src;
    if (profileImageUrl && profileImageUrl !== "./img/profile_picture.png") {
        window.open(profileImageUrl, '_blank');
    } else {
        alert("No profile image uploaded.");
    }
}


function goToUserData() {
    window.location.href = './userdata'
    }


    function logout() {
        const poolData = {
            UserPoolId: 'ap-northeast-2_XnwnHB64H',
            ClientId: '30ru3mhl5fgmsm9ll9h7kmh2p5',
        };

        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        const cognitoUser = userPool.getCurrentUser();

        if (cognitoUser != null) {
            cognitoUser.signOut();
            alert("Logged out successfully.");
            localStorage.removeItem('isLoggedIn'); // 로컬스토리지에서 로그인 정보 제거
            localStorage.removeItem('username');
            window.location.href = "index.html"; // 로그인 페이지로 리디렉션
        }
    }
