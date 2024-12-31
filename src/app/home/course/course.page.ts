import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {combineLatest, EMPTY, Observable, share, Subject, takeUntil, timer} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {CourseMembers, Lecture, ManService} from '../../man.service';
import {map, switchMap} from 'rxjs/operators';
import videojs from 'video.js';
import 'videojs-hotkeys';
import 'videojs-youtube';
import {AlertController} from '@ionic/angular/standalone';
import {DomSanitizer} from '@angular/platform-browser';
import {PlayHistory} from '../../play-tracker.service';
import {Analytics, logEvent} from '@angular/fire/analytics';
import {addIcons} from "ionicons";
import {checkmarkOutline, closeOutline, documentAttachOutline, download, pauseCircleOutline} from "ionicons/icons";
import type Player from 'video.js/dist/types/player';
import {ulid} from 'ulid';

@Component({
    selector: 'app-course',
    templateUrl: './course.page.html',
    styleUrls: ['./course.page.scss'],
})
export class CoursePage implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('videoPlayer') videoPlayerElement: ElementRef;
    videoPlayer: Player;
    currentVideo: Lecture;
    year: string;
    course: string;
    list$: Observable<Lecture[]>;
    courseProgress = {
        viewed: 0,
        duration: 0
    };
    isAndroid = /Android/i.test(navigator.userAgent);
    isIos = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);
    lastPlayedVideoKey: string|null = null;
    sessionUid: string; // Unique ID for session x video (new id for each video)
    stopPolling = new Subject();

    constructor(private route: ActivatedRoute, private router: Router,
        private manService: ManService, private alertController: AlertController,
                private analytics: Analytics, private sanitizer: DomSanitizer) {
        addIcons({ download, documentAttachOutline, checkmarkOutline, closeOutline, pauseCircleOutline });
    }

    ngOnInit() {
        this.list$ = this.route.paramMap.pipe(
            switchMap(s => {
                this.year = s.get('year');
                this.course = s.get('course');
                if (this.year && this.course) {
                    return combineLatest([
                        this.manService.getVideosInCourse(this.year, this.course),
                        timer(1, 30000).pipe(
                            switchMap(() => this.manService.getPlayRecord(this.year, this.course)),
                            share(),
                            takeUntil(this.stopPolling),
                        ),
                    ]).pipe(map(([videos, history]) => this.mergeVideoInfo(videos, history)));
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
        this.videoPlayer = videojs(this.videoPlayerElement.nativeElement, {
            controlBar: {
                skipButtons: {
                    forward: 10,
                    backward: 10,
                }
            },
            techOrder: ['html5', 'youtube'],
        }, () => {
            // @ts-ignore
            this.videoPlayer.hotkeys({
                volumeStep: 0.1,
                seekStep: 10,
                enableModifiersForNumbers: false,
                enableVolumeScroll: false,
            });
            this.videoPlayer.on('pause', () => {
                if (!this.videoPlayer.seeking()) {
                    // is paused, not seeking
                    this.updatePlayRecord();
                }
            });
            this.videoPlayer.on('ended', () => this.updatePlayRecord());
            let lastUpdated = 0;
            this.videoPlayer.on('timeupdate', () => {
                // Update while playing every 2 minutes
                if (Date.now() - lastUpdated > 120000) {
                    lastUpdated = Date.now();
                    this.updatePlayRecord();
                }
            });
            this.videoPlayer.on('tracking:performance', (_e, data) => {
                console.log('performance');
                if (this.videoPlayer.currentTime() > 30) {
                    logEvent(this.analytics, 'video_performance', this.attachEventLabel(data, true));
                    this.updatePlayRecord();
                }
            });
            this.videoPlayer.on('loadedmetadata', () => {
                if (this.currentVideo.history.currentTime
                    && (!this.currentVideo.duration || (((this.currentVideo.history.currentTime ?? 0) / this.currentVideo.duration) < 0.995))) {
                    this.videoPlayer.currentTime(this.currentVideo.history.currentTime);
                }
            });
        });
    }

    ngOnDestroy() {
        this.stopPolling.next(true);
    }

    mergeVideoInfo(videos: CourseMembers, history: PlayHistory) {
        const progress = {
            viewed: 0,
            duration: 0
        };
        this.lastPlayedVideoKey = Object.keys(history).sort((a, b) => {
            // @ts-ignore
            return history[b].updatedAt - history[a].updatedAt;
        }).slice(0, 1)[0] ?? null;
        Object.keys(videos).forEach(lectureKey => {
            videos[lectureKey].history = history[videos[lectureKey].id] ?? { currentTime: null, updatedAt: null };
            if (videos[lectureKey].duration) {
                progress.duration -= -videos[lectureKey].duration;
                if (videos[lectureKey].history.currentTime) {
                    progress.viewed -= -videos[lectureKey].history.currentTime;
                }
            }
        });
        this.courseProgress = progress;
        return Object.values(videos);
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
        this.sessionUid = ulid();
    }

    async setPlaybackSpeed() {
        const alert = await this.alertController.create({
            header: 'Please enter speed!',
            inputs: [
                {
                    name: 'speed',
                    type: 'number',
                    min: 0.5,
                    max: 8,
                    value: this.videoPlayer.playbackRate().toFixed(2)
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
        if (this.currentVideo?.sources?.filter(s => s.path.endsWith('.mp4') || s.path.endsWith('.webm')).length > 0) {
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

    protected attachEventLabel(data, isNonInteraction?: boolean) {
        return {
            ...data,
            event_label: this.currentVideo.identifier,
            non_interaction: isNonInteraction === true
        };
    }

    protected updatePlayRecord() {
        this.manService.updatePlayRecord(this.sessionUid, this.currentVideo.id, this.videoPlayer.currentTime(), this.videoPlayer.playbackRate()).subscribe();
    }
}
