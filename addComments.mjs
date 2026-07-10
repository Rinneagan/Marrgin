import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIm6bpU3B6wFYKgQdA1L86Pi9l18ObJEU",
  authDomain: "friday-pages-web.firebaseapp.com",
  projectId: "friday-pages-web",
  storageBucket: "friday-pages-web.firebasestorage.app",
  messagingSenderId: "41535378386",
  appId: "1:41535378386:web:04b2a78607dbcb42f9ee0b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyComments = [
  { name: "Julian Barnes", text: "This really spoke to me. The imagery in the second stanza is breathtaking." },
  { name: "Sarah Jenkins", text: "I've returned to this poem three times today. It haunts me in the best way." },
  { name: "Marcus Reed", text: "Absolutely phenomenal rhythm. You can feel the heartbeat in the words." },
  { name: "Elena Rostova", text: "A quiet masterpiece. The afterword gave it even more depth." },
  { name: "David Chen", text: "I rarely comment on poetry, but the raw vulnerability here is astounding." },
  { name: "Aria Montgomery", text: "So beautiful. The way you capture grief and turn it into something to marvel at." },
  { name: "Leo Vance", text: "I wish I could frame this and put it on my wall." },
  { name: "Nina Patel", text: "The use of silence between the lines is just as powerful as the words themselves." },
  { name: "Samuel O'Connor", text: "Stunning. I shared this with my wife and we both loved it." },
  { name: "Isabella Cruz", text: "It’s as if you reached into my soul and pulled out the exact words I couldn't find." },
  { name: "Thomas Wright", text: "Masterful control of pace and tone. Bravo." },
  { name: "Chloe Bennett", text: "The ending absolutely destroyed me. Thank you for sharing." },
];

async function run() {
  console.log("Fetching 'The Color of God'...");
  const poemsRef = collection(db, "poems");
  const snapshot = await getDocs(poemsRef);
  
  if (snapshot.empty) {
    console.log("No poems found!");
    return;
  }
  
  // Find "THE COLOR OF GOD" (case insensitive match on title)
  const targetPoem = snapshot.docs.find(doc => {
    const title = doc.data().title || "";
    return title.toLowerCase().includes("color of god");
  });

  if (!targetPoem) {
    console.error("Could not find 'The Color of God' in the database!");
    return;
  }
  
  const poemId = targetPoem.id;
  console.log(`Found poem: ${targetPoem.data().title} (${poemId})`);
  
  const commentsRef = collection(db, "poems", poemId, "comments");
  
  console.log("Adding comments...");
  for (const c of dummyComments) {
    await addDoc(commentsRef, {
      authorId: "dummy-" + Math.random().toString(36).substr(2, 9),
      authorName: c.name,
      content: c.text,
      createdAt: serverTimestamp(),
      lineIndex: null,
      parentId: null,
      isPinned: false
    });
    console.log(`Added comment from ${c.name}`);
    await new Promise(r => setTimeout(r, 200));
  }
  console.log("Done adding comments!");
  process.exit(0);
}

run().catch(console.error);
