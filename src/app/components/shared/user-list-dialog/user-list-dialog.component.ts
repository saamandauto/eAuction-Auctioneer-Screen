import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, BehaviorSubject, combineLatest, map, takeUntil } from 'rxjs';
import { ViewerInfo, SortColumn, SortDirection } from '../../../models/interfaces';

// Interface for the combined view state
interface UserListDialogViewState {
  sortedUsers: ViewerInfo[];
  emptyRows: number[];
  userCount: string;
}

@Component({
  selector: 'app-user-list-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list-dialog.component.html',
  styleUrls: ['./user-list-dialog.component.scss']
})
export class UserListDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false; // Removed ': boolean'
  @Input() users: ViewerInfo[] = [];
  @Input() type = ''; // Removed ': string'
  @Input() title = ''; // Removed ': string'
  @Input() description = ''; // Removed ': string'
  @Output() dialogClose = new EventEmitter<void>(); // Renamed from 'close'

  searchTerm = ''; // Removed ': string'
  sortColumn: SortColumn = 'lastActive';
  sortDirection: SortDirection = 'desc';

  // Internal state subjects
  private usersSubject = new BehaviorSubject<ViewerInfo[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  private sortColumnSubject = new BehaviorSubject<SortColumn>('lastActive');
  private sortDirectionSubject = new BehaviorSubject<SortDirection>('desc');

  // Combined view state observable
  viewState$: Observable<UserListDialogViewState>;

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.usersSubject.asObservable(),
      this.searchTermSubject.asObservable(),
      this.sortColumnSubject.asObservable(),
      this.sortDirectionSubject.asObservable()
    ]).pipe(
      map(([users, searchTerm, sortColumn, sortDirection]) => {
        // Filter users
        let filteredUsers: ViewerInfo[];
        if (!searchTerm.trim()) {
          filteredUsers = [...users];
        } else {
          const term = searchTerm.toLowerCase();
          filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(term) ||
            user.dealerId.toLowerCase().includes(term) ||
            user.type.toLowerCase().includes(term)
          );
        }

        // Sort users
        const sortedUsers = filteredUsers.sort((a, b) => {
          const direction = sortDirection === 'asc' ? 1 : -1;
          
          if (sortColumn === 'lastBuy' || sortColumn === 'lastActive') {
            const aDate = this.parseDateString(a[sortColumn]);
            const bDate = this.parseDateString(b[sortColumn]);
            return direction * (aDate.getTime() - bDate.getTime());
          }
          
          const aValue = String(a[sortColumn]);
          const bValue = String(b[sortColumn]);
          return direction * aValue.localeCompare(bValue);
        });

        // Calculate empty rows
        const currentRows = sortedUsers.length;
        const minRows = 10;
        const emptyRows = currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];

        // User count text
        const userCount = `${filteredUsers.length} of ${users.length} ${this.type.toLowerCase()}s`;

        return {
          sortedUsers,
          emptyRows,
          userCount
        };
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    this.updateInternalState();
  }

  ngOnChanges() {
    this.updateInternalState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateInternalState() {
    this.usersSubject.next(this.users);
    this.searchTermSubject.next(this.searchTerm);
    this.sortColumnSubject.next(this.sortColumn);
    this.sortDirectionSubject.next(this.sortDirection);
  }

  filterUsers() {
    this.searchTermSubject.next(this.searchTerm);
  }

  sort(column: SortColumn) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortColumnSubject.next(this.sortColumn);
    this.sortDirectionSubject.next(this.sortDirection);
  }

  private parseDateString(dateStr: string): Date {
    const [datePart, timePart] = dateStr.split(', ');
    const [day, month, year] = datePart.split(' ');
    const [hours, minutes] = timePart.split(':');
    
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    return new Date(
      parseInt(year),
      monthMap[month],
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  }

  onClose() {
    this.dialogClose.emit();
  }
}