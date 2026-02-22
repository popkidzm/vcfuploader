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

// All Countries List
const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

// --- INDEX PAGE LOGIC ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    // Fill Country Select
    const countrySelect = document.getElementById('country');
    countrySelect.innerHTML = '<option value="">Select Country</option>';
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        countrySelect.appendChild(opt);
    });

    // Real-time Progress
    onSnapshot(doc(db, "settings", "goal"), (sDoc) => {
        onSnapshot(collection(db, "contacts"), (snap) => {
            const target = sDoc.exists() ? sDoc.data().target : 100;
            const percent = Math.min((snap.size / target) * 100, 100);
            document.getElementById('progress-bar').style.width = percent + '%';
            document.getElementById('count-text').innerText = `${snap.size} / ${target} Contacts Joined`;
        });
    });

    // Submit
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerText = "Processing...";
        try {
            await addDoc(collection(db, "contacts"), {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                country: document.getElementById('country').value,
                createdAt: serverTimestamp()
            });
            alert("Successfully added to the pool!");
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
            // Load Table
            onSnapshot(collection(db, "contacts"), (snap) => {
                const list = document.getElementById('list');
                list.innerHTML = "";
                snap.forEach(d => {
                    const c = d.data();
                    list.innerHTML += `<tr class="border-b border-gray-700"><td class="p-3 font-medium">${c.name}</td><td class="p-3">${c.phone}</td><td class="p-3 text-slate-400">${c.country}</td></tr>`;
                });
                document.getElementById('total').innerText = snap.size;
            });
        }
    });

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
