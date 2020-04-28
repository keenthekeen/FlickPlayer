import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListPage } from './list.page';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRoute} from '@angular/router';
import {ActivatedRouteStub} from '../../stubs';
import {ManService, ManServiceStub} from '../../man.service';

describe('ListPage', () => {
  let component: ListPage;
  let fixture: ComponentFixture<ListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListPage ],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        {provide: ActivatedRoute, useValue: ActivatedRouteStub},
        {provide: ManService, useValue: ManServiceStub}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
