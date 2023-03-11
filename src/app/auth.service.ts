import {Injectable} from '@angular/core';
import {Auth, GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, User} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly idTokenSubject = new BehaviorSubject<string|null>(null);
    public readonly idToken = this.idTokenSubject.asObservable();
    private readonly userSubject = new BehaviorSubject<User|null>(null);
    public readonly user = this.userSubject.asObservable();

    constructor(private afAuth: Auth) {
        onIdTokenChanged(afAuth, user => {
            if (user != null) {
                this.userSubject.next(user);
                user.getIdToken().then(idToken => {
                    this.idTokenSubject.next(idToken);
                });
            } else {
                this.userSubject.next(null);
                this.idTokenSubject.next(null);
            }
        });
    }

    signInWithPopup() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({hd: 'docchula.com'});
        return signInWithPopup(this.afAuth, provider);
    }

    signOut() {
        return signOut(this.afAuth);
    }

}
