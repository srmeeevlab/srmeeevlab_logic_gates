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
  firebase.initializeApp(firebaseConfig);

  const database = firebase.database()
  const ref  = database.ref()

  
form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const alert = document.getElementById("alertblock").value;
    const name = document.getElementById("name").value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const danger = document.getElementById("alertblock1").value;
    // console.log("Form Submitted");
    // console.log(name, email, password);


    ref.push({
        name:name,
        email:email,
        password:password
      });

    
    
    setTimeout (() => {

        alertblock.style.display = "none"
    }, 2000)
    
    ref.once('messages', function(snapshot) {
        if (snapshot.exists()) {
            alertblock.style.display = "block";
        }
        else{
            alertblock1.style.display = "block";
        }
        console.log("running")
    });

    // database.ref('messages').get().then((snapshot) => {
    //     console.log(snapshot);
    //     if (snapshot.exists()) {
    //         alertblock.style.display = "block";
    //     } else {
    //         alertblock1.style.display = "block";
    //     }
    //     console.log("running");
    // }).catch((error) => {
    //     console.error(error);
    // });
      
    form.reset()
});

