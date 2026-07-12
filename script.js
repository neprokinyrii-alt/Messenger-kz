import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzn6HAJd8n-I8D4f6rcnPLGIxr0rN5pIk",
  authDomain: "messenger-kz.firebaseapp.com",
  projectId: "messenger-kz",
  storageBucket: "messenger-kz.firebasestorage.app",
  messagingSenderId: "611334363214",
  appId: "1:611334363214:web:71e1d5e21951252e72cb1f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const anonymousBtn = document.getElementById("anonymous-btn");

const logoutBtn = document.getElementById("logout-btn");

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages-container");
const userPhoneSpan = document.getElementById("user-phone");

let currentUser = null;
let unsubscribeFirestore = null;

registerBtn?.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    alert(e.message);
  }
});

loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    alert(e.message);
  }
});

anonymousBtn?.addEventListener("click", async () => {
  try {
    await signInAnonymously(auth);
  } catch (e) {
    alert(e.message);
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;

    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    userPhoneSpan.textContent =
      user.email || "Анонимный пользователь";

    startListeningMessages();
  } else {
    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");

    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  }
});

messageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();

  if (!text || !currentUser) return;

  await addDoc(collection(db, "messages"), {
    text,
    sender: currentUser.email || "Anonymous",
    timestamp: serverTimestamp()
  });

  messageInput.value = "";
});

function startListeningMessages() {
  const q = query(
    collection(db, "messages"),
    orderBy("timestamp", "asc")
  );

  unsubscribeFirestore = onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const div = document.createElement("div");
      div.className = "message";

      if (
        data.sender === currentUser.email ||
        (currentUser.isAnonymous &&
          data.sender === "Anonymous")
      ) {
        div.classList.add("sent");
      } else {
        div.classList.add("received");
      }

      div.innerHTML = `
        <div class="message-sender">${data.sender}</div>
        <div>${data.text}</div>
      `;

      messagesContainer.appendChild(div);
    });

    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;
  });
}