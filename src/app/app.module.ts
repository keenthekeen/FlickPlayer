import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {environment} from '../environments/environment';
import {AngularFireModule} from '@angular/fire/compat';
import {AngularFireAuthModule} from '@angular/fire/compat/auth';
import {WelcomePageModule} from './welcome/welcome.module';
import {HttpClientModule} from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import {AngularFireAnalyticsModule, DEBUG_MODE, UserTrackingService} from '@angular/fire/compat/analytics';
import {AngularFirePerformanceModule, INSTRUMENTATION_ENABLED} from '@angular/fire/compat/performance';
import {AngularFireRemoteConfigModule, DEFAULTS} from '@angular/fire/compat/remote-config';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        HttpClientModule,
        AngularFireModule.initializeApp(environment.firebase),
        AngularFireAuthModule,
        AngularFireAnalyticsModule,
        AngularFirePerformanceModule,
        AngularFireRemoteConfigModule,
        WelcomePageModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        UserTrackingService,
        { provide: INSTRUMENTATION_ENABLED, useValue: environment.production },
        { provide: DEBUG_MODE, useValue: !environment.production },
        { provide: DEFAULTS, useValue: environment.defaultRemoteConfig }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
