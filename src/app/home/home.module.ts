import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { HomePage } from './home.page';
import {ListPage} from './list/list.page';
import {HomeRoutingModule} from './home-routing.module';
import {CoursePage} from './course/course.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomeRoutingModule
  ],
  declarations: [HomePage, ListPage, CoursePage]
})
export class HomePageModule {}
