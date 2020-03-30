import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {filter, map, tap} from 'rxjs/operators';
import {AngularFireRemoteConfig} from '@angular/fire/remote-config';


@Injectable({
    providedIn: 'root'
})
export class ManService {
    private videoList: object;
    private idToken: string;
    private endpoint: string;

    constructor(private http: HttpClient, private afAuth: AngularFireAuth, remoteConfig: AngularFireRemoteConfig) {
        // Get authentication data
        this.afAuth.idToken.subscribe(token => {
            this.setIdToken(token);
        });
        // Get endpoint config
        remoteConfig.strings.manEndpoint.pipe(filter(v => !!v)).subscribe(v => {
            this.endpoint = v;
        });
    }

    private httpOptions = {
        headers: new HttpHeaders({
            Authorization: ''
        })
    };

    setIdToken(idToken: string) {
        this.idToken = idToken;
        this.httpOptions.headers =
            this.httpOptions.headers.set('Authorization', 'Bearer ' + idToken);
    }

    getVideoList(): Observable<object> {
        return this.videoList ? of(this.videoList) : this.get<JSend<{ years: object }>>('v1/video').pipe(map(response => {
            return response.data.years;
        }), tap(a => {
            this.videoList = a;
        }));
    }

    getVideosInCourse(year: string, course: string) {
        return this.get<JSend<{
            lectures: CourseMembers,
            key: string,
            endpoint?: string
        }>>('v1/video/' + year + '/' + course).pipe(map(response => {
            let endpoint = response.data.endpoint ?? this.endpoint;
            if (!endpoint.endsWith('/')) {
                endpoint += '/';
            }
            for (const courseKey of Object.keys(response.data.lectures)) {
                response.data.lectures[courseKey] = {
                    ...response.data.lectures[courseKey],
                    url: response.data.lectures[courseKey].url
                        ?? (endpoint + 'videos/' + year + '/' + course + '/' + courseKey + '/master.m3u8?key='
                            + encodeURIComponent(response.data.key)),
                    identifier: response.data.lectures[courseKey].identifier
                        ?? (year.substr(0, 3).trim() + '/' + course.substr(0, 7).trim() + '/' + courseKey)
                };
            }
            return response.data.lectures;
        }));
    }

    checkAuthorization(): Observable<boolean> {
        return this.get<object>('v1/auth_check').pipe(map(a => a.hasOwnProperty('success')));
    }

    /*updateCurrentStudent(requestBody) {
        if (!this.email) {
            console.error('ManService user email is not set.');
        }
        return this.patch('students/' + this.email, requestBody);
    }*/

    get<T>(path: string): Observable<T> {
        if (this.httpOptions.headers.get('Authorization').length < 5) {
            console.error('ManService ID token is not set.');
        } else if (!this.endpoint) {
            console.error('ManService endpoint is not set.');
        }
        return this.http.get<T>(this.endpoint + path, this.httpOptions);
    }

    /*patch(path: string, body): Observable<Object> {
        if (this.httpOptions.headers.get('Authorization').length < 5) {
            console.error('ManService ID token is not set.');
        }
        return this.http.patch(ManEndpoint + path, body, this.httpOptions);
    }*/
}

export interface CourseMembers {
    [key: string]: Lecture;
}

export interface Lecture {
    title: string;
    lecturer: string;
    date: string;
    url?: string;
    identifier?: string;
}

export interface JSend<A> {
    status: string;
    message?: string;
    data?: A;
}
