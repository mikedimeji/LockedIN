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
  topics: Array<{ revisionTopicId: number; userId: number; title: string; description: string; pomodoroNumber: number }> = [];
  newTopic = { title: '', description: '', pomodoroNumber: 1 };
  currentTopicIndex = 0; // Tracks the current topic being displayed
  showForm = false; // Toggles the display of the form modal
  isCarousel = false; // Track whether to show carousel view or not
  confirmingDelete = false; // For delete confirmation dialog
  topicToDelete: number | null = null; // ID of topic to delete
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

  topicExists(): boolean {
    return this.topics.length > 0;
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
      .get<Array<{ revisionTopicId: number; userId: number; title: string; description: string; pomodoroNumber: number }>>(
        'https://lockedin-backend.onrender.com/api/home/revisiontopics',
        { headers }
      )
      .subscribe(
        (response) => {
          console.log('Received topics:', response);
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
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
    
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
      .post<{ revisionTopicId: number; userId: number; title: string; description: string; pomodoroNumber: number }>(
        'https://lockedin-backend.onrender.com/api/home/revisiontopics',
        bodyData,
        { headers }
      )
      .subscribe(
        (createdTopic) => {
          this.topics.push(createdTopic);
          this.newTopic = { title: '', description: '', pomodoroNumber: 1 };
          this.toggleForm(); 
          alert('Revision topic created successfully!');
          
          // If this is the first topic, suggest viewing it
          if (this.topics.length === 1) {
            setTimeout(() => {
              this.toggleScreen('down');
            }, 1000);
          }
        },
        (error) => {
          console.error('Error creating revision topic:', error);
          alert('Failed to create revision topic.');
        }
      );
  }

  // Show delete confirmation dialog
  confirmDelete(revisionTopicId: number): void {
    this.topicToDelete = revisionTopicId;
    this.confirmingDelete = true;
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }
  
  // Cancel deletion
  cancelDelete(): void {
    this.confirmingDelete = false;
    this.topicToDelete = null;
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }

  deleteTopic(revisionTopicId: number): void {
    // Close the confirmation dialog
    this.confirmingDelete = false;
    
    console.log('Topics:', this.topics);
    console.log('Current topic index:', this.currentTopicIndex);
    console.log('Current topic:', this.topics[this.currentTopicIndex]);
    console.log('Deleting topic with id:', revisionTopicId);

    if (!revisionTopicId) {
      console.error('Topic ID is undefined');
      this.topicToDelete = null;
      return;
    }

    const token = this.getAuthToken();

    if (!token) {
      alert('User is not authenticated. Please log in.');
      this.router.navigateByUrl('/login');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`https://lockedin-backend.onrender.com/api/home/revisiontopics/${revisionTopicId}`, { headers })
      .subscribe(
        () => {
          this.topics = this.topics.filter(topic => topic.revisionTopicId !== revisionTopicId);
          if (this.currentTopicIndex >= this.topics.length) {
            this.currentTopicIndex = Math.max(0, this.topics.length - 1);
          }
          if(this.topics.length === 0){
            this.toggleScreen('up'); // Go back to create view
          }
          alert('Revision topic deleted successfully!');
          this.topicToDelete = null; // Reset the topic to delete
        },
        (error) => {
          console.error('Error deleting revision topic:', error);
          alert('Failed to delete revision topic.');
          this.topicToDelete = null; // Reset even on error
        }
      );
  }

  nextTopic(): void {
    if (this.currentTopicIndex < this.topics.length - 1) {
      this.currentTopicIndex++;
      if (this.audio) {
        this.audio.play().catch(err => console.error('Error playing audio:', err));
      }
    } else {
      alert("No more topics available.");
    }
  }

  prevTopic(): void {
    if (this.currentTopicIndex > 0) {
      this.currentTopicIndex--;
      if (this.audio) {
        this.audio.play().catch(err => console.error('Error playing audio:', err));
      }
    } else {
      alert("No previous topics.");
    }
  }

  startTimer(pomodoroNumber: number): void {
    const durationInMinutes = pomodoroNumber * 25;
    console.log(`Starting timer for ${durationInMinutes} minutes.`);
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
    this.router.navigate(['/timer'], { queryParams: { duration: durationInMinutes } });
  }

  toggleScreen(direction: string): void {
    if (direction === 'down') {
      if (this.audio) {
        this.audio.play().catch(err => console.error('Error playing audio:', err));
      }
      this.isCarousel = true; // Switch to carousel view
    } else if (direction === 'up') {
      if (this.audio) {
        this.audio.play().catch(err => console.error('Error playing audio:', err));
      }
      this.isCarousel = false; // Switch back to Create Topic view
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }
}



