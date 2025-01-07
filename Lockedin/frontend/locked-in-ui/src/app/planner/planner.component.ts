import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from "@angular/common";
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
  isCarousel = false; // Track whether to show carousel view or not
  private audio: HTMLAudioElement | null = null;

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object,) {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio('/assets/sounds/click.mp3');
      console.log('Audio object initialized:', this.audio);
    }
  }

  ngOnInit(): void {
    this.getRevisionTopics();
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRevisionTopics(): void {
    const token = this.getAuthToken();

    if (!token) {
      console.log("User is not authenticated.");
      this.router.navigateByUrl('/login'); 
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
          this.topics = response;
        },
        (error) => {
          console.error('Error fetching revision topics:', error);
          alert('Failed to load revision topics.');
        }
      );
  }

  createTopic(): void {
    console.log("Creating topic");
    const token = this.getAuthToken();

    if (!token) {
      alert('User is not authenticated. Please log in.');
      this.router.navigateByUrl('/login');
      return;
    }

    if (!this.newTopic.title || !this.newTopic.description || this.newTopic.pomodoroNumber < 1) {
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
          this.topics.push(createdTopic);
          this.newTopic = { title: '', description: '', pomodoroNumber: 1 };
          this.toggleForm(); 
          alert('Revision topic created successfully!');
        },
        (error) => {
          console.error('Error creating revision topic:', error);
          alert('Failed to create revision topic.');
        }
      );
  }

  nextTopic(): void {
    if (this.currentTopicIndex < this.topics.length - 1) {
      this.currentTopicIndex++;
      if (this.audio) {
        this.audio.play();
      }
    } else {
      alert("No more topics available.");
    }
  }

  prevTopic(): void {
    if (this.currentTopicIndex > 0) {
      this.currentTopicIndex--;
      if (this.audio) {
        this.audio.play();
      }
    } else {
      alert("No previous topics.");
    }
  }

  startTimer(pomodoroNumber: number): void {
    const durationInMinutes = pomodoroNumber * 25;
    console.log(`Starting timer for ${durationInMinutes} minutes.`);
    this.router.navigate(['/timer'], { queryParams: { duration: durationInMinutes } });
  }

  // Handle toggle between carousel and create topic view
  toggleScreen(direction: string): void {
    if (direction === 'down') {
      if (this.audio) {
        this.audio.play();
      }
      this.isCarousel = true; // Switch to carousel view
    } else if (direction === 'up') {
      if (this.audio) {
        this.audio.play();
      }
      this.isCarousel = false; // Switch back to Create Topic view
    }
  }
  

  toggleForm(): void {
    this.showForm = !this.showForm;
  }
}



