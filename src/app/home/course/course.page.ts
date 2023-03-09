import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {combineLatest, EMPTY, Observable} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {CourseMembers, Lecture, ManService} from '../../man.service';
import {map, switchMap} from 'rxjs/operators';
import videojs from 'video.js';
import 'videojs-seek-buttons';
import 'videojs-hotkeys';
import 'videojs-event-tracking';
import 'videojs-youtube';
import {AlertController} from '@ionic/angular';
import {AngularFireAnalytics} from '@angular/fire/compat/analytics';
import {DomSanitizer} from '@angular/platform-browser';
import {PlayHistory, PlayTrackerService} from '../../play-tracker.service';

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
    courseProgress = {
        viewed: 0,
        duration: 0
    };
    isAndroid = /Android/i.test(navigator.userAgent);
    isIos = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);

    constructor(private route: ActivatedRoute, private router: Router,
                private manService: ManService, private alertController: AlertController,
                private analytics: AngularFireAnalytics, private sanitizer: DomSanitizer,
                private playTracker: PlayTrackerService) {
    }

    ngOnInit() {
        this.list$ = this.route.paramMap.pipe(
            switchMap(s => {
                this.year = s.get('year');
                this.course = s.get('course');
                if (this.year && this.course) {
                    return combineLatest([
                        this.manService.getVideosInCourse(this.year, this.course), this.playTracker.retrieve()])
                        .pipe(map(([videos, history]) => this.mergeVideoInfo(videos, history)));
                } else if (this.year) {
                    this.router.navigate(['home/' + this.year]);
                } else {
                    this.router.navigate(['home']);
                }
                return EMPTY;
            })
        );
    }

    ngAfterViewInit() {
        const shouldOverrideNative =
            // Override native HLS in Chrome Android, due to lack of support of playbackRate
            (/Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent));
            // also in desktop/iPad Safari, due to some HLS spec. incompatibility
            // || (/Safari/.test(navigator.userAgent) && !/Mobile/.test(navigator.userAgent));
        this.videoPlayer = videojs(this.videoPlayerElement.nativeElement, {
            ...(shouldOverrideNative ? {
                html5: {
                    hls: {
                        overrideNative: true
                    },
                    nativeAudioTracks: false,
                    nativeVideoTracks: false
                }
            } : {}),
            techOrder: ['html5', 'youtube']
        });

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
                if (this.videoPlayer.currentTime() > 30) {
                    this.analytics.logEvent('video_performance', this.attachEventLabel(data, true));
                    this.playTracker.updateCurrentTime(this.currentVideo.identifier, data.currentTime);
                }
            }
        });
        this.videoPlayer.on('tracking:firstplay', (e, data) =>
            this.analytics.logEvent('video_firstplay', this.attachEventLabel(data)));
        this.videoPlayer.on('tracking:first-quarter', (e, data) =>
            this.playTracker.updateCurrentTime(this.currentVideo.identifier, data.currentTime));
        this.videoPlayer.on('tracking:second-quarter', (e, data) =>
            this.playTracker.updateCurrentTime(this.currentVideo.identifier, data.currentTime));
        this.videoPlayer.on('tracking:third-quarter', (e, data) =>
            this.playTracker.updateCurrentTime(this.currentVideo.identifier, data.currentTime));
        this.videoPlayer.on('tracking:fourth-quarter', (e, data) =>
            this.playTracker.updateCurrentTime(this.currentVideo.identifier, data.currentTime));
        this.videoPlayer.on('tracking:pause', () =>
            this.playTracker.updateCurrentTime(this.currentVideo.identifier, this.videoPlayer.currentTime()));
        this.videoPlayer.on('loadedmetadata', () => {
            if (this.currentVideo.history.currentTime
                && this.currentVideo.duration
                && (((this.currentVideo.history.currentTime ?? 0) / this.currentVideo.duration) < 0.995)) {
                this.videoPlayer.currentTime(this.currentVideo.history.currentTime);
            }
        });
    }

    mergeVideoInfo(videos: CourseMembers, history: PlayHistory) {
        const progress = {
            viewed: 0,
            duration: 0
        };
        Object.keys(videos).forEach(lectureKey => {
            videos[lectureKey].history = history[videos[lectureKey].identifier] ?? {currentTime: null, updatedAt: null};
            if (videos[lectureKey].duration) {
                progress.duration -= -videos[lectureKey].duration;
                if (videos[lectureKey].history.currentTime) {
                    progress.viewed -= -videos[lectureKey].history.currentTime;
                }
            }
        });
        this.courseProgress = progress;
        return videos;
    }

    viewVideo(video: Lecture) {
        video.sources = video.sources.filter(source => {
            if (source.type === 'video/youtube') {
                return true;
            } else if (videojs.browser.IS_SAFARI
                && (source.type.startsWith('application/dash+xml') || source.type.startsWith('video/webm'))) {
                return false;
            } else if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && source.type.startsWith('application/x-mpegURL')) {
                // Don't play HLS on Safari
                return false;
            }
            return this.videoPlayerElement.nativeElement.canPlayType(
                source.type.replace('application/dash+xml', 'video/mp4')
                    .replace('application/x-mpegURL', 'video/mp4')
            ) !== '';
        });
        this.videoPlayer.src(video.sources);
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

    lectureById(index: number, lecture: Lecture) {
        return lecture.identifier;
    }

    protected attachEventLabel(data, isNonInteraction ?: boolean) {
        return {
            ...data,
            event_label: this.currentVideo.identifier,
            non_interaction: isNonInteraction === true
        };
    }

}
