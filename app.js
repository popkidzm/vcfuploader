import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDCMrnwLv5VdLYnaAVQ8QQKo00ucCOvwE",
    authDomain: "global-contact-pool.firebaseapp.com",
    projectId: "global-contact-pool",
    storageBucket: "global-contact-pool.firebasestorage.app",
    messagingSenderId: "820659549943",
    appId: "1:820659549943:web:b681882bbfdcd595c685f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- LOGIC FOR INDEX.HTML (Public Form) ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    // Sync Progress Bar
    onSnapshot(doc(db, "settings", "goal"), (settingsDoc) => {
        onSnapshot(collection(db, "contacts"), (snap) => {
            const target = settingsDoc.exists() ? settingsDoc.data().target : 100;
            const current = snap.size;
            const percent = Math.min((current / target) * 100, 100);
            document.getElementById('progress-bar').style.width = percent + '%';
            document.getElementById('count-text').innerText = `${current} / ${target} Contacts Joined`;
        });
    });

    // Handle Form Submit
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "contacts"), {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                country: document.getElementById('country').value,
                createdAt: serverTimestamp()
            });
            alert("Contact saved successfully!");
            contactForm.reset();
        } catch (err) {
            alert("Error saving: " + err.message);
        }
    });
}

// --- LOGIC FOR ADMIN.HTML (Private Dashboard) ---
const adminSection = document.getElementById('admin-content');
if (adminSection) {
    // Login Function
    window.login = async () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('pass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err) {
            alert("Access Denied: " + err.message);
        }
    };

    // Auth Watcher
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === "iantaracha@gmail.com") {
            document.getElementById('login-overlay').classList.add('hidden');
            loadAdminData();
        }
    });

    function loadAdminData() {
        onSnapshot(collection(db, "contacts"), (snap) => {
            const list = document.getElementById('list');
            list.innerHTML = "";
            snap.forEach(d => {
                const c = d.data();
                list.innerHTML += `<tr class="border-b border-gray-700"><td class="p-3">${c.name}</td><td class="p-3">${c.phone}</td><td class="p-3">${c.country}</td></tr>`;
            });
            document.getElementById('total').innerText = snap.size;
        });
    }

    window.setGoal = async () => {
        const val = parseInt(document.getElementById('targetInput').value);
        if (val > 0) {
            await updateDoc(doc(db, "settings", "goal"), { target: val });
            alert("Goal updated!");
        }
    };

    window.exportVCF = async () => {
        const snap = await getDocs(collection(db, "contacts"));
        let vcf = "";
        snap.forEach(d => {
            const data = d.data();
            vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nTEL;TYPE=CELL:${data.phone}\nEND:VCARD\n`;
        });
        const blob = new Blob([vcf], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts.vcf";
        a.click();
    };
}
