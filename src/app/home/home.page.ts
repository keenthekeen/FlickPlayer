import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ManService} from '../man.service';
import {map} from 'rxjs/operators';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
    folderList$: Observable<object>;

    constructor(private manService: ManService, private router: Router, private afAuth: AngularFireAuth) {
    }

    ngOnInit() {
        this.folderList$ = this.manService.getVideoList().pipe(map(a => Object.keys(a)));
    }

    logout() {
        this.afAuth.signOut().then(_ => {
            this.router.navigate(['/']);
        }).catch(e => console.log('Reject', e));
    }
}
