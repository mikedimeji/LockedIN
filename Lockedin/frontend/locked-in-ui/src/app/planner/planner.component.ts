import { Component } from '@angular/core';
import {CommonModule} from "@angular/common";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css'
})
export class PlannerComponent {
  JWT: string = "";
  title: string = "";
  description: string = "";
  errorMessage: string = 'Re-Fill Form';
  successMessage: string = 'Successfully Added Subject';

  constructor(private http: HttpClient, private router: Router) { }

  createTopic(){
    const bodyData = {
      JWT: this.JWT,
      title: this.title,
      description: this.description,
    };
  }

}
