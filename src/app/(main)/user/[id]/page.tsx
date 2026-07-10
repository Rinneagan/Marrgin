"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserProfile, getPoemsByUser, getCollectionsForUser, Poem, Collection, toggleFollowUser, checkIsFollowing } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Library, CheckCircle, Heart, Feather } from "lucide-react";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"poems" | "anthologies">("poems");

  const isOwnProfile = user?.uid === params.id;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!params.id) return;
      
      try {
        const uid = params.id as string;
        
        // Fetch public profile info
        const profileData = await getUserProfile(uid);
        if (profileData) {
          setProfile(profileData);
        }

        // Fetch their public poems
        const poemsData = await getPoemsByUser(uid);
        setPoems(poemsData);

        // Fetch their public collections
        const collectionsData = await getCollectionsForUser(uid);
        setCollections(collectionsData.filter(c => c.isPublic));

        // Check if current user is following this profile
        if (user && !isOwnProfile) {
          const followingStatus = await checkIsFollowing(user.uid, uid);
          setIsFollowing(followingStatus);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [params.id, user, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!user) {
      alert("Please sign in to follow users.");
      return;
    }
    setIsTogglingFollow(true);
    try {
      const uid = params.id as string;
      await toggleFollowUser(user.uid, uid, isFollowing);
      setIsFollowing(!isFollowing);
      // Optimistically update counts locally
      setProfile((prev: any) => ({
        ...prev,
        followersCount: (prev.followersCount || 0) + (isFollowing ? -1 : 1)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center px-4">
        <h1 className="font-serif text-4xl mb-4">Poet Not Found</h1>
        <p className="text-secondary mb-8">This user may not exist or has been deleted.</p>
        <button onClick={() => router.back()} className="text-black dark:text-white border border-gray-200 dark:border-gray-800 px-6 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Profile Header */}
      <div className="pt-32 pb-16 px-8 max-w-[800px] mx-auto text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center border-4 border-white dark:border-black shadow-lg">
          <Feather size={32} className="text-gray-400" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl mb-2">{profile.currentPenName || profile.displayName}</h1>
        {profile.currentPenName && profile.currentPenName !== profile.displayName && (
          <p className="text-sm text-secondary uppercase tracking-widest mb-6">Also known as {profile.displayName}</p>
        )}
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-8 leading-relaxed font-poem">
          {profile.bio || "No biography provided."}
        </p>

        <div className="flex items-center justify-center gap-8 mb-8 text-sm">
          <div className="flex flex-col items-center">
            <span className="font-serif text-2xl">{profile.followersCount || 0}</span>
            <span className="text-secondary uppercase tracking-widest">Followers</span>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-2xl">{profile.followingCount || 0}</span>
            <span className="text-secondary uppercase tracking-widest">Following</span>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-2xl">{poems.length}</span>
            <span className="text-secondary uppercase tracking-widest">Poems</span>
          </div>
        </div>

        {!isOwnProfile ? (
          <button 
            onClick={handleToggleFollow}
            disabled={isTogglingFollow}
            className={`px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 mx-auto ${
              isFollowing 
                ? "bg-transparent border border-gray-300 dark:border-gray-700 hover:border-red-500 hover:text-red-500" 
                : "bg-black text-white dark:bg-white dark:text-black hover:scale-105"
            }`}
          >
            {isFollowing ? (
              <>
                <CheckCircle size={18} /> Following
              </>
            ) : (
              <>
                <Heart size={18} /> Follow
              </>
            )}
          </button>
        ) : (
          <Link href="/profile" className="inline-block border border-gray-200 dark:border-gray-800 px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-[1000px] mx-auto px-8">
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-12">
          <button 
            onClick={() => setActiveTab("poems")}
            className={`flex items-center gap-2 pb-4 px-6 text-sm font-medium transition-colors relative ${
              activeTab === "poems" ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <BookOpen size={18} /> Published Work
            {activeTab === "poems" && (
              <motion.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("anthologies")}
            className={`flex items-center gap-2 pb-4 px-6 text-sm font-medium transition-colors relative ${
              activeTab === "anthologies" ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Library size={18} /> Anthologies
            {activeTab === "anthologies" && (
              <motion.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "poems" && (
          <div>
            {poems.length === 0 ? (
              <div className="text-center py-20 text-secondary">
                No published poems yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {poems.map((poem, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={poem.id}
                  >
                    <Link href={`/read/${poem.id}`} className="block group h-full">
                      <div className="h-full flex flex-col p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all">
                        <h3 className="font-serif text-2xl mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{poem.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-4 font-poem flex-1">
                          {poem.content.replace(/<[^>]+>/g, '')}
                        </p>
                        <div className="mt-6 text-xs text-secondary uppercase tracking-widest flex items-center gap-4">
                          <span>{poem.createdAt?.toDate().toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Heart size={12} /> {poem.likesCount || 0}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "anthologies" && (
          <div>
            {collections.length === 0 ? (
              <div className="text-center py-20 text-secondary">
                No public anthologies yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={collection.id}
                  >
                    <Link href={`/collections/${collection.id}`} className="group block">
                      <div className="aspect-[4/5] rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-xl">
                        <img src={collection.coverImage} alt={collection.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                          <h3 className="text-white font-serif text-2xl mb-1">{collection.title}</h3>
                          <p className="text-gray-300 text-sm">{collection.poemIds.length} Poems</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
