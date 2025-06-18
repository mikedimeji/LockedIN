import { Routes, RouterModule } from '@angular/router';
import { TimerComponent } from './timer/timer.component';
import { AboutComponent } from './about/about.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {ThemesComponent} from "./themes/themes.component";
import { PlannerComponent } from './planner/planner.component';
import { AmbienceComponent } from './ambience/ambience.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/timer', pathMatch: 'full' }, // Default route
  { path: 'timer', component: TimerComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: UserLoginComponent },
  { path: 'register', component: UserRegisterComponent },
  { path: 'themes', component: ThemesComponent },
  { path: 'ambience', component: AmbienceComponent },
  { path: 'planner', component: PlannerComponent, canActivate: [AuthGuard] },
];

export const appRoutingProviders = [
  provideRouter(routes, withComponentInputBinding())
];


