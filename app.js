import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, addDoc , getDocs} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var form  = document.getElementById("Form");


const firebaseConfig = {
    apiKey: "AIzaSyD0t1910jJ2zWqJhzH8U0TY2txzp2etqMI",
    authDomain: "srmvlabs.firebaseapp.com",
    projectId: "srmvlabs",
    storageBucket: "srmvlabs.appspot.com",
    messagingSenderId: "421429790651",
    appId: "1:421429790651:web:848fcb49f71245704de69e",
    measurementId: "G-8V3LBR8YD4"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  const db = getFirestore(app);

  
form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const alert = document.getElementById("alertblock");
    const name = document.getElementById("name").value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const danger = document.getElementById("alertblock1");
    console.log("Form Submitted");
    console.log(name, email, password);

    try {
        const colRef = collection(db, 'users');
    
        let emails = [];
    
        getDocs(colRef)
        
        .then((snapshot)=>{
            // console.log(snapshot.docs);
        
            snapshot.docs.forEach((doc)=>{
                // user_data.push({
                //     ... doc.data(), id: doc.id, name: doc.id.name, password: doc.id.password, email: doc.id.email
                // })
                const data = doc.data();
                // names.push(data.name);
                emails.push(data.email);
                // passwords.push(data.password);
            });
            // console.log("Names: ", names);
            console.log("Emails: ", emails);
            // console.log("Passwords: ", passwords);
            // console.log(names[0], emails[0], passwords[0]);
            // console.log(user_data);
        })
        .catch(err =>{
            console.log(err.message);
        });

        await addDoc(collection(db, "users"), {
          name: name,
          email: email,
          password: password
        });
        alertblock.style.display = "block";
        setTimeout(() => {
          alertblock.style.display = "none";
        }, 2000);
      } 
      catch (error) {
        alertblock1.style.display = "block";
        console.error("Error adding document: ", error);
        setTimeout(() => {
          alertblock1.style.display = "none";
        }, 2000);
      }

      form.reset();

    
    
    
});

