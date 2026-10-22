import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBz63h9izOZoYUnBKQiIhV5hk3bBwvniv4',
  authDomain: 'bvm-app-e5c1c.firebaseapp.com',
  projectId: 'bvm-app-e5c1c',
  storageBucket: 'bvm-app-e5c1c.firebasestorage.app',
  messagingSenderId: '527428548432',
  appId: '1:527428548432:web:9e52d5887600cbdee29e55',
  measurementId: 'G-9WFFMX97N1',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export type { FirebaseUser };

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const microsoftProvider = new OAuthProvider('microsoft.com');
export const linkedInProvider = new OAuthProvider('linkedin.com');
export const lineProvider = new OAuthProvider('oidc.line');

appleProvider.addScope('email');
appleProvider.addScope('name');

microsoftProvider.addScope('openid');
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');

linkedInProvider.addScope('r_liteprofile');
linkedInProvider.addScope('r_emailaddress');
