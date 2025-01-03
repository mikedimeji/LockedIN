import { Component, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule, HttpHeaders } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";

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
  styleUrls: ['./planner.component.css']
})
export class PlannerComponent implements OnInit {
  topics: Array<{ id: number; title: string; description: string; pomodoroNumber: number }> = [];
  newTopic = { title: '', description: '', pomodoroNumber: 1 };
  currentTopicIndex = 0; // Tracks the current topic being displayed
  showForm = false; // Toggles the display of the form modal

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.getRevisionTopics();
  }

  // Get the JWT token from local storage
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Fetch all revision topics for the logged-in user
  getRevisionTopics(): void {
    const token = this.getAuthToken();

    if (!token) {
      console.log("User is not authenticated.");
      this.router.navigateByUrl('/login'); // Redirect to login if no token is found
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http
      .get<Array<{ id: number; title: string; description: string; pomodoroNumber: number }>>(
        'http://localhost:8080/api/home/revisiontopics',
        { headers }
      )
      .subscribe(
        (response) => {
          this.topics = response; // Update the topics array with the data fetched from the backend
        },
        (error) => {
          console.error('Error fetching revision topics:', error);
          alert('Failed to load revision topics.');
        }
      );
  }

  // Create a new revision topic
  createTopic(): void {
    console.log("Creating topic");
    const token = this.getAuthToken();

    if (!token) {
      alert('User is not authenticated. Please log in.');
      this.router.navigateByUrl('/login'); // Redirect to login if no token is found
      return;
    }

    if (!this.newTopic.title || !this.newTopic.description || this.newTopic.pomodoroNumber < 1) {
      console.log("Error");
      alert('Please fill in all fields with valid values.');
      return;
    }

    const bodyData = {
      title: this.newTopic.title,
      description: this.newTopic.description,
      pomodoroNumber: this.newTopic.pomodoroNumber,
    };

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .post<{ id: number; title: string; description: string; pomodoroNumber: number }>(
        'http://localhost:8080/api/home/revisiontopics',
        bodyData,
        { headers }
      )
      .subscribe(
        (createdTopic) => {
          this.topics.push(createdTopic); // Add the newly created topic to the list
          this.newTopic = { title: '', description: '', pomodoroNumber: 1 }; // Reset the form fields
          this.toggleForm(); // Close the modal after creation
          alert('Revision topic created successfully!');
        },
        (error) => {
          console.error('Error creating revision topic:', error);
          alert('Failed to create revision topic.');
        }
      );
  }

  // Navigate to the next topic
  nextTopic(index: number): void {
    if (index < this.topics.length - 1) {
      this.currentTopicIndex = index + 1;
    } else {
      alert("No more topics available.");
    }
  }

  // Navigate to the previous topic
  prevTopic(index: number): void {
    if (index > 0) {
      this.currentTopicIndex = index - 1;
    } else {
      alert("This is the first topic.");
    }
  }

  startTimer(pomodoroNumber: number): void {
    const durationInMinutes = pomodoroNumber * 25; // Calculate total minutes
    console.log(`Starting timer for ${durationInMinutes} minutes.`);
    // Route to the timer component with the duration as a parameter
    this.router.navigate(['/timer'], { queryParams: { duration: durationInMinutes } });
  }

  // Toggle the visibility of the form modal
  toggleForm(): void {
    this.showForm = !this.showForm;
  }
}


