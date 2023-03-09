import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {first, map} from 'rxjs/operators';
import {ManService} from '../man.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {
    public allowed: boolean;

    constructor(private afAuth: AngularFireAuth, private router: Router, private manService: ManService) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.isLoggedIn();
    }

    canLoad(route: Route): boolean | Observable<boolean> | Promise<boolean> {
        return this.isLoggedIn();
    }

    isLoggedIn(): Observable<boolean> {
        return this.afAuth.idToken.pipe(
            first(),
            map(u => {
                if (u) {
                    this.manService.setIdToken(u);
                    return true;
                } else {
                    this.router.navigate(['/']);
                    return false;
                }
            })
        );
    }
}
