import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {AuthService} from '../auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {
    public allowed: boolean;

    constructor(private authService: AuthService, private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.isLoggedIn();
    }

    canLoad(route: Route): boolean | Observable<boolean> | Promise<boolean> {
        return this.isLoggedIn();
    }

    isLoggedIn(): Observable<boolean> {
        return this.authService.user.pipe(filter(v => v !== null), map(user => !!user));
    }
}
