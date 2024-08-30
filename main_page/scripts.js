document.addEventListener("DOMContentLoaded", function() {
    const poolData = {
        UserPoolId: 'ap-northeast-2_XnwnHB64H', // 사용자 풀 ID
        ClientId: '30ru3mhl5fgmsm9ll9h7kmh2p5', // 클라이언트 ID
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser();

    // 사용자가 로그인된 상태인지 확인
    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.log(err);
                window.location.href = "login.html"; // 로그인 페이지로 리디렉션
            } else {
                const user_id = session.getIdToken().decodePayload().sub; // user_id 가져오기

                // API 호출하여 이메일 정보 가져오기
                fetch(`https://your-api-endpoint.amazonaws.com/prod/getUserEmail?user_id=${user_id}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.email) {
                            document.getElementById("emailDisplay").innerText = data.email;
                        } else {
                            alert('이메일 정보를 가져오는 데 실패했습니다.');
                        }
                    })
                    .catch(error => console.error('Error fetching email:', error));
            }
        });
    } else {
        window.location.href = "login.html"; // 로그인 페이지로 리디렉션
    }

    // 로그아웃 버튼이 존재할 경우 로그아웃 기능 추가
    const logoutButton = document.querySelector('.profile_btn');
    if (logoutButton) {
        logoutButton.addEventListener("click", function() {
            if (cognitoUser != null) {
                cognitoUser.signOut(); // 사용자 로그아웃
                localStorage.removeItem('isLoggedIn'); // 로컬스토리지에서 로그인 정보 제거
                localStorage.removeItem('username');
                window.location.href = 'index.html'; // 로그인 페이지로 리디렉션
            }
        });
    }

    // User Data 버튼 클릭 시 사용자 데이터 페이지로 이동
    const userDataButton = document.querySelector('.btn');
    if (userDataButton) {
        userDataButton.addEventListener("click", () => {
            alert('User Data 버튼이 클릭되었습니다.');
            goToUserData(); // 사용자 데이터 페이지로 이동하는 함수 호출
        });
    }
});

// 사용자 데이터 페이지로 이동하는 함수
function goToUserData() {
    window.location.href = './userdata';
}
