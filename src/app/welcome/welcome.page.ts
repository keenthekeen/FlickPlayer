import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AlertController, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';
import * as firebase from 'firebase/app';
import {ManService} from '../man.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.page.html',
    styleUrls: ['./welcome.page.scss']
})
export class WelcomePage implements OnInit, OnDestroy {
    isAuthChecked: boolean;
    authStateSubscription: Subscription;
    isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

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
            this.authStateSubscription = this.afAuth.authState.subscribe((user) => {
                if (user) {
                    // User is signed in.
                    // Set ID token for Man service
                    user.getIdToken().then(idToken => {
                        this.manService.setIdToken(idToken);
                        this.goToHome().then(_ => {
                            loading.dismiss();
                        });
                    });
                } else {
                    loading.dismiss();
                }
            });
        }).catch(e => console.log('Reject', e));
    }

    ngOnDestroy() {
        this.authStateSubscription.unsubscribe();
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
        return new Promise(resolve => {
            if (this.isAuthChecked) {
                this.router.navigate(['home']);
            } else {
                // Get this user's student information
                this.manService.checkAuthorization().toPromise().then((result) => {
                    if (result) {
                        this.isAuthChecked = true;
                        resolve();
                        this.goToHome();
                    }
                }, (reason: HttpErrorResponse) => {
                    if (reason instanceof ErrorEvent) {
                        this.alertError('Client Error', 'Please check your network connection.');
                    } else if (reason.status === 401) {
                        this.alertError('Unregistered!', 'You are not allowed to access this website.');
                    } else if (reason.status === 500 || reason.status === 502 || reason.status === 503 || reason.status === 504) {
                        this.alertError('Server Error', 'Please contact administrator.');
                    } else {
                        this.manService.changeEndpoint();
                        this.alertError('Connection Error', 'Unable to reach server. You may try again.');
                    }
                    resolve();
                });
            }
        });
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
