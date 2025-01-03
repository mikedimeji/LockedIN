import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/AuthInterceptor'; // Adjust the path as needed

bootstrapApplication(AppComponent, {
  providers: [
    // Add HttpClientModule if not already imported in app.config
    HttpClientModule,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Ensures the interceptor is added to the chain
    },
    ...appConfig.providers // Retain other providers from appConfig
  ]
})
  .catch((err) => console.error(err));

