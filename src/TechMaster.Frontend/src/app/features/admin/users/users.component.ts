import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, User } from '@core/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div class="header-left">
          <h1>User Management</h1>
          <p class="subtitle">Manage all registered users</p>
        </div>
        <button class="add-user-btn" (click)="showAddModal = true">
          <span>+</span>
          Add User
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="filterUsers()"
            placeholder="Search users..."
          >
        </div>

        <div class="filter-tabs">
          <button 
            [class.active]="activeFilter === 'all'" 
            (click)="setFilter('all')"
          >
            All
            <span class="badge">{{ users().length }}</span>
          </button>
          <button 
            [class.active]="activeFilter === 'Admin'" 
            (click)="setFilter('Admin')"
          >
            Admins
          </button>
          <button 
            [class.active]="activeFilter === 'Instructor'" 
            (click)="setFilter('Instructor')"
          >
            Instructors
          </button>
          <button 
            [class.active]="activeFilter === 'Student'" 
            (click)="setFilter('Student')"
          >
            Students
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <input type="checkbox" [(ngModel)]="selectAll" (ngModelChange)="toggleSelectAll()">
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of filteredUsers(); track user.id) {
              <tr>
                <td>
                  <input type="checkbox" [(ngModel)]="user.selected">
                </td>
                <td>
                  <div class="user-cell">

                    <div class="user-info">
                      <span class="user-name">{{ user.fullName }}</span>
                      <span class="user-email">{{ user.email }}</span>

                    </div>
                  </div>
                </td>
                <td>
                  <span class="role-badge" [class]="user.role.toLowerCase()">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class]="user.isActive ? 'active' : 'suspended'">
                    {{ user.isActive ? 'Active' : 'Suspended' }}
                  </span>
                </td>
                <td>{{ user.createdAt | date:'mediumDate' }}</td>
                <td>{{ user.lastLoginAt | date:'short' }}</td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn" title="Edit" (click)="editUser(user)">✏️</button>
                    @if (user.isActive) {
                      <button class="action-btn warning" title="Suspend" (click)="suspendUser(user)">⏸️</button>
                    } @else {
                      <button class="action-btn success" title="Activate" (click)="activateUser(user)">▶️</button>
                    }
                    <button class="action-btn danger" title="Delete" (click)="deleteUser(user)">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty-state">
                  <span>👥</span>
                  <p>No users found</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalUsers) }} 
          of {{ totalUsers }}
        </span>
        <div class="page-controls">
          <button [disabled]="currentPage === 1" (click)="previousPage()">←</button>
          @for (page of getPages(); track page) {
            <button [class.active]="page === currentPage" (click)="goToPage(page)">{{ page }}</button>
          }
          <button [disabled]="currentPage === totalPages" (click)="nextPage()">→</button>
        </div>
      </div>

      <!-- Bulk Actions -->
      @if (hasSelected()) {
        <div class="bulk-actions">
          <span>{{ selectedCount() }} selected</span>
          <button class="bulk-btn" (click)="bulkActivate()">Activate</button>
          <button class="bulk-btn" (click)="bulkSuspend()">Suspend</button>
          <button class="bulk-btn danger" (click)="bulkDelete()">Delete</button>
        </div>
      }
    </div>

    <!-- Add/Edit User Modal -->
    @if (showAddModal || showEditModal) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ showEditModal ? 'Edit User' : 'Add User' }}</h2>
            <button class="close-btn" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            @if (!showEditModal) {
              <div class="form-row">
                <div class="form-group">
                  <label>First Name *</label>
                  <input type="text" [(ngModel)]="modalUser.firstName" placeholder="Enter first name">
                </div>
                <div class="form-group">
                  <label>Last Name *</label>
                  <input type="text" [(ngModel)]="modalUser.lastName" placeholder="Enter last name">
                </div>
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input type="email" [(ngModel)]="modalUser.email" placeholder="Enter email address">
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input type="password" [(ngModel)]="modalUser.password" placeholder="Enter password">
              </div>
            }
            <div class="form-group">
              <label>Role</label>
              <select [(ngModel)]="modalUser.role">
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeModals()">Cancel</button>
            <button class="submit-btn" (click)="saveUser()" [disabled]="!showEditModal && (!modalUser.firstName || !modalUser.email || !modalUser.password)">Save</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .users-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: #666;
    }

    .add-user-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .add-user-btn:hover {
      background: #1a5570;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      flex: 1;
      min-width: 250px;
      max-width: 350px;
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.25rem;
      border-radius: 8px;
    }

    .filter-tabs button {
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-tabs button.active {
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .filter-tabs .badge {
      background: #247090;
      color: #fff;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      font-size: 0.75rem;
    }

    .status-filter select {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #fff;
    }

    .table-container {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      font-weight: 600;
      font-size: 0.85rem;
      color: #666;
    }

    td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #247090;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      overflow: hidden;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
    }

    .user-email {
      font-size: 0.85rem;
      color: #666;
    }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .role-badge.admin {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .role-badge.instructor {
      background: #e3f2fd;
      color: #1976d2;
    }

    .role-badge.student {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.suspended {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .actions-cell {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .action-btn.danger:hover {
      background: #fee2e2;
    }

    .action-btn.warning:hover {
      background: #fef3c7;
    }

    .action-btn.success:hover {
      background: #d1fae5;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #666;
    }

    .empty-state span {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
    }

    .page-info {
      color: #666;
    }

    .page-controls {
      display: flex;
      gap: 0.25rem;
    }

    .page-controls button {
      width: 36px;
      height: 36px;
      border: 1px solid #e0e0e0;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .page-controls button.active {
      background: #247090;
      color: #fff;
      border-color: #247090;
    }

    .page-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .bulk-actions {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: #000;
      color: #fff;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .bulk-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
    }

    .bulk-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .bulk-btn.danger {
      background: #dc3545;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f0f0f0;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #247090;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .users-page {
        padding: 1rem;
      }

      .filters-bar {
        flex-direction: column;
      }

      .search-box {
        max-width: none;
      }

      .table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  private translate = inject(TranslateService);
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  users = signal<(User & { selected?: boolean })[]>([]);
  filteredUsers = signal<(User & { selected?: boolean })[]>([]);
  isLoading = signal(false);
  
  searchQuery = '';
  activeFilter = 'all';
  statusFilter = 'all';
  selectAll = false;
  
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 1;
  
  showAddModal = false;
  showEditModal = false;
  modalUser: any = { firstName: '', lastName: '', email: '', role: 'Student', password: '' };

  Math = Math;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    const params: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.activeFilter !== 'all') {
      params.role = this.activeFilter;
    }

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    this.userService.getUsers(params).subscribe({
      next: (result) => {
        const usersWithSelection = result.items.map(u => ({
          ...u,
          selected: false
        }));
        this.users.set(usersWithSelection);
        this.filteredUsers.set(usersWithSelection);
        this.totalUsers = result.totalCount;
        this.totalPages = result.totalPages || Math.ceil(result.totalCount / this.pageSize);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load users');
        this.isLoading.set(false);
      }
    });
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadUsers();
  }

  filterUsers() {
    this.currentPage = 1;
    this.loadUsers();
  }

  toggleSelectAll() {
    const users = this.filteredUsers();
    users.forEach(u => u.selected = this.selectAll);
    this.filteredUsers.set([...users]);
  }

  hasSelected(): boolean {
    return this.filteredUsers().some(u => u.selected);
  }

  selectedCount(): number {
    return this.filteredUsers().filter(u => u.selected).length;
  }

  viewUser(user: User & { selected?: boolean }) {
    this.modalUser = { ...user };
    this.showEditModal = true;
  }

  editUser(user: User & { selected?: boolean }) {
    this.modalUser = { ...user };
    this.showEditModal = true;
  }

  suspendUser(user: User & { selected?: boolean }) {
    this.userService.toggleUserStatus(user.id, false).subscribe({
      next: (success) => {
        if (success) {
          this.toastr.success('User suspended successfully');
          this.loadUsers();
        } else {
          this.toastr.error('Failed to suspend user');
        }
      }
    });
  }

  activateUser(user: User & { selected?: boolean }) {
    this.userService.toggleUserStatus(user.id, true).subscribe({
      next: (success) => {
        if (success) {
          this.toastr.success('User activated successfully');
          this.loadUsers();
        } else {
          this.toastr.error('Failed to activate user');
        }
      }
    });
  }

  deleteUser(user: User & { selected?: boolean }) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(user.id).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('User deleted successfully');
            this.loadUsers();
          } else {
            this.toastr.error('Failed to delete user');
          }
        },
        error: () => {
          this.toastr.error('Failed to delete user');
        }
      });
    }
  }

  bulkActivate() {
    const selectedUsers = this.filteredUsers().filter(u => u.selected);
    selectedUsers.forEach(user => {
      this.userService.toggleUserStatus(user.id, true).subscribe();
    });
    this.toastr.success(`Activated ${selectedUsers.length} users`);
    setTimeout(() => this.loadUsers(), 500);
  }

  bulkSuspend() {
    const selectedUsers = this.filteredUsers().filter(u => u.selected);
    selectedUsers.forEach(user => {
      this.userService.toggleUserStatus(user.id, false).subscribe();
    });
    this.toastr.success(`Suspended ${selectedUsers.length} users`);
    setTimeout(() => this.loadUsers(), 500);
  }

  bulkDelete() {
    const selectedUsers = this.filteredUsers().filter(u => u.selected);
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      let completed = 0;
      selectedUsers.forEach(user => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            completed++;
            if (completed === selectedUsers.length) {
              this.toastr.success(`Deleted ${selectedUsers.length} users`);
              this.loadUsers();
            }
          }
        });
      });
    }
  }

  saveUser() {
    if (this.modalUser.id) {
      this.userService.updateUserRole(this.modalUser.id, this.modalUser.role).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('User updated successfully');
            this.loadUsers();
            this.closeModals();
          } else {
            this.toastr.error('Failed to update user');
          }
        }
      });
    } else {
      // Create new user
      const newUser = {
        email: this.modalUser.email,
        password: this.modalUser.password,
        firstName: this.modalUser.firstName,
        lastName: this.modalUser.lastName || '',
        role: this.modalUser.role as 'Admin' | 'Instructor' | 'Student'
      };
      this.userService.createUser(newUser).subscribe({
        next: (user) => {
          if (user) {
            this.toastr.success('User created successfully');
            this.loadUsers();
            this.closeModals();
          } else {
            this.toastr.error('Failed to create user');
          }
        },
        error: () => {
          this.toastr.error('Failed to create user');
        }
      });
    }
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.modalUser = { firstName: '', lastName: '', email: '', role: 'Student', password: '' };
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }
}
