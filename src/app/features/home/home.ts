import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule], // ✅ REQUIRED for routerLink
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {}
