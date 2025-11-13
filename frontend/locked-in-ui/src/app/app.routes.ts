import { Routes } from '@angular/router';
import { TimerComponent } from './timer/timer.component';
import { AboutComponent } from './about/about.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import {ThemesComponent} from "./themes/themes.component";
import { PlannerComponent } from './planner/planner.component';
import { StatsComponent } from './stats/stats.component';
import { AmbienceComponent } from './ambience/ambience.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'timer', component: TimerComponent }, // Route for Timer
  { path: 'about', component: AboutComponent }, // Route for About
  { path: 'themes', component: ThemesComponent, canActivate: [AuthGuard]  }, 
  { path: 'login', component: UserLoginComponent }, // Route for Login
  { path: 'register', component: UserRegisterComponent }, // Route for Register
  { path: 'ambience', component: AmbienceComponent }, // Route for Ambience
  { path: 'planner', component: PlannerComponent, canActivate: [AuthGuard] }, // Route for planner
  { path: 'stats', component: StatsComponent, canActivate: [AuthGuard] }, // Route for planner
  { path: '', redirectTo: '/timer', pathMatch: 'full' }, // Redirect to Timer as default
  { path: '**', redirectTo: '/timer' } // Wildcard route for undefined paths
];

