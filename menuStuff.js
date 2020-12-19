// Menu stuff

function toggle(menuItem) {
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
	toggle('logout');
	window.open('/', '_self');
}
