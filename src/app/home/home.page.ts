import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ManService} from '../man.service';
import {map} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AuthService} from '../auth.service';
import {colorByFolderName} from '../../helpers';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
    folderList$: Observable<string[]>;

    constructor(private manService: ManService, private router: Router, private authService: AuthService) {
    }

    ngOnInit() {
        this.folderList$ = this.manService.getVideoList().pipe(map(a => Object.keys(a)));
    }

    logout() {
        this.authService.signOut().then(() => {
            this.router.navigate(['/']);
        }).catch(e => console.log('Reject', e));
    }

    protected readonly colorByFolderName = colorByFolderName;
}
