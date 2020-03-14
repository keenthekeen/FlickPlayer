import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ManEndpoint} from '../environments/environment';
import {Observable, of} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {map, tap} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class ManService {
    private videoList: object;
    private idToken: string;

    constructor(private http: HttpClient, private afAuth: AngularFireAuth) {
        // Get authentication data
        this.afAuth.idToken.subscribe(token => {
            this.setIdToken(token);
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
        return this.videoList ? of(this.videoList) : this.get<object>('v1/video').pipe(tap(a => {
            this.videoList = a;
        }));
    }

    getVideosInCourse(year: string, course: string) {
        return this.get<CourseMembers>('v1/video/' + year + '/' + course);
    }

    checkAuthorization(): Observable<boolean> {
        return this.get<string>('v1/auth_check').pipe(map(a => a === 'OK'));
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
        }
        return this.http.get<T>(ManEndpoint + path, this.httpOptions);
    }

    /*patch(path: string, body): Observable<Object> {
        if (this.httpOptions.headers.get('Authorization').length < 5) {
            console.error('ManService ID token is not set.');
        }
        return this.http.patch(ManEndpoint + path, body, this.httpOptions);
    }*/

    videoJsAuthOptions() {
        if (this.idToken.length < 5) {
            console.error('ManService ID token is not set.');
        }
        return (options) => {
            options.headers = {
                Authorization: 'Bearer ' + this.idToken
            };
            return options;
        };
    }
}

export interface CourseMembers {
    [key: string]: {
        title: string,
        lecturer: string,
        date: string
    };
}
