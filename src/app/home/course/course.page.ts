import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {CourseMembers, Lecture, ManService} from '../../man.service';
import {switchMap} from 'rxjs/operators';
import videojs from '../../../../node_modules/video.js/dist/video.es';
import 'videojs-seek-buttons';
import 'videojs-hotkeys';
import 'videojs-event-tracking';
import {AlertController} from '@ionic/angular';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireAnalytics} from '@angular/fire/analytics';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    selector: 'app-course',
    templateUrl: './course.page.html',
    styleUrls: ['./course.page.scss']
})
export class CoursePage implements OnInit, AfterViewInit {
    @ViewChild('videoPlayer') videoPlayerElement: ElementRef;
    videoPlayer: any;
    currentVideo: Lecture;
    year: string;
    course: string;
    list$: Observable<CourseMembers>;

    constructor(private route: ActivatedRoute, private router: Router,
                private manService: ManService, private alertController: AlertController,
                private analytics: AngularFireAnalytics, afAuth: AngularFireAuth,
                private sanitizer: DomSanitizer) {
        // Setup video request authentication
        afAuth.idToken.subscribe(token => {
            videojs.Hls.xhr.beforeRequest = (options) => {
                options.headers = {
                    Authorization: 'Bearer ' + token
                };
                return options;
            };
        });
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
        // Override native HLS in Chrome Android, due to lack of support of playbackRate
        const isChromeAndroid = /Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);
        this.videoPlayer = videojs(this.videoPlayerElement.nativeElement, isChromeAndroid ? {
            html5: {
                hls: {
                    overrideNative: true
                },
                nativeAudioTracks: false,
                nativeVideoTracks: false
            }
        } : {});

        // Setup hot keys
        this.videoPlayer.ready(function() {
            this.hotkeys({
                volumeStep: 0.1,
                seekStep: 10,
                enableModifiersForNumbers: false,
                enableVolumeScroll: false
            });
        });

        // Setup video analytics
        this.videoPlayer.eventTracking({
            performance: (data) => {
                this.analytics.logEvent('video_performance', this.attachEventLabel(data, true));
            }
        });
        this.videoPlayer.on('tracking:firstplay', (e, data) =>
            this.analytics.logEvent('video_firstplay', this.attachEventLabel(data)));
        this.videoPlayer.on('tracking:first-quarter', (e, data) =>
            this.analytics.logEvent('video_checkpoint', this.attachEventLabel(data, true)));
        this.videoPlayer.on('tracking:second-quarter', (e, data) =>
            this.analytics.logEvent('video_checkpoint', this.attachEventLabel(data, true)));
        this.videoPlayer.on('tracking:third-quarter', (e, data) =>
            this.analytics.logEvent('video_checkpoint', this.attachEventLabel(data, true)));
    }

    viewVideo(video: Lecture) {
        this.videoPlayer.src(video.sources.filter(source => {
            return this.videoPlayerElement.nativeElement.canPlayType(
                source.type.replace('application/dash+xml', 'video/mp4')
                    .replace('application/x-mpegURL', 'video/mp4')
                ) !== '';
        }));
        if (!/Android/i.test(navigator.userAgent)) {
            video.sourceExternal = null;
        }
        this.currentVideo = video;
        this.videoPlayerElement.nativeElement.focus();
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

    protected attachEventLabel(data: object, isNonInteraction ?: boolean) {
        return {
            ...data,
            event_label: this.currentVideo.identifier,
            non_interaction: isNonInteraction === true
        };
    }

    preventMouseEvent($event: MouseEvent) {
        // Prevent right-click only if video is downloadable
        if (this.currentVideo.sources.filter(s => s.path.endsWith('.mp4') || s.path.endsWith('.webm')).length > 0) {
            $event.preventDefault();
        }
    }

    sanitize(url: string) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
    }

    encodeURIComponent(url: string) {
        return encodeURIComponent(url);
    }

}
