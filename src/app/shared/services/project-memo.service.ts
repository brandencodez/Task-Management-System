import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface ProjectMemo {
  id?: number;
  projectId: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectMemoService {
  private apiUrl = 'http://localhost:5000/api/project-memos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all memos for a specific project
   */
  getMemosByProject(projectId: number): Observable<ProjectMemo[]> {
    return this.http.get<ProjectMemo[]>(`${this.apiUrl}/project/${projectId}`)
      .pipe(
        retry(2),
        catchError(error => {
          console.error('Get project memos error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a single memo by ID
   */
  getMemoById(id: number): Observable<ProjectMemo> {
    return this.http.get<ProjectMemo>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Get memo error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new memo
   */
  createMemo(memo: ProjectMemo): Observable<ProjectMemo> {
    return this.http.post<ProjectMemo>(
      this.apiUrl,
      memo,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Create memo error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing memo
   */
  updateMemo(id: number, memo: ProjectMemo): Observable<ProjectMemo> {
    return this.http.put<ProjectMemo>(
      `${this.apiUrl}/${id}`,
      memo,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Update memo error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a memo
   */
  deleteMemo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Delete memo error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete all memos for a project
   */
  deleteProjectMemos(projectId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/project/${projectId}`)
      .pipe(
        catchError(error => {
          console.error('Delete project memos error:', error);
          return throwError(() => error);
        })
      );
  }
}
