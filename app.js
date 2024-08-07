import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, addDoc , getDocs} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var form  = document.getElementById("Form");


const firebaseConfig = {
  apiKey: "AIzaSyAX9jbwBsppZaBAPtaq2mLrdJRPJ3Id9jM",
  authDomain: "vlab-logicgates.firebaseapp.com",
  databaseURL: "https://vlab-logicgates-default-rtdb.firebaseio.com",
  projectId: "vlab-logicgates",
  storageBucket: "vlab-logicgates.appspot.com",
  messagingSenderId: "458308303869",
  appId: "1:458308303869:web:0b337f2fc66587cc643794",
  measurementId: "G-SWCVN2WRW7"
};
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  const db = getFirestore(app);

  const colRef = collection(db, 'users');
  let emails = [];
  getDocs(colRef).then((snapshot)=>{
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

        var entered_email="";
        var emailInput = document.getElementById("email");

        function validateEmail(entered_email) {
          // Validate and check if entered_email is in the emails list
          if (emails.includes(entered_email)) {
            alertblock2.style.display = "block";
            setTimeout(() => {
              alertblock2.style.display = "none";
              $("#exampleModalLong").modal('hide');
              $('.modal-backdrop').remove();
            }, 2000);
          }
        }


         
        emailInput.addEventListener("input", function(event) {
          entered_email = emailInput.value;
          console.log(entered_email);
          validateEmail(entered_email);
        });

        document.getElementById("email").addEventListener("keydown", function(event){
          var key = event.key;
           //alert("You pressed: " + key);
           
           if (key === 'Backspace') {
            entered_email = entered_email.slice(0, -1);
            } // Ensure it's a single character key
            entered_email += key;
            
          //  entered_email += key;
           console.log(entered_email);
           console.log(emails.includes(entered_email));
           if(emails.includes(entered_email)){
            alertblock2.style.display = "block";
            setTimeout(() => {
              alertblock2.style.display = "none";
              
              $("#exampleModalLong").modal('hide');
              $('.modal-backdrop').remove();
              // exampleModalLong.style.display = "none";
              // document.getElementsByTagName("html").blur ();
              // exampleModalLong.setAttribute("data-backdrop", "true");
              console.log (exampleModalLong.getAttribute("data-backdrop"));
            }, 2000);
           }
         });
        

form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const formData = new FormData(form);
    formData.get('')
    const data = Object.fromEntries(formData);
    console.log(data)
    // console.log(name, email, password);
                                                
    try {
        const colRef = collection(db, 'users');

        
    
       await addDoc(collection(db, "users"), data);
        alertblock.style.display = "block";
        setTimeout(() => {
          alertblock.style.display = "none";
          
          $("#exampleModalLong").modal('hide');
          $('.modal-backdrop').remove();
          // exampleModalLong.style.display = "none";
          // document.getElementsByTagName("html").blur ();
          // exampleModalLong.setAttribute("data-backdrop", "true");
          console.log (exampleModalLong.getAttribute("data-backdrop"));
        }, 2000);

        // exampleModalLong.style.display = "none";
        // alertblock.style.display = "block";
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

