import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CoursePage } from './course.page';

describe('CoursePage', () => {
  let component: CoursePage;
  let fixture: ComponentFixture<CoursePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoursePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CoursePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
