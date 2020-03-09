import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {EMPTY, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {ManService} from '../../man.service';

@Component({
    selector: 'app-list',
    templateUrl: './list.page.html',
    styleUrls: ['./list.page.scss']
})
export class ListPage implements OnInit {
    year: string;
    list$: Observable<string[]>;

    constructor(private route: ActivatedRoute, private router: Router, private manService: ManService) {
    }

    ngOnInit() {
        this.list$ = this.route.paramMap.pipe(
            switchMap(s => {
                const year = s.get('year');
                this.year = year;
                if (!year) {
                    this.router.navigate(['home']);
                    return EMPTY;
                }
                return this.manService.getVideoList().pipe(map(list => {
                    return list[year];
                }));
            })
        );
    }

}
