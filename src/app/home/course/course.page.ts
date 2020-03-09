import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {CourseMembers, ManService} from '../../man.service';
import {switchMap} from 'rxjs/operators';
import videojs from '../../../../node_modules/video.js/dist/video.es';
import 'videojs-seek-buttons';
import 'videojs-hotkeys';
import {ManEndpoint} from '../../../environments/environment';
import {AlertController} from '@ionic/angular';

@Component({
    selector: 'app-course',
    templateUrl: './course.page.html',
    styleUrls: ['./course.page.scss']
})
export class CoursePage implements OnInit, AfterViewInit {
    @ViewChild('videoPlayer') videoPlayerElement: ElementRef;
    videoPlayer: any;
    year: string;
    course: string;
    list$: Observable<CourseMembers>;

    constructor(private route: ActivatedRoute, private router: Router,
                private manService: ManService, private alertController: AlertController) {
    }

    ngOnInit() {
        this.list$ = this.route.paramMap.pipe(
            switchMap(s => {
                const year = s.get('year');
                const course = s.get('course');
                this.year = year;
                this.course = course;
                if (year && course) {
                    return this.manService.getVideosInCourse(year, course);
                } else if (year) {
                    this.router.navigate(['home/' + year]);
                } else {
                    this.router.navigate(['home']);
                }
                return EMPTY;
            })
        );
    }

    ngAfterViewInit() {
        this.videoPlayer = videojs(this.videoPlayerElement.nativeElement);
        this.videoPlayer.ready(function() {
            this.hotkeys({
                volumeStep: 0.1,
                seekStep: 5,
                enableModifiersForNumbers: false,
                enableVolumeScroll: false
            });
        });
    }

    viewVideo(lecture) {
        this.videoPlayer.src({
            src: ManEndpoint + 'videos/' + this.year + '/' + this.course + '/' + lecture + '/master.m3u8',
            type: 'application/x-mpegURL'
        });
    }

    async setPlaybackSpeed() {
        const alert = await this.alertController.create({
            header: 'Please enter speed!',
            inputs: [
                {
                    name: 'speed',
                    type: 'number',
                    min: 0.5,
                    max: 8
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                },
                {
                    text: 'Ok',
                    handler: (i) => {
                        if (i.speed > 0.3 && i.speed < 9) {
                            this.videoPlayer.playbackRate(i.speed);
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

}
