import {Component, OnDestroy, OnInit} from '@angular/core';
import {AlertController, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';
import {ManService} from '../man.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {User} from '@angular/fire/auth';
import {AuthService} from '../auth.service';
import {distinctUntilKeyChanged} from 'rxjs/operators';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.page.html',
    styleUrls: ['./welcome.page.scss']
})
export class WelcomePage implements OnInit, OnDestroy {
    authStateSubscription: Subscription;
    isAuthChecked: boolean;
    user: User;
    isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    isIAB = /FBAN/.test(navigator.userAgent) || /FBAV/.test(navigator.userAgent) || /Line\//.test(navigator.userAgent);

    constructor(
        private router: Router, private authService: AuthService,
        private manService: ManService, private loadingCtrl: LoadingController,
        public alertCtrl: AlertController) {
    }

    ngOnInit() {
        this.loadingCtrl.create({
            message: 'Authenticating...',
            duration: 7000
        }).then(loading => {
            loading.present();
            this.authStateSubscription = this.authService.user.pipe(distinctUntilKeyChanged('uid')).subscribe((user) => {
                this.user = user;
                if (user) {
                    // User is signed in.
                    this.manService.checkAuthorization().toPromise().then((result) => {
                        if (result) {
                            this.isAuthChecked = true;
                            this.goToHome().then(_ => {
                                loading.dismiss();
                            });
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
                    });
                }
                loading.dismiss();
            });
        }).catch(e => console.log('Reject', e));
    }

    ngOnDestroy() {
        this.authStateSubscription.unsubscribe();
    }

    login() {
        this.authService.signInWithPopup();
    }

    logout() {
        this.authService.signOut().then().catch(e => console.log('Reject', e));
        this.isAuthChecked = false;
    }

    goToHome() {
        return this.isAuthChecked ? this.router.navigate(['/home']) : new Promise<void>(resolve => resolve());
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
