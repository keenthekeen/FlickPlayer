import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HomePage } from './home.page';
import {AngularFireAuth} from '@angular/fire/auth';
import {FireAuthStub} from '../stubs';
import {ManService, ManServiceStub} from '../man.service';
import {RouterTestingModule} from '@angular/router/testing';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomePage ],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        {provide: AngularFireAuth, useValue: FireAuthStub},
        {provide: ManService, useValue: ManServiceStub}
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
