import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: 'signup',
    loadComponent: () =>
      import('./features/signup/signup.component')
        .then(m => m.SignupComponent)
  },

  {
    path: 'upload',
    loadComponent: () =>
      import('./features/upload/upload.component')
        .then(m => m.UploadComponent)
  },

  {
    path: 'dashboard/:batchId',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];