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

// --- Pieces & Editorial Models ---

export type EditorialMode = "poetry" | "essay" | "investigation" | "field-note" | "data-story";

export type EditorialGroup = "writing" | "investigations" | "field-notes" | "data";

export function getEditorialGroup(mode?: EditorialMode): EditorialGroup {
  if (mode === "investigation") return "investigations";
  if (mode === "field-note") return "field-notes";
  if (mode === "data-story") return "data";
  return "writing"; // poetry, essay, or legacy undefined default to writing
}

export type EvidenceStatus = "unverified" | "needs_corroboration" | "supported_by_evidence" | "disputed";

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

export interface Piece extends Poem {
  subtitle?: string;
  mode?: EditorialMode;
  status?: "draft" | "published" | "archived" | "scheduled";
  publishedAt?: any;
  scheduledAt?: any;
  coverImagePrompt?: string;
  slug?: string;
  tags?: string[];
  readingTimeMinutes?: number;
  updatedAt?: any;
  centralQuestion?: string;
  methodology?: string;
  limitations?: string;
  publicSources?: { title: string; url?: string; publisherOrOrg?: string; date?: string; notes?: string }[];
  corrections?: { date: string; whatChanged: string; reason?: string }[];
  dataSources?: { name: string; url?: string; description?: string }[];
  datasetName?: string;
  dataSource?: string;
  dataTimeframe?: string;
  dataUnits?: string;
  dataConfig?: string;
  locationCoordinates?: { lat: number; lng: number };
  dateObserved?: string;
  observation?: string;
  finding?: string;
  inference?: string;
  narrativeContext?: string;
  summary?: string;
  chapter?: string; // e.g. "beyond-the-rain"
}

export interface EditorialWorkspace {
  pieceId?: string;
  workingHypothesis: string;
  counterargumentsInvestigated?: string;
  reportingTargets?: string[];
  updatedAt?: any;
  createdAt?: any;
}

export interface InterviewRecord {
  id: string;
  nameOrIdentifier: string;
  role?: string;
  date?: string;
  contactInfo?: string;
  notes?: string;
  keyClaims: string[];
  evidenceStatus: EvidenceStatus;
  consentGiven?: boolean;
  createdAt?: any;
}

export interface InternalSource {
  id: string;
  title: string;
  sourceType: string;
  url?: string;
  publisherOrOrg?: string;
  publicationDate?: string;
  accessDate?: string;
  claimSupported?: string;
  notes?: string;
  evidenceStatus: EvidenceStatus;
  isPubliclyVisible?: boolean;
  createdAt?: any;
}

export interface EvidenceClaim {
  id: string;
  claimText: string;
  evidenceStatus: EvidenceStatus;
  primarySourceRef?: string;
  notes?: string;
  createdAt?: any;
}

export const normalizePiece = (raw: any, id: string): Piece => {
  return {
    id,
    title: raw.title || "Untitled",
    content: raw.content || "",
    authorId: raw.authorId || "anonymous",
    authorName: raw.authorName || "Ghost Writer",
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
    likesCount: raw.likesCount || 0,
    readsCount: raw.readsCount || 0,
    totalReadTime: raw.totalReadTime || 0,
    completionsCount: raw.completionsCount || 0,
    isVaulted: Boolean(raw.isVaulted),
    passphrase: raw.passphrase || "",
    aesthetic: raw.aesthetic || "default",
    isAnonymous: Boolean(raw.isAnonymous),
    weather: raw.weather || "none",
    translationContent: raw.translationContent || "",
    isScrapbook: Boolean(raw.isScrapbook),
    scrapbookElements: raw.scrapbookElements || [],
    epigraph: raw.epigraph || "",
    footnote: raw.footnote || "",
    dedication: raw.dedication || "",
    afterword: raw.afterword || "",
    location: raw.location || "",
    coverImage: raw.coverImage || "",
    subtitle: raw.subtitle || "",
    mode: raw.mode || "poetry",
    status: raw.status || "published", // Backward compatibility: legacy pieces without status are published
    publishedAt: raw.publishedAt || null,
    scheduledAt: raw.scheduledAt || null,
    slug: raw.slug || "",
    tags: raw.tags || [],
    readingTimeMinutes: raw.readingTimeMinutes || 0,
    centralQuestion: raw.centralQuestion || "",
    methodology: raw.methodology || "",
    limitations: raw.limitations || "",
    publicSources: raw.publicSources || [],
    corrections: raw.corrections || [],
    dataSources: raw.dataSources || [],
    datasetName: raw.datasetName || "",
    dataSource: raw.dataSource || "",
    dataTimeframe: raw.dataTimeframe || "",
    dataUnits: raw.dataUnits || "",
    dataConfig: raw.dataConfig || "",
    locationCoordinates: raw.locationCoordinates || undefined,
    dateObserved: raw.dateObserved || "",
    observation: raw.observation || "",
    finding: raw.finding || "",
    inference: raw.inference || "",
    narrativeContext: raw.narrativeContext || "",
    summary: raw.summary || "",
    chapter: raw.chapter || ""
  };
};

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

export const deletePoem = async (poemId: string) => {
  const poemRef = doc(db, "poems", poemId);
  await deleteDoc(poemRef);
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

export interface FeedOptions {
  group?: EditorialGroup | "all";
  mode?: EditorialMode | "all";
  feedType?: "global" | "following";
  followerId?: string;
  limitCount?: number;
}

export const getPiecesFeed = async (options: FeedOptions = {}): Promise<Piece[]> => {
  const { group = "all", mode = "all", feedType = "global", followerId, limitCount = 30 } = options;

  let pieces: Piece[] = [];

  if (feedType === "following" && followerId) {
    const rawFollowing = await getFollowingPoems(followerId, limitCount * 2);
    pieces = rawFollowing.map(p => normalizePiece(p, p.id));
  } else {
    const poemsRef = collection(db, "poems");
    const q = query(
      poemsRef,
      where("isVaulted", "!=", true),
      orderBy("isVaulted"),
      orderBy("createdAt", "desc"),
      limit(Math.max(50, limitCount * 2))
    );
    const snapshot = await getDocs(q);
    pieces = snapshot.docs
      .map(doc => normalizePiece(doc.data(), doc.id))
      .filter(p => !p.isVaulted && (p.status === "published" || !p.status));
  }

  // Filter by mode or editorial group
  if (mode && mode !== "all") {
    pieces = pieces.filter(p => p.mode === mode);
  } else if (group && group !== "all") {
    pieces = pieces.filter(p => getEditorialGroup(p.mode) === group);
  }

  return pieces.slice(0, limitCount);
};

export const getBeyondTheRainPieces = async (): Promise<Piece[]> => {
  const allPieces = await getPiecesFeed({ limitCount: 100 });
  const chapterPieces = allPieces.filter(p => 
    p.chapter === "beyond-the-rain" && 
    !p.isVaulted && 
    (p.status === "published" || !p.status)
  );

  return chapterPieces.sort((a, b) => {
    const timeA = a.publishedAt ? (a.publishedAt.toMillis ? a.publishedAt.toMillis() : new Date(a.publishedAt).getTime()) : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.publishedAt ? (b.publishedAt.toMillis ? b.publishedAt.toMillis() : new Date(b.publishedAt).getTime()) : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });
};

export function searchPieces(queryStr: string, pieces: Piece[]): Piece[] {
  const term = queryStr.trim().toLowerCase();
  if (!term) return pieces;

  return pieces.filter(piece => {
    const titleMatch = piece.title?.toLowerCase().includes(term);
    const subtitleMatch = piece.subtitle?.toLowerCase().includes(term);
    const questionMatch = piece.centralQuestion?.toLowerCase().includes(term);
    const observationMatch = piece.observation?.toLowerCase().includes(term);
    const authorMatch = (piece.authorName || (piece as any).author)?.toLowerCase().includes(term);
    const locationMatch = piece.location?.toLowerCase().includes(term);
    const tagMatch = piece.tags?.some(t => t.toLowerCase().includes(term));
    const modeMatch = piece.mode?.toLowerCase().includes(term);
    const excerptMatch = piece.content?.slice(0, 300).toLowerCase().includes(term);

    return Boolean(
      titleMatch || 
      subtitleMatch || 
      questionMatch || 
      observationMatch || 
      authorMatch || 
      locationMatch || 
      tagMatch || 
      modeMatch || 
      excerptMatch
    );
  });
}

export interface HomepageData {
  leadPiece: Piece | null;
  modePieces: {
    writing: Piece[];
    investigations: Piece[];
    fieldNotes: Piece[];
    dataStories: Piece[];
  };
  featuredLocations: { name: string; count: number }[];
}

export const getHomepageData = async (): Promise<HomepageData> => {
  const poemsRef = collection(db, "poems");
  const q = query(
    poemsRef,
    where("isVaulted", "!=", true),
    orderBy("isVaulted"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  const pieces = snapshot.docs
    .map(doc => normalizePiece(doc.data(), doc.id))
    .filter(p => !p.isVaulted && (p.status === "published" || !p.status));

  // 1. Determine the lead story
  // Priority: explicit isFeatured, then investigation with centralQuestion, then most substantial piece
  let leadPiece = pieces.find(p => (p as any).isFeatured) || null;
  if (!leadPiece) {
    leadPiece = pieces.find(p => p.mode === "investigation" && p.centralQuestion) || null;
  }
  if (!leadPiece && pieces.length > 0) {
    leadPiece = pieces[0];
  }

  // 2. Partition pieces by mode / pillar (excluding the leadPiece from secondary lists if possible)
  const remaining = pieces.filter(p => p.id !== leadPiece?.id);

  const modePieces = {
    writing: remaining.filter(p => p.mode === "poetry" || p.mode === "essay").slice(0, 3),
    investigations: remaining.filter(p => p.mode === "investigation").slice(0, 3),
    fieldNotes: remaining.filter(p => p.mode === "field-note").slice(0, 3),
    dataStories: remaining.filter(p => p.mode === "data-story").slice(0, 3)
  };

  // If remaining has none in some modes, fallback to all pieces
  if (modePieces.writing.length === 0) {
    modePieces.writing = pieces.filter(p => p.mode === "poetry" || p.mode === "essay" || !p.mode).slice(0, 3);
  }

  // 3. Collect active locations (only real non-empty locations)
  const locCountMap = new Map<string, number>();
  pieces.forEach(p => {
    const loc = p.location?.trim();
    if (loc) {
      locCountMap.set(loc, (locCountMap.get(loc) || 0) + 1);
    }
  });

  const featuredLocations = Array.from(locCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    leadPiece,
    modePieces,
    featuredLocations
  };
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

export const getPoemById = async (id: string, _includeDrafts: boolean = false): Promise<Piece | null> => {
  try {
    const poemRef = doc(db, "poems", id);
    const snapshot = await getDoc(poemRef);
    if (snapshot.exists()) {
      return normalizePiece(snapshot.data(), snapshot.id);
    }
    return null;
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("Missing or insufficient permissions") || error?.message?.includes("insufficient permissions")) {
      return null;
    }
    throw error;
  }
};
export const getPieceById = getPoemById;

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

export const ensurePieceDraft = async (
  pieceId: string, 
  data: { authorId: string; authorName: string; mode?: EditorialMode; title?: string; centralQuestion?: string }
): Promise<void> => {
  if (!pieceId) return;
  const pieceRef = doc(db, "poems", pieceId);
  const snap = await getDoc(pieceRef);
  if (!snap.exists()) {
    await setDoc(pieceRef, {
      authorId: data.authorId || "anonymous",
      authorName: data.authorName || "Author",
      title: data.title || (data.mode === "investigation" ? "Untitled Investigation" : "Untitled Draft"),
      content: "",
      mode: data.mode || "poetry",
      status: "draft",
      centralQuestion: data.centralQuestion || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likesCount: 0,
      readsCount: 0,
      totalReadTime: 0,
      completionsCount: 0,
      isVaulted: false,
    });
  } else {
    const existing = snap.data();
    const updates: any = { updatedAt: serverTimestamp() };
    if (data.mode && (!existing.mode || existing.mode !== data.mode)) updates.mode = data.mode;
    if (data.title && data.title !== "Untitled Draft" && data.title !== "Untitled Investigation" && data.title !== existing.title) updates.title = data.title;
    if (data.centralQuestion && data.centralQuestion !== existing.centralQuestion) updates.centralQuestion = data.centralQuestion;
    if (data.authorId && !existing.authorId) updates.authorId = data.authorId;
    if (data.authorName && !existing.authorName) updates.authorName = data.authorName;
    if (!existing.status) updates.status = "draft";
    await updateDoc(pieceRef, updates);
  }
};

// Guarantee that an underlying piece draft exists in /poems/{pieceId} before any private workspace records are created
export const assertPieceDraftExists = async (
  pieceId: string, 
  initialMode: EditorialMode = "investigation", 
  authorId = "anonymous", 
  authorName = "Author"
): Promise<void> => {
  if (!pieceId) return;
  const pieceRef = doc(db, "poems", pieceId);
  const snap = await getDoc(pieceRef);
  if (!snap.exists()) {
    await setDoc(pieceRef, {
      authorId,
      authorName,
      title: initialMode === "investigation" ? "Untitled Investigation" : "Untitled Draft",
      content: "",
      mode: initialMode,
      status: "draft",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likesCount: 0,
      readsCount: 0,
      totalReadTime: 0,
      completionsCount: 0,
      isVaulted: false,
    });
  }
};

export const generatePieceId = (): string => {
  return doc(collection(db, "poems")).id;
};

export const createPiece = async (data: Partial<Piece>): Promise<string> => {
  const pieceId = data.id || generatePieceId();
  await savePiece(pieceId, data);
  return pieceId;
};

export const updatePiece = async (pieceId: string, updates: Partial<Piece>): Promise<void> => {
  const pieceRef = doc(db, "poems", pieceId);
  await updateDoc(pieceRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const savePiece = async (pieceId: string, pieceData: Partial<Piece>): Promise<void> => {
  const pieceRef = doc(db, "poems", pieceId);
  const snap = await getDoc(pieceRef);

  // Strip undefined values to comply with Firestore setDoc constraints
  const cleanPieceData: any = {};
  for (const [key, val] of Object.entries(pieceData)) {
    if (val !== undefined) {
      cleanPieceData[key] = val;
    }
  }

  const dataToSave: any = {
    ...cleanPieceData,
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    dataToSave.createdAt = serverTimestamp();
    dataToSave.status = pieceData.status || "draft";
    dataToSave.mode = pieceData.mode || "poetry";
    dataToSave.likesCount = pieceData.likesCount ?? 0;
    dataToSave.readsCount = pieceData.readsCount ?? 0;
    dataToSave.totalReadTime = pieceData.totalReadTime ?? 0;
    dataToSave.completionsCount = pieceData.completionsCount ?? 0;
    dataToSave.isVaulted = pieceData.isVaulted ?? false;
    if (pieceData.status === "published") {
      dataToSave.publishedAt = serverTimestamp();
    }
  } else {
    const existing = snap.data();
    // Rule 10: Publishing Semantics
    // For first publication: draft -> published, set publishedAt and updatedAt
    // For editing an already published piece: preserve original publishedAt, update updatedAt
    if (pieceData.status === "published") {
      if (existing?.publishedAt) {
        dataToSave.publishedAt = existing.publishedAt;
      } else {
        dataToSave.publishedAt = serverTimestamp();
      }
    }
  }

  await setDoc(pieceRef, dataToSave, { merge: true });
};

export interface WritingDeskData {
  drafts: Piece[];
  published: Piece[];
  archived: Piece[];
  scheduled: Piece[];
}

export const getDeskPieces = async (authorId: string, isAdminUser: boolean = false): Promise<WritingDeskData> => {
  const poemsRef = collection(db, "poems");
  let pieces: Piece[] = [];
  try {
    const q = isAdminUser
      ? query(poemsRef, orderBy("updatedAt", "desc"), limit(100))
      : query(poemsRef, where("authorId", "==", authorId), orderBy("updatedAt", "desc"), limit(100));
    const snap = await getDocs(q);
    pieces = snap.docs.map(d => normalizePiece(d.data(), d.id));
  } catch (err) {
    const fallbackQ = isAdminUser
      ? query(poemsRef, limit(100))
      : query(poemsRef, where("authorId", "==", authorId), limit(100));
    const snap = await getDocs(fallbackQ);
    pieces = snap.docs.map(d => normalizePiece(d.data(), d.id));
    pieces.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }

  const drafts = pieces.filter(p => p.status === "draft");
  const published = pieces.filter(p => p.status === "published" || (!p.status && p.status !== "draft" && p.status !== "archived" && p.status !== "scheduled"));
  const scheduled = pieces.filter(p => p.status === "scheduled");
  const archived = pieces.filter(p => p.status === "archived");

  return { drafts, published, archived, scheduled };
};

export const unpublishPiece = async (pieceId: string): Promise<void> => {
  const pieceRef = doc(db, "poems", pieceId);
  await updateDoc(pieceRef, {
    status: "draft",
    updatedAt: serverTimestamp()
  });
};

export const archivePiece = async (pieceId: string): Promise<void> => {
  const pieceRef = doc(db, "poems", pieceId);
  await updateDoc(pieceRef, {
    status: "archived",
    updatedAt: serverTimestamp()
  });
};

export const getUserDrafts = async (authorId: string): Promise<Piece[]> => {
  const poemsRef = collection(db, "poems");
  try {
    const q = query(poemsRef, where("authorId", "==", authorId), where("status", "==", "draft"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => normalizePiece(doc.data(), doc.id));
  } catch (e) {
    // Fallback if index is not ready
    const fallbackQ = query(poemsRef, where("authorId", "==", authorId));
    const snap = await getDocs(fallbackQ);
    return snap.docs
      .map(doc => normalizePiece(doc.data(), doc.id))
      .filter(p => p.status === "draft")
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  }
};

export const deletePieceWithWorkspace = async (pieceId: string): Promise<void> => {
  if (!pieceId) return;
  // Delete public piece document
  const pieceRef = doc(db, "poems", pieceId);
  await deleteDoc(pieceRef);

  // Delete workspace subcollections: interviews, sources, claims
  const interviewsRef = collection(db, "editorialWorkspaces", pieceId, "interviews");
  const sourcesRef = collection(db, "editorialWorkspaces", pieceId, "sources");
  const claimsRef = collection(db, "editorialWorkspaces", pieceId, "claims");

  try {
    const [intSnap, srcSnap, clmSnap] = await Promise.all([
      getDocs(interviewsRef),
      getDocs(sourcesRef),
      getDocs(claimsRef)
    ]);

    const batch = writeBatch(db);
    intSnap.docs.forEach(d => batch.delete(d.ref));
    srcSnap.docs.forEach(d => batch.delete(d.ref));
    clmSnap.docs.forEach(d => batch.delete(d.ref));

    // Delete workspace root doc
    const workspaceRef = doc(db, "editorialWorkspaces", pieceId);
    batch.delete(workspaceRef);

    await batch.commit();
  } catch (e) {
    console.error("Error deleting workspace resources for piece:", pieceId, e);
  }
};

// --- Editorial Workspace & Subcollections ---

export const getEditorialWorkspace = async (pieceId: string): Promise<EditorialWorkspace | null> => {
  if (!pieceId) return null;
  const docRef = doc(db, "editorialWorkspaces", pieceId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { pieceId, ...snap.data() } as EditorialWorkspace;
  }
  return null;
};

export const saveEditorialWorkspace = async (pieceId: string, data: Partial<EditorialWorkspace>): Promise<void> => {
  if (!pieceId) return;
  // Invariant guarantee: /poems/{pieceId} draft must exist first
  await assertPieceDraftExists(pieceId, "investigation");
  const docRef = doc(db, "editorialWorkspaces", pieceId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getWorkspaceInterviews = async (pieceId: string): Promise<InterviewRecord[]> => {
  if (!pieceId) return [];
  const colRef = collection(db, "editorialWorkspaces", pieceId, "interviews");
  const q = query(colRef, orderBy("createdAt", "desc"));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewRecord));
  } catch (e) {
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewRecord));
  }
};

export const saveWorkspaceInterview = async (pieceId: string, interview: Partial<InterviewRecord>): Promise<string> => {
  if (!pieceId) throw new Error("pieceId required");
  // Invariant guarantee: /poems/{pieceId} draft must exist first
  await assertPieceDraftExists(pieceId, "investigation");
  const colRef = collection(db, "editorialWorkspaces", pieceId, "interviews");
  if (interview.id) {
    const docRef = doc(db, "editorialWorkspaces", pieceId, "interviews", interview.id);
    await updateDoc(docRef, { ...interview });
    return interview.id;
  } else {
    const docRef = await addDoc(colRef, {
      ...interview,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const deleteWorkspaceInterview = async (pieceId: string, interviewId: string): Promise<void> => {
  if (!pieceId || !interviewId) return;
  const docRef = doc(db, "editorialWorkspaces", pieceId, "interviews", interviewId);
  await deleteDoc(docRef);
};

export const getWorkspaceSources = async (pieceId: string): Promise<InternalSource[]> => {
  if (!pieceId) return [];
  const colRef = collection(db, "editorialWorkspaces", pieceId, "sources");
  const q = query(colRef, orderBy("createdAt", "desc"));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InternalSource));
  } catch (e) {
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InternalSource));
  }
};

export const saveWorkspaceSource = async (pieceId: string, source: Partial<InternalSource>): Promise<string> => {
  if (!pieceId) throw new Error("pieceId required");
  // Invariant guarantee: /poems/{pieceId} draft must exist first
  await assertPieceDraftExists(pieceId, "investigation");
  const colRef = collection(db, "editorialWorkspaces", pieceId, "sources");
  if (source.id) {
    const docRef = doc(db, "editorialWorkspaces", pieceId, "sources", source.id);
    await updateDoc(docRef, { ...source });
    return source.id;
  } else {
    const docRef = await addDoc(colRef, {
      ...source,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const deleteWorkspaceSource = async (pieceId: string, sourceId: string): Promise<void> => {
  if (!pieceId || !sourceId) return;
  const docRef = doc(db, "editorialWorkspaces", pieceId, "sources", sourceId);
  await deleteDoc(docRef);
};

export const getWorkspaceClaims = async (pieceId: string): Promise<EvidenceClaim[]> => {
  if (!pieceId) return [];
  const colRef = collection(db, "editorialWorkspaces", pieceId, "claims");
  const q = query(colRef, orderBy("createdAt", "desc"));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EvidenceClaim));
  } catch (e) {
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EvidenceClaim));
  }
};

export const saveWorkspaceClaim = async (pieceId: string, claim: Partial<EvidenceClaim>): Promise<string> => {
  if (!pieceId) throw new Error("pieceId required");
  // Invariant guarantee: /poems/{pieceId} draft must exist first
  await assertPieceDraftExists(pieceId, "investigation");
  const colRef = collection(db, "editorialWorkspaces", pieceId, "claims");
  if (claim.id) {
    const docRef = doc(db, "editorialWorkspaces", pieceId, "claims", claim.id);
    await updateDoc(docRef, { ...claim });
    return claim.id;
  } else {
    const docRef = await addDoc(colRef, {
      ...claim,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const deleteWorkspaceClaim = async (pieceId: string, claimId: string): Promise<void> => {
  if (!pieceId || !claimId) return;
  const docRef = doc(db, "editorialWorkspaces", pieceId, "claims", claimId);
  await deleteDoc(docRef);
};
