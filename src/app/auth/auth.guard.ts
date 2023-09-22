import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {AuthService} from '../auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard {
    public allowed: boolean;

    constructor(private authService: AuthService, private router: Router) {
    }

    canActivate(): Observable<boolean> {
        // available parameters: route: ActivatedRouteSnapshot, state: RouterStateSnapshot
        return this.isLoggedIn();
    }

    canLoad(): boolean | Observable<boolean> | Promise<boolean> {
        // available parameters: route: Route
        return this.isLoggedIn();
    }

    isLoggedIn(): Observable<boolean> {
        return this.authService.user.pipe(filter(v => v !== null), map(user => !!user));
    }
}
