import { db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, increment, writeBatch } from "firebase/firestore";

export const createUserProfile = async (uid: string, email: string, username: string) => {
  if (!uid) return;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  // Only create if the profile doesn't exist yet
  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        email,
        displayName: username,
        bio: "I am a poet. Welcome to my thoughts.",
        followersCount: 0,
        followingCount: 0,
        readingStreak: 0,
        lastReadDate: null,
        createdAt: serverTimestamp(),
        penNames: [username],
        currentPenName: username
      });
      
      // Reserve username
      const usernameRef = doc(db, "usernames", username.toLowerCase());
      await setDoc(usernameRef, { uid, createdAt: serverTimestamp() });

      // TRIGGER ADMIN NOTIFICATION
      await createAdminNotification("signup", `New user signed up: ${username} (${email})`);
    } catch (error) {
      console.error("Error creating user profile", error);
    }
  }
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

export const updateAdminBio = async (uid: string, bio: string) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { bio }, { merge: true });
};

export const updatePenNames = async (uid: string, penNames: string[], currentPenName: string) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    penNames,
    currentPenName
  });
};

export const toggleFollowUser = async (followerId: string, targetUserId: string, isFollowing: boolean) => {
  if (followerId === targetUserId) return; // Can't follow self

  const followerFollowingRef = doc(db, "users", followerId, "following", targetUserId);
  const targetFollowerRef = doc(db, "users", targetUserId, "followers", followerId);
  const followerUserRef = doc(db, "users", followerId);
  const targetUserRef = doc(db, "users", targetUserId);

  const batch = writeBatch(db);

  if (isFollowing) {
    batch.delete(followerFollowingRef);
    batch.delete(targetFollowerRef);
    batch.update(followerUserRef, { followingCount: increment(-1) });
    batch.update(targetUserRef, { followersCount: increment(-1) });
  } else {
    batch.set(followerFollowingRef, { followedAt: serverTimestamp() });
    batch.set(targetFollowerRef, { followedAt: serverTimestamp() });
    batch.update(followerUserRef, { followingCount: increment(1) });
    batch.update(targetUserRef, { followersCount: increment(1) });
  }

  await batch.commit();
};

export const checkIsFollowing = async (followerId: string, targetUserId: string) => {
  if (!followerId || !targetUserId) return false;
  const followerFollowingRef = doc(db, "users", followerId, "following", targetUserId);
  const snapshot = await getDoc(followerFollowingRef);
  return snapshot.exists();
};


export interface Collection {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  coverImage: string;
  poemIds: string[];
  followersCount: number;
  isPublic: boolean;
  createdAt: any;
}

export const createCollection = async (authorId: string, authorName: string, title: string, description: string = "", isPublic: boolean = true) => {
  const collectionsRef = collection(db, "collections");
  // Fetch a random aesthetic image from Unsplash Source
  // Using keywords related to poetry, night, moody
  const coverImage = `https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=800&auto=format&fit=crop`; // A fallback, but we can randomize
  // Actually, Unsplash Source API is deprecated, but we can use unsplash source random url:
  const randomImageId = Math.floor(Math.random() * 1000);
  const dynamicCover = `https://source.unsplash.com/random/800x600/?poetry,moody,dark&sig=${randomImageId}`;

  const docRef = await addDoc(collectionsRef, {
    authorId,
    authorName,
    title,
    description,
    coverImage: dynamicCover,
    poemIds: [],
    followersCount: 0,
    isPublic,
    createdAt: serverTimestamp()
  });
  
  return docRef.id;
};

export const addPoemToCollection = async (collectionId: string, poemId: string) => {
  const collectionRef = doc(db, "collections", collectionId);
  const snapshot = await getDoc(collectionRef);
  if (!snapshot.exists()) return;
  const currentPoems = snapshot.data().poemIds || [];
  if (!currentPoems.includes(poemId)) {
    await updateDoc(collectionRef, {
      poemIds: [...currentPoems, poemId]
    });
  }
};

export const getCollectionsForUser = async (uid: string) => {
  const collectionsRef = collection(db, "collections");
  const q = query(collectionsRef, where("authorId", "==", uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
};

export const getCollectionById = async (id: string) => {
  const collectionRef = doc(db, "collections", id);
  const snapshot = await getDoc(collectionRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Collection;
  }
  return null;
};

// Track Poem Read Analytics
export const trackPoemRead = async (poemId: string, readTimeSeconds: number, isCompleted: boolean) => {
  const poemRef = doc(db, "poems", poemId);
  try {
    await updateDoc(poemRef, {
      readsCount: increment(1),
      totalReadTime: increment(readTimeSeconds),
      ...(isCompleted ? { completionsCount: increment(1) } : {})
    });
  } catch (error) {
    console.error("Error tracking poem read:", error);
  }
};

// We get the admin's poems by fetching all poems (since it's a personal blog)
export const getAllPoems = async () => {
  const poemsRef = collection(db, "poems");
  const q = query(poemsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Poem))
    .filter(poem => !poem.isVaulted); // Ensure vaulted poems never show in public profile
};

export const getVaultedPoems = async (passphrase: string) => {
  const poemsRef = collection(db, "poems");
  const q = query(poemsRef, where("isVaulted", "==", true), where("passphrase", "==", passphrase), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poem));
};

// --- Poems ---

export interface Poem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likesCount: number;
  isVaulted?: boolean;
  passphrase?: string;
  aesthetic?: string;
  readsCount?: number;
  totalReadTime?: number; // in seconds
  completionsCount?: number;
  isAnonymous?: boolean;
  weather?: string;
  translationContent?: string;
  isScrapbook?: boolean;
  scrapbookElements?: any[];
  epigraph?: string;
  footnote?: string;
  dedication?: string;
  afterword?: string;
  location?: string;
  coverImage?: string;
}

export const createPoem = async (
  authorId: string, 
  authorName: string, 
  title: string, 
  content: string, 
  isVaulted: boolean = false, 
  passphrase?: string, 
  aesthetic: string = "default",
  isAnonymous: boolean = false,
  weather: string = "none",
  translationContent?: string,
  isScrapbook: boolean = false,
  scrapbookElements: any[] = [],
  epigraph?: string,
  footnote?: string,
  dedication?: string,
  afterword?: string,
  location?: string,
  coverImage?: string
) => {
  const poemsRef = collection(db, "poems");
  const finalAuthorName = isAnonymous ? "Ghost Writer" : authorName;
  
  const docRef = await addDoc(poemsRef, {
    authorId: isAnonymous ? "anonymous" : authorId,
    authorName: finalAuthorName,
    title,
    content,
    likesCount: 0,
    createdAt: serverTimestamp(),
    isVaulted,
    aesthetic,
    isAnonymous,
    weather,
    translationContent: translationContent || "",
    isScrapbook,
    scrapbookElements,
    epigraph: epigraph || "",
    footnote: footnote || "",
    dedication: dedication || "",
    afterword: afterword || "",
    location: location || "",
    coverImage: coverImage || "",
    readsCount: 0,
    totalReadTime: 0,
    completionsCount: 0,
    ...(isVaulted && passphrase ? { passphrase } : {})
  });
  
  if (!isVaulted) {
    await createSiteNotification("poem", `New poem published: ${title}`, `/read/${docRef.id}`);
  }
  
  return docRef.id;
};

export const getLatestPoems = async (limitCount = 20) => {
  const poemsRef = collection(db, "poems");
  // Only get unvaulted poems
  const q = query(poemsRef, where("isVaulted", "!=", true), orderBy("isVaulted"), orderBy("createdAt", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  // Filtering locally in case index isn't ready
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Poem))
    .filter(poem => !poem.isVaulted)
    .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
};

export const getPoemsByUser = async (authorId: string) => {
  const poemsRef = collection(db, "poems");
  const q = query(poemsRef, where("authorId", "==", authorId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Poem))
    .filter(poem => !poem.isVaulted);
};

export const getFollowingPoems = async (followerId: string, limitCount = 30) => {
  // First, fetch the list of followed users
  const followingRef = collection(db, "users", followerId, "following");
  const followingSnap = await getDocs(followingRef);
  const followedUserIds = followingSnap.docs.map(doc => doc.id);

  if (followedUserIds.length === 0) return [];

  // Firestore allows 'in' queries up to 10 items.
  // We'll chunk them if there are more than 10.
  const chunks = [];
  for (let i = 0; i < followedUserIds.length; i += 10) {
    chunks.push(followedUserIds.slice(i, i + 10));
  }

  const poemsRef = collection(db, "poems");
  let allPoems: Poem[] = [];

  for (const chunk of chunks) {
    const q = query(
      poemsRef, 
      where("authorId", "in", chunk),
      where("isVaulted", "==", false),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const poems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poem));
    allPoems = [...allPoems, ...poems];
  }

  // Sort locally across all chunks
  return allPoems.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).slice(0, limitCount);
};

export const getPoemById = async (id: string) => {
  const poemRef = doc(db, "poems", id);
  const snapshot = await getDoc(poemRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Poem;
  }
  return null;
};

// --- Comments / Echoes ---

export interface CommentData {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  lineIndex?: number | null;
  parentId?: string | null;
  isPinned?: boolean;
}

export const addComment = async (poemId: string, authorId: string, authorName: string, content: string, lineIndex: number | null = null, parentId: string | null = null) => {
  const commentsRef = collection(db, "poems", poemId, "comments");
  const docRef = await addDoc(commentsRef, {
    authorId,
    authorName,
    content,
    createdAt: serverTimestamp(),
    lineIndex,
    parentId,
    isPinned: false
  });

  // Track global comment count
  const statsRef = doc(db, "statistics", "global");
  await setDoc(statsRef, { totalComments: increment(1) }, { merge: true });

  await createSiteNotification("comment", `New comment by ${authorName}`, `/read/${poemId}`);

  // User notification for reply
  if (parentId) {
    const parentRef = doc(db, "poems", poemId, "comments", parentId);
    const parentSnap = await getDoc(parentRef);
    if (parentSnap.exists()) {
      const parentAuthorId = parentSnap.data().authorId;
      if (parentAuthorId !== authorId) {
        await createUserNotification(parentAuthorId, "reply", `${authorName} replied to your comment`, `/read/${poemId}`);
      }
    }
  }
};

export const getComments = async (poemId: string) => {
  const commentsRef = collection(db, "poems", poemId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommentData));
};

export const pinComment = async (poemId: string, commentId: string, isPinned: boolean) => {
  const commentRef = doc(db, "poems", poemId, "comments", commentId);
  await updateDoc(commentRef, { isPinned });
};

// --- Bookmarks ---
export const toggleBookmark = async (userId: string, poemId: string, isBookmarked: boolean) => {
  const bookmarkRef = doc(db, "users", userId, "bookmarks", poemId);
  if (isBookmarked) {
    await deleteDoc(bookmarkRef);
  } else {
    await setDoc(bookmarkRef, {
      poemId,
      createdAt: serverTimestamp(),
    });
  }
};

export const checkIsBookmarked = async (userId: string, poemId: string) => {
  const bookmarkRef = doc(db, "users", userId, "bookmarks", poemId);
  const snapshot = await getDoc(bookmarkRef);
  return snapshot.exists();
};

export const getBookmarkedPoems = async (userId: string) => {
  const bookmarksRef = collection(db, "users", userId, "bookmarks");
  const snapshot = await getDocs(bookmarksRef);
  const poemIds = snapshot.docs.map(doc => doc.id);
  
  if (poemIds.length === 0) return [];
  
  // Since we can't do an 'in' query with more than 10 items easily, or we might want to just fetch them individually for simplicity in a small app
  const poems = await Promise.all(poemIds.map(id => getPoemById(id)));
  return poems.filter(p => p !== null) as Poem[];
};

// Removed duplicate follow logic
// --- Likes ---

export const togglePoemLike = async (userId: string, poemId: string, isLiked: boolean) => {
  const likeRef = doc(db, "poems", poemId, "likes", userId);
  const poemRef = doc(db, "poems", poemId);
  const batch = writeBatch(db);

  if (isLiked) {
    batch.delete(likeRef);
    batch.update(poemRef, { likesCount: increment(-1) });
  } else {
    batch.set(likeRef, { createdAt: serverTimestamp() });
    batch.update(poemRef, { likesCount: increment(1) });
  }
  
  await batch.commit();
};

export const checkIsPoemLiked = async (userId: string, poemId: string) => {
  const likeRef = doc(db, "poems", poemId, "likes", userId);
  const snapshot = await getDoc(likeRef);
  return snapshot.exists();
};

// --- Tracking & Notifications ---

export const createAdminNotification = async (type: "signup" | "visit", details: string) => {
  const notifRef = collection(db, "adminNotifications");
  await addDoc(notifRef, {
    type,
    details,
    createdAt: serverTimestamp(),
    isRead: false
  });
};

export const trackUniqueVisit = async () => {
  const statsRef = doc(db, "statistics", "global");
  try {
    const snap = await getDoc(statsRef);
    if (!snap.exists()) {
      await setDoc(statsRef, { totalVisits: 1 }, { merge: true });
    } else {
      await updateDoc(statsRef, { totalVisits: increment(1) });
    }
  } catch (e) {
    console.error("Error tracking visit", e);
  }
};

export const createSiteNotification = async (type: "poem" | "comment", details: string, link: string) => {
  const notifRef = collection(db, "siteNotifications");
  await addDoc(notifRef, {
    type,
    details,
    link,
    createdAt: serverTimestamp()
  });
};

export const createUserNotification = async (userId: string, type: "reply", details: string, link: string) => {
  const notifRef = collection(db, "users", userId, "notifications");
  await addDoc(notifRef, {
    type,
    details,
    link,
    createdAt: serverTimestamp(),
    isRead: false
  });
};

export const getAdminStats = async () => {
  const poemsRef = collection(db, "poems");
  
  const bestQ = query(poemsRef, orderBy("likesCount", "desc"), limit(1));
  const bestSnap = await getDocs(bestQ);
  const bestPoem = bestSnap.docs.length > 0 ? { id: bestSnap.docs[0].id, ...bestSnap.docs[0].data() } as Poem : null;

  const worstQ = query(poemsRef, orderBy("likesCount", "asc"), limit(1));
  const worstSnap = await getDocs(worstQ);
  const worstPoem = worstSnap.docs.length > 0 ? { id: worstSnap.docs[0].id, ...worstSnap.docs[0].data() } as Poem : null;

  const statsRef = doc(db, "statistics", "global");
  const statsSnap = await getDoc(statsRef);
  const globalStats = statsSnap.exists() ? statsSnap.data() : { totalVisits: 0, totalComments: 0 };
  
  const allPoemsSnap = await getDocs(poemsRef);
  const totalPoems = allPoemsSnap.docs.length;

  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);
  const totalUsers = usersSnap.docs.length;

  return {
    bestPoem,
    worstPoem,
    totalComments: globalStats.totalComments || 0,
    totalPoems,
    totalVisits: globalStats.totalVisits || 0,
    totalUsers
  };
};

export const getAdminNotifications = async () => {
  const notifRef = collection(db, "adminNotifications");
  const q = query(notifRef, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getSiteNotifications = async () => {
  const notifRef = collection(db, "siteNotifications");
  const q = query(notifRef, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserNotifications = async (userId: string) => {
  const notifRef = collection(db, "users", userId, "notifications");
  const q = query(notifRef, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const checkUsernameAvailability = async (username: string) => {
  const usernameRef = doc(db, "usernames", username.toLowerCase());
  const snap = await getDoc(usernameRef);
  return !snap.exists();
};
