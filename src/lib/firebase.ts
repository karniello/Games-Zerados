import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

export const firebaseConfig = {
  projectId: 'carbon-fragment-341j7',
  appId: '1:322304598142:web:7fdab296159ed945d8382f',
  apiKey: 'AIzaSyDna4YWPbh3NlaThBT-LxN8bG7zsdpWBfE',
  authDomain: 'carbon-fragment-341j7.firebaseapp.com',
  storageBucket: 'carbon-fragment-341j7.firebasestorage.app',
  messagingSenderId: '322304598142',
  measurementId: '',
  oAuthClientId: '322304598142-q65egsp9q3lgeipr7u29ukhn5p8c083k.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

