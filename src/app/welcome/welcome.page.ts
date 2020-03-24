import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AlertController, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';
import * as firebase from 'firebase/app';
import {ManService} from '../man.service';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.page.html',
    styleUrls: ['./welcome.page.scss']
})
export class WelcomePage implements OnInit {
    isAuthChecked: boolean;

    constructor(
        private router: Router, public afAuth: AngularFireAuth,
        private manService: ManService, private loadingCtrl: LoadingController,
        public alertCtrl: AlertController) {
    }

    ngOnInit() {
        this.loadingCtrl.create({
            message: 'Authenticating...',
            duration: 7000
        }).then(loading => {
            loading.present();
            this.afAuth.authState.subscribe((user) => {
                if (user) {
                    // User is signed in.
                    // Set ID token for Man service
                    user.getIdToken().then(idToken => {
                        this.manService.setIdToken(idToken);

                        // Get this user's student information
                        this.manService.checkAuthorization().toPromise().then((result) => {
                            if (result) {
                                this.isAuthChecked = true;
                                loading.dismiss();
                                this.goToHome();
                            }
                        }, (reason: HttpErrorResponse) => {
                            if (reason instanceof ErrorEvent) {
                                this.alertError('Client Error', 'Please check your network connection.');
                            } else if (reason.status === 401) {
                                this.alertError('Unregistered!', 'You are not allowed to access this website.');
                            } else if (reason.status === 500) {
                                this.alertError('Server Error', 'Please contact administrator.');
                            } else {
                                this.alertError('Unexpected Error', 'Please contact administrator.');
                            }
                            loading.dismiss();
                        });
                    });
                } else {
                    loading.dismiss();
                }
            });
        }).catch(e => console.log('Reject', e));
    }


    login() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({hd: 'docchula.com'});
        this.afAuth.signInWithPopup(provider);
    }

    logout() {
        this.afAuth.signOut().then().catch(e => console.log('Reject', e));
    }

    goToHome() {
        this.router.navigate(['home']);
    }

    async alertError(header: string, message: string) {
        const alert = await this.alertCtrl.create({
            header,
            message,
            buttons: ['OK']
        });

        await alert.present();
    }
}
