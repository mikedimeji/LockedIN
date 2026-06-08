import { Routes } from '@angular/router';
import { TimerComponent } from './timer/timer.component';
import { AboutComponent } from './about/about.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { ThemesComponent } from "./themes/themes.component";
import { PlannerComponent } from './planner/planner.component';
import { StatsComponent } from './stats/stats.component';
import { AmbienceComponent } from './ambience/ambience.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { AuthGuard } from './auth.guard';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const routes: Routes = [
  { path: 'timer',          component: TimerComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'about',    component: AboutComponent },
  { path: 'themes',   component: ThemesComponent,   canActivate: [AuthGuard] },
  { path: 'login',    component: UserLoginComponent },
  { path: 'register', component: UserRegisterComponent },
  { path: 'ambience', component: AmbienceComponent },
  { path: 'planner',  component: PlannerComponent,  canActivate: [AuthGuard] },
  { path: 'stats',    component: StatsComponent,    canActivate: [AuthGuard] },
  { path: 'schedule', component: ScheduleComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/timer', pathMatch: 'full' },
  { path: '**', redirectTo: '/timer' }
];

