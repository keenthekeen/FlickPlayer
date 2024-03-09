import { Component, OnInit } from '@angular/core';
import { last, Observable } from 'rxjs';
import { ManService } from '../man.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { colorByFolderName } from '../../helpers';
import { PlayHistoryValue, PlayTrackerService } from '../play-tracker.service';
import { addIcons } from "ionicons";
import { logOutOutline, play } from "ionicons/icons";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
    folderList$: Observable<string[]>;
    lastVideo$: Observable<PlayHistoryValue | null>;
    protected readonly last = last;

    constructor(private manService: ManService, private router: Router, private authService: AuthService,
        private playTracker: PlayTrackerService) {
        addIcons({ logOutOutline, play });

    }

    logout() {
        this.authService.signOut().then(() => {
            this.router.navigate(['/']);
        }).catch(e => console.log('Reject', e));
    }

    ngOnInit() {
        this.folderList$ = this.manService.getVideoList().pipe(map(a => Object.keys(a)));
        this.lastVideo$ = this.playTracker.retrieve().pipe(map(history => {
            return Object.keys(history).sort((a, b) => {
                // @ts-ignore
                return history[b].updatedAt - history[a].updatedAt;
            }).slice(0, 1).map(key => history[key])[0] ?? null;
        }));
    }

    protected readonly colorByFolderName = colorByFolderName;

    goToLastVideo(lastVideo: PlayHistoryValue) {
        this.router.navigate(['home', lastVideo.year, lastVideo.course]);
    }
}
