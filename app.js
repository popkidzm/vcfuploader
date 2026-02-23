import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDocs, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// Comprehensive list with codes
const countryData = {
    "Afghanistan": "+93", "Albania": "+355", "Algeria": "+213", "Angola": "+244", "Argentina": "+54", "Australia": "+61", "Austria": "+43", "Bangladesh": "+880", "Belgium": "+32", "Brazil": "+55", "Cameroon": "+237", "Canada": "+1", "China": "+86", "Egypt": "+20", "Ethiopia": "+251", "France": "+33", "Germany": "+49", "Ghana": "+233", "India": "+91", "Indonesia": "+62", "Iran": "+98", "Iraq": "+964", "Ireland": "+353", "Italy": "+39", "Japan": "+81", "Kenya": "+254", "Kuwait": "+965", "Malaysia": "+60", "Mexico": "+52", "Morocco": "+212", "Netherlands": "+31", "Nigeria": "+234", "Pakistan": "+92", "Philippines": "+63", "Portugal": "+351", "Qatar": "+974", "Russia": "+7", "Saudi Arabia": "+966", "South Africa": "+27", "Spain": "+34", "Tanzania": "+255", "Turkey": "+90", "Uganda": "+256", "UAE": "+971", "United Kingdom": "+44", "United States": "+1", "Vietnam": "+84", "Zambia": "+260", "Zimbabwe": "+263"
};

// --- INDEX PAGE LOGIC ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    const countrySelect = document.getElementById('country');
    countrySelect.innerHTML = '<option value="">Select Country</option>';
    Object.keys(countryData).sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `${c} (${countryData[c]})`;
        countrySelect.appendChild(opt);
    });

    onSnapshot(doc(db, "settings", "goal"), (sDoc) => {
        onSnapshot(collection(db, "contacts"), (snap) => {
            const target = sDoc.exists() ? sDoc.data().target : 100;
            const percent = Math.min((snap.size / target) * 100, 100);
            document.getElementById('progress-bar').style.width = percent + '%';
            document.getElementById('count-text').innerText = `${snap.size} / ${target} Contacts Joined`;
        });
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const countryName = document.getElementById('country').value;
        const rawPhone = document.getElementById('phone').value.trim();
        const dialCode = countryData[countryName];
        
        // Logic: remove leading zero if exists, then attach code
        const cleanPhone = rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone;
        const finalPhone = `${dialCode}${cleanPhone}`;

        btn.disabled = true;
        btn.innerText = "Processing...";
        try {
            await addDoc(collection(db, "contacts"), {
                name: document.getElementById('name').value,
                phone: finalPhone,
                country: countryName,
                createdAt: serverTimestamp()
            });
            alert(`Successfully added to the pool!`);
            contactForm.reset();
        } catch (err) { alert("Error: " + err.message); }
        btn.disabled = false;
        btn.innerText = "Submit Details";
    });
}

// --- ADMIN PAGE LOGIC ---
const adminContent = document.getElementById('admin-content');
if (adminContent) {
    window.login = async () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('pass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err) { alert("Login failed: " + err.message); }
    };

    onAuthStateChanged(auth, (user) => {
        if (user && user.email === "iantaracha@gmail.com") {
            document.getElementById('login-overlay').classList.add('hidden');
            onSnapshot(collection(db, "contacts"), (snap) => {
                const list = document.getElementById('list');
                list.innerHTML = "";
                snap.forEach(d => {
                    const c = d.data();
                    list.innerHTML += `
                        <tr class="border-b border-gray-700">
                            <td class="p-3 font-medium">${c.name}</td>
                            <td class="p-3">${c.phone}</td>
                            <td class="p-3 text-slate-400">${c.country}</td>
                            <td class="p-3 text-center">
                                <button onclick="deleteContact('${d.id}')" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md transition font-bold">Delete</button>
                            </td>
                        </tr>`;
                });
                document.getElementById('total').innerText = snap.size;
            });
        }
    });

    window.deleteContact = async (id) => {
        if (confirm("Permanently delete this contact?")) {
            try {
                await deleteDoc(doc(db, "contacts", id));
            } catch (err) { alert("Delete failed: " + err.message); }
        }
    };

    window.setGoal = async () => {
        const val = parseInt(document.getElementById('targetInput').value);
        if (val > 0) {
            await updateDoc(doc(db, "settings", "goal"), { target: val });
            alert("New target set!");
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
        a.download = "global_contacts.vcf";
        a.click();
    };
}
