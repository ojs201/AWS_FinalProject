/*document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn').addEventListener('click', () => {
        alert('User Data 버튼이 클릭되었습니다.');
    });
});*/

function goToUserData() {
    window.location.href = './userdata'
    }


document.addEventListener("DOMContentLoaded", function() {
    const poolData = {
        UserPoolId: 'ap-northeast-2_XnwnHB64H', // 사용자 풀 ID
        ClientId: '30ru3mhl5fgmsm9ll9h7kmh2p5', // 클라이언트 ID
    };
    
    const logoutButton = document.querySelector('.profile_btn');

    if (logoutButton) {
        logoutButton.addEventListener("click", function() {
            const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            const cognitoUser = userPool.getCurrentUser();

            if (cognitoUser != null) {
                cognitoUser.signOut(); // 사용자 로그아웃
                localStorage.removeItem('isLoggedIn'); // 로컬스토리지에서 로그인 정보 제거
                localStorage.removeItem('username');
                window.location.href = 'index.html'; // 로그인 페이지로 리디렉션
            }
        });
    }
});

