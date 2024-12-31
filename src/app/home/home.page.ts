import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {CourseListResponse, Lecture, ManService} from '../man.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { colorByFolderName } from '../../helpers';
import { addIcons } from "ionicons";
import { logOutOutline, play } from "ionicons/icons";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
    response$: Observable<CourseListResponse>;

    constructor(private manService: ManService, private router: Router, private authService: AuthService) {
        addIcons({ logOutOutline, play });
    }

    logout() {
        this.authService.signOut().then(() => {
            this.router.navigate(['/']);
        }).catch(e => console.log('Reject', e));
    }

    ngOnInit() {
        this.response$ = this.manService.getVideoList();
    }

    protected readonly colorByFolderName = colorByFolderName;

    goToLastVideo(lastVideo: Lecture) {
        return this.router.navigate(['home', lastVideo.course.category, lastVideo.course.name]);
    }

    protected readonly Object = Object;
}
