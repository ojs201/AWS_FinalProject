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

// AWS API Gateway 설정 (Lambda와 연결)
const apiGatewayUrl = "https://8uetkgzthk.execute-api.ap-northeast-2.amazonaws.com/2024-08-26/User_Data"; // API Gateway URL

// UUID 생성 함수 추가
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


// userdata.html

// 사용자를 Change Profile 페이지로 리다이렉트
function redirectToChangeProfile() {
    window.location.href = "./change_profile.html";
}


// 사용자 프로필 로드 함수 (프로필 페이지)
function loadUserProfile() {
    getCurrentUserEmail(function(email) {
        document.getElementById('user-email').textContent = email;

        // DynamoDB에서 사용자 프로필 이미지 URL과 코멘트 가져오기
        fetch(`${apiGatewayUrl}?email=${email}`, {
            method: "GET",
        })
        .then(response => response.json())
        .then(data => {
            if (data.profileImageUrl) {
                // 사용자 프로필 이미지가 있으면 그걸 사용
                document.getElementById('profile-picture').src = data.profileImageUrl;
            } else {
                // 프로필 이미지가 없으면 기본 이미지 사용
                document.getElementById('profile-picture').src = "https://s3.ap-northeast-2.amazonaws.com/hama-bulletin/User_Data/no_email/no_profile_image.png";
            }

            // 코멘트가 있으면 사용, 없으면 기본 메시지 출력
            document.getElementById('current-comment').textContent = data.profilecoment || "No comment available.";
        })
        .catch(error => console.error('Error fetching profile data:', error));
    });
}


// 사용자 프로필 로드 함수 (프로필 수정 페이지)
function loadUserProfileForEdit() {
    getCurrentUserEmail(function(email) {
        fetch(`${apiGatewayUrl}?email=${email}`, {
            method: "GET",
        })
        .then(response => response.json())
        .then(data => {
            if (data.profileImageUrl) {
                document.getElementById('profile-picture').src = data.profileImageUrl;
            } else {
                document.getElementById('profile-picture').src = "https://s3.ap-northeast-2.amazonaws.com/hama-bulletin/User_Data/no_email/no_profile_image.png";
            }

            document.getElementById('profile_coment_input').value = data.profilecoment || "";
        })
        .catch(error => console.error('Error fetching profile data:', error));
    });
}

function saveProfileChanges() {
    getCurrentUserEmail(function(email) {
        var files = document.getElementById("new_profile_image").files;
        var profileComment = document.getElementById("new_profile_comment").value;

        // 이미지가 선택되지 않았으면 경고
        if (!files.length && !profileComment) {
            return alert("Please upload a profile image or add a comment to save changes.");
        }

        if (files.length) {
            var file = files[0];
            var fileName = `User_Data/${email}/profile/${file.name}`;

            var upload = new AWS.S3.ManagedUpload({
                params: {
                    Bucket: "hama-bulletin",
                    Key: fileName,
                    Body: file,
                    ACL: 'public-read'
                }
            });

            var promise = upload.promise();

            promise.then(
                function(data) {
                    alert("Successfully uploaded profile image.");
                    sendProfileDataToLambda(email, data.Location, profileComment);
                },
                function(err) {
                    console.log("Error uploading profile image:", err);
                    alert("There was an error uploading your profile image: " + err.message);
                }
            );
        } else {
            sendProfileDataToLambda(email, null, profileComment);
        }
    });
}
// Lambda로 프로필 데이터 전송
function sendProfileDataToLambda(email, profileImageUrl, profileComment) {
    const article_id = uuidv4(); // UUID로 article_id 생성
    const Item = {
        'article_id': article_id,  // article_id 추가
        'email': email,
        'profileImageUrl': profileImageUrl || null,
        'profilecoment': profileComment || null,
        'timestamp': new Date().toISOString()
    };

    fetch(apiGatewayUrl, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Item)  // 데이터를 JSON으로 변환하여 전송
    })
    .then(response => response.json())
    .then(data => {
        console.log("Success:", data);
        alert("Profile changes saved successfully.");
        window.location.href = 'user_data.html';  // 프로필 페이지로 리다이렉션
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("There was an error saving your profile changes.");
    });
}


// 사용자 이메일 정보 가져오기
function getCurrentUserEmail(callback) {
    const poolData = {
        UserPoolId: 'ap-northeast-2_3OiUAjbBV',
        ClientId: '3kb48em8sbdqluujhfrcsq36i0',
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

function goToUserData() {
    window.location.href = './userdata'
    }

    document.addEventListener("DOMContentLoaded", function() {
        const poolData = {
            UserPoolId: 'ap-northeast-2_3OiUAjbBV', // 사용자 풀 ID
            ClientId: '3kb48em8sbdqluujhfrcsq36i0', // 클라이언트 ID
        };
    
        const logoutButton = document.querySelector('.logout_btn');
    
        if (logoutButton) {
            logoutButton.addEventListener("click", function() {
                const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
                const cognitoUser = userPool.getCurrentUser();
                console.log("Current user: ", cognitoUser);  // 로그로 현재 사용자 정보 확인
    
                if (cognitoUser != null) {
                    console.log("Current user: ", cognitoUser);  // 로그로 현재 사용자 정보 확인
                    cognitoUser.getSession((err, session) => {
                        if (err) {
                            console.error('Session error: ', err);
                            return;
                        }
    
                        console.log('Session:', session);  // 세션 정보 출력
                        cognitoUser.signOut(); // 사용자 로그아웃
                        localStorage.removeItem('isLoggedIn'); // 로컬스토리지에서 로그인 정보 제거
                        localStorage.removeItem('username');
                        window.location.href = 'index.html'; // 로그인 페이지로 리디렉션
                    });
                } else {
                    console.log("No current user found.");  // 사용자가 없을 때 로그 메시지 출력
                }
            });
        }
    });
    
