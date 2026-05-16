import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { HttpClient, HttpClientModule, HttpHeaders } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { environment } from '../../environments/environment';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';
import { PremiumModalService } from '../premium.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TutorialModalComponent
  ],
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.css']
})
export class PlannerComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/home/revisiontopics`;
  
  // Tutorial
  showTutorial: boolean = false;
  tutorialSteps: TutorialStep[] = [];
  
  topics: Array<{ revisionTopicId: number; userId: number; title: string; description: string; pomodoroNumber: number }> = [];
  newTopic = { title: '', description: '', pomodoroNumber: 1 };
  currentTopicIndex = 0;
  showForm = false;
  isCarousel = false;
  confirmingDelete = false;
  topicToDelete: number | null = null;
  statusMsg = '';
  statusType: 'success' | 'error' = 'success';
  private audio: HTMLAudioElement | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private tutorialService: TutorialService,
    private premiumModal: PremiumModalService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio('/assets/sounds/click.mp3');
      console.log('Audio object initialized:', this.audio);
    }
  }

  ngOnInit(): void {
    // Check if tutorial should show
    if (!this.tutorialService.hasSeenTutorial('planner')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('planner');
      this.showTutorial = true;
    }

    this.getRevisionTopics();
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) {
      this.tutorialService.markTutorialAsSeen('planner');
    }
    this.showTutorial = false;
  }

  onTutorialSkip(): void {
    this.showTutorial = false;
  }

  private showStatus(msg: string, type: 'success' | 'error' = 'success'): void {
    this.statusMsg = msg;
    this.statusType = type;
    setTimeout(() => { this.statusMsg = ''; }, 3500);
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
        this.apiUrl,
        { headers }
      )
      .subscribe(
        (response) => {
          console.log('Received topics:', response);
          this.topics = response;
        },
        (error) => {
          console.error('Error fetching revision topics:', error);
          this.showStatus('Failed to load topics.', 'error');
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
      this.showStatus('Please log in to continue.', 'error');
      this.router.navigateByUrl('/login');
      return;
    }

    if (!this.newTopic.title || !this.newTopic.description || this.newTopic.pomodoroNumber < 1) {
      this.showStatus('Please fill in all fields with valid values.', 'error');
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
        this.apiUrl,
        bodyData,
        { headers }
      )
      .subscribe(
        (createdTopic) => {
          this.topics.push(createdTopic);
          this.newTopic = { title: '', description: '', pomodoroNumber: 1 };
          this.toggleForm();
          this.showStatus('Topic created successfully!');

          if (this.topics.length === 1) {
            setTimeout(() => {
              this.toggleScreen('down');
            }, 1000);
          }
        },
        (error) => {
          if (error.status === 402) {
            this.premiumModal.open();
          } else {
            console.error('Error creating revision topic:', error);
            this.showStatus('Failed to create topic.', 'error');
          }
        }
      );
  }

  confirmDelete(revisionTopicId: number): void {
    this.topicToDelete = revisionTopicId;
    this.confirmingDelete = true;
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }
  
  cancelDelete(): void {
    this.confirmingDelete = false;
    this.topicToDelete = null;
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }

  deleteTopic(revisionTopicId: number): void {
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
      this.showStatus('Please log in to continue.', 'error');
      this.router.navigateByUrl('/login');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`${this.apiUrl}/${revisionTopicId}`, { headers })
      .subscribe(
        () => {
          this.topics = this.topics.filter(topic => topic.revisionTopicId !== revisionTopicId);
          if (this.currentTopicIndex >= this.topics.length) {
            this.currentTopicIndex = Math.max(0, this.topics.length - 1);
          }
          if (this.topics.length === 0) {
            this.toggleScreen('up');
          }
          this.showStatus('Topic deleted.');
          this.topicToDelete = null;
        },
        (error) => {
          console.error('Error deleting revision topic:', error);
          this.showStatus('Failed to delete topic.', 'error');
          this.topicToDelete = null;
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
      this.isCarousel = true;
    } else if (direction === 'up') {
      if (this.audio) {
        this.audio.play().catch(err => console.error('Error playing audio:', err));
      }
      this.isCarousel = false;
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }
}



