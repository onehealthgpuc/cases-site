const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD3e8G3s9Hwk5Kf6Ay3L58RTjyAkL-xr4I",
  authDomain: "medical-cases-c4809.firebaseapp.com",
  projectId: "medical-cases-c4809",
  storageBucket: "medical-cases-c4809.appspot.com",
  messagingSenderId: "591206005422",
  appId: "1:591206005422:web:7834dc84e5eebd4b4b8b3f"
};

if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

function waitForUser() {
  return new Promise(resolve => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function getAccess() {
  const user = await waitForUser();
  if (!user) return null;

  const profile = await firebase.firestore().collection('users').doc(user.uid).get();
  const data = profile.exists ? profile.data() : {};
  const role = data.role;
  if (role !== 'viewer' && role !== 'admin') return null;
  const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : '';
  return { user, role, nickname };
}

async function requireAccess(requiredRole) {
  const access = await getAccess();
  if (!access) {
    const returnTo = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace(`login.html?returnTo=${returnTo}`);
    return new Promise(() => {});
  }
  if (requiredRole === 'admin' && access.role !== 'admin') {
    location.replace('index.html');
    return new Promise(() => {});
  }
  return access;
}

async function signOut() {
  await firebase.auth().signOut();
  location.replace('login.html');
}
