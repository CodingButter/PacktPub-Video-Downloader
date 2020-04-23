const LOGIN_URL = 'https://www.packtpub.com/login';
const PLAYLIST_URL = "https://subscription.packtpub.com/playlists";
const EMAIL_SELECTOR = '[name="email"]';
const PASSWORD_SELECTOR = '[name="password"]';
const LOGIN_BUTTON = `.btn.btn-primary.btn-block.mb-3`;
const ACCOUNT_CHANGE_EMAIL_BUTTON = ".mat-form-button.change-email.mat-button";
const ERROR_ALERT = ".alert.alert-danger";
const Login = async (nightmare, email, password) => {
    return new Promise((resolve, reject) => {
        console.log("\nStarting Login Script")
        nightmare.goto(LOGIN_URL).wait(EMAIL_SELECTOR).wait(1000).type(EMAIL_SELECTOR, email).wait(1000).type(PASSWORD_SELECTOR, password).wait(1000).click(LOGIN_BUTTON).then(() => {
            roboCheck(nightmare).then(() => {
                nightmare.wait(ACCOUNT_CHANGE_EMAIL_BUTTON).then(() => {
                    console.log('Login Successfull');
                    resolve(true);
                });
            });
        });
    });
};

const roboCheck = (nightmare) => {
    console.log("Attempting Login")
    return new Promise((resolve, reject) => {
        nightmare.wait(2000).evaluate((ERROR_ALERT) => {
            return document.querySelectorAll(ERROR_ALERT).length > 0;
        }, ERROR_ALERT).then((resp) => {
            if (resp) {
                nightmare.click(LOGIN_BUTTON);
                roboCheck(nightmare).then(() => {
                    resolve(false);
                });
            } else {
                resolve(false);
            }
        })
    });
}
module.exports = Login;
