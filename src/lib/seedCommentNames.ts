import { collection, doc, writeBatch, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const CURATED_PSEUDONYMS: string[] = [
  "Paper Crane", "Quiet Fox", "Velvet Comet", "Blue Hour", "Copper Finch", 
  "Winter Sparrow", "Silver Rain", "Hidden River", "Pale Moon", "Cedar Ghost", 
  "Night Heron", "Glassbird", "Moss Lantern", "River Stone", "Little Atlas", 
  "Moonflower", "Indigo Fox", "Red Kite", "Paper Boat", "Soft Thunder", 
  "Distant Star", "Blackbird", "Wild Fig", "Quiet Atlas", "Ivory Crow", 
  "Forest Bell", "Amber Moth", "Tidepool Owl", "Frost Fern", "Dune Lark", 
  "Evening Swift", "Golden Reed", "Salt Marsh", "Morning Gull", "Rust Falcon", 
  "Solitary Pine", "Driftwood Loon", "Mist Plover", "Rain Lily", "Shadow Tern", 
  "Granite Heron", "Wind Harp", "Birch Owl", "Sage Wren", "Silent Kestrel", 
  "Ochre Moon", "Cloud Petrel", "Iron Star", "Cedar Waxwing", "Thistle Finch", 
  "North Starling", "Dusky Gull", "Winter Oriole", "Sand Piper", "Meadow Pipit", 
  "Silver Birch", "River Otter", "Nightjar", "Willow Warbler", "Ember Dove", 
  "Ash Sparrow", "Clouded Yellow", "Stonechat", "Marsh Harrier", "Brambling", 
  "Crested Lark", "Kingfisher", "Storm Petrel", "Fulmar", "Redshank", 
  "Dunlin", "Greenshank", "Curlew", "Whimbrel", "Black Godwit", 
  "Turnstone", "Knot", "Sanderling", "Little Stint", "Ruff", 
  "Snipe", "Woodcock", "Blackcap", "Chiffchaff", "Whitethroat", 
  "Sedge Warbler", "Reed Bunting", "Yellowhammer", "Cirl Bunting", "Corn Bunting", 
  "Snow Bunting", "Lapwing", "Dotterel", "Golden Plover", "Grey Plover", 
  "Ringed Plover", "Oystercatcher", "Avocet", "Black Stilt", "Grey Phalarope", 
  "Arctic Skua", "Kittiwake", "Guillemot", "Razorbill", "Atlantic Puffin", 
  "Red Diver", "Black Grebe", "Eurasian Bittern", "Spoonbill", "Glossy Ibis", 
  "Common Crane", "Little Bustard", "Pin Sandgrouse", "Alpine Swift", "Hoopoe", 
  "European Roller", "Blue Bee-eater", "Wryneck", "Green Woodpecker", "Golden Oriole", 
  "Woodchat Shrike", "Eurasian Jay", "Azure Magpie", "Red Chough", "Northern Raven", 
  "Spotted Starling", "White Dipper", "Ring Ouzel", "Fieldfare", "Redwing", 
  "Mistle Thrush", "Song Thrush", "Black Redstart", "Common Redstart", "Whinchat", 
  "Northern Wheatear", "Rock Thrush", "Blue Rock Thrush", "Wallcreeper", "Short Treecreeper", 
  "Wood Nuthatch", "Penduline Tit", "Bearded Tit", "Long-tailed Tit", "Crested Tit", 
  "Marsh Tit", "Willow Tit", "Coal Tit", "Azure Tit", "Great Tit", 
  "Firecrest", "Goldcrest", "Bohemian Waxwing", "European Serin", "Eurasian Siskin", 
  "Mountain Twite", "Common Linnet", "Red Crossbill", "Hawfinch", "Common Rosefinch", 
  "Eurasian Bullfinch", "White Snowfinch", "Rock Sparrow", "Citril Finch", "Trumpeter Finch", 
  "Canyon Wren", "Rock Wren", "Winter Wren", "Marsh Wren", "Sedge Wren", 
  "Bewick Wren", "Carolina Wren", "Cactus Wren", "Pygmy Nuthatch", "Brown Creeper", 
  "Wrentit", "Bushtit", "Verdin", "Phainopepla", "Cedar Bird", 
  "Bohemian Bird", "Northern Shrike", "Loggerhead Shrike", "Bell Vireo", "Hutton Vireo", 
  "Blue Vireo", "Warbling Vireo", "Philadelphia Vireo", "Red Vireo", "Gray Jay", 
  "Steller Jay", "Blue Jay", "Florida Jay", "Green Jay", "Clark Nutcracker", 
  "Black Magpie", "Yellow Magpie", "Fish Crow", "Chihuahuan Raven", "Common Raven", 
  "Horned Lark", "Purple Martin", "Tree Swallow", "Violet Swallow", "Bank Swallow", 
  "Cliff Swallow", "Cave Swallow", "Barn Swallow", "Bridled Titmouse", "Oak Titmouse", 
  "Juniper Titmouse", "Tufted Titmouse", "Black Titmouse", "Red Nuthatch", "White Nuthatch", 
  "Townsend Solitaire", "Veery", "Gray Thrush", "Bicknell Thrush", "Swainson Thrush", 
  "Hermit Thrush", "Wood Thrush", "American Robin", "Varied Thrush", "Gray Catbird", 
  "Northern Mockingbird", "Sage Thrasher", "Brown Thrasher", "Bendire Thrasher", "Curve Thrasher", 
  "Crissal Thrasher", "LeConte Thrasher", "American Pipit", "Sprague Pipit", "Cedar Pipit", 
  "Ovenbird", "Worm Warbler", "Louisiana Waterthrush", "Northern Waterthrush", "Golden Warbler", 
  "Blue Warbler", "Black-and-white Warbler", "Prothonotary Warbler", "Swainson Warbler", "Tennessee Warbler", 
  "Orange Warbler", "Nashville Warbler", "Virginia Warbler", "Connecticut Warbler", "Mourning Warbler", 
  "Kentucky Warbler", "Common Yellowthroat", "Hooded Warbler", "American Redstart", "Kirtland Warbler", 
  "Cape Warbler", "Cerulean Warbler", "Northern Parula", "Magnolia Warbler", "Bay Warbler", 
  "Blackburnian Warbler", "Yellow Warbler", "Chestnut Warbler", "Blackpoll Warbler", "Black-throated Blue", 
  "Palm Warbler", "Pine Warbler", "Yellow-rumped Warbler", "Yellow-throated Warbler", "Prairie Warbler", 
  "Grace Warbler", "Black-throated Gray", "Townsend Warbler", "Hermit Warbler", "Black-throated Green", 
  "Canada Warbler", "Wilson Warbler", "Red-faced Warbler", "Painted Redstart", "Yellow-breasted Chat", 
  "Green Towhee", "Spotted Towhee", "Eastern Towhee", "Canyon Towhee", "California Towhee", 
  "Abert Towhee", "Rufous Sparrow", "Botteri Sparrow", "Cassin Sparrow", "Bachman Sparrow", 
  "Chipping Sparrow", "Clay Sparrow", "Brewer Sparrow", "Field Sparrow", "Vesper Sparrow", 
  "Lark Sparrow", "Black-throated Sparrow", "Sagebrush Sparrow", "Bell Sparrow", "Lark Bunting", 
  "Savannah Sparrow", "Grasshopper Sparrow", "Baird Sparrow", "Henslow Sparrow", "LeConte Sparrow", 
  "Nelson Sparrow", "Saltmarsh Sparrow", "Seaside Sparrow", "Fox Sparrow", "Song Sparrow", 
  "Lincoln Sparrow", "Swamp Sparrow", "White-throated Sparrow", "Harris Sparrow", "White-crowned Sparrow", 
  "Golden-crowned Sparrow", "Dark-eyed Junco", "Yellow-eyed Junco", "McCown Longspur", "Lapland Longspur", 
  "Smith Longspur", "Chestnut Longspur", "Snow Bunting", "McKay Bunting", "Summer Tanager", 
  "Scarlet Tanager", "Western Tanager", "Hepatic Tanager", "Northern Cardinal", "Pyrrhuloxia", 
  "Rose Grosbeak", "Black Grosbeak", "Blue Grosbeak", "Lazuli Bunting", "Indigo Bunting", 
  "Varied Bunting", "Painted Bunting", "Dickcissel", "Bobolink", "Red-winged Blackbird", 
  "Eastern Meadowlark", "Western Meadowlark", "Yellow Blackbird", "Rusty Blackbird", "Brewer Blackbird"
];

export async function seedCommentNamesIfNeeded(): Promise<number> {
  const colRef = collection(db, "commentNames");
  const existingSnap = await getDocs(query(colRef, limit(1)));
  if (!existingSnap.empty) {
    return 0; // Already seeded
  }

  let count = 0;
  // Write in batches of 250 (Firestore limit is 500)
  for (let i = 0; i < CURATED_PSEUDONYMS.length; i += 250) {
    const batch = writeBatch(db);
    const slice = CURATED_PSEUDONYMS.slice(i, i + 250);
    slice.forEach((name, idx) => {
      const docId = `name_${i + idx + 1}`;
      const docRef = doc(colRef, docId);
      batch.set(docRef, { name, active: true });
      count++;
    });
    await batch.commit();
  }
  return count;
}
