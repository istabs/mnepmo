// Menu stuff

function setLoginStatus(menuItem) {
	switch (menuItem) {
		case 'login':
			$("#gantts").show();
			$("#logout").show();
			break;
		case 'logout':
		default:
			$("#gantts").hide();
			$("#logout").hide();
			break;
	}
}

function doLogout() {
	firebase.auth().signOut();
	setLoginStatus('logout');
	window.open('/', '_self');
}
