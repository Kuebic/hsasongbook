import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { nanoid } from "nanoid";
import { generateSlug } from "./permissions";

/**
 * Seed song data
 */
const SEED_SONGS = [
  {
    title: "Amazing Grace",
    artist: "John Newton",
    themes: ["grace", "salvation", "redemption"],
    copyright: "Public Domain",
    lyrics:
      "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind but now I see",
  },
  {
    title: "How Great Thou Art",
    artist: "Carl Boberg",
    themes: ["worship", "creation", "majesty"],
    copyright: "Public Domain",
    lyrics:
      "O Lord my God, When I in awesome wonder\nConsider all the worlds Thy Hands have made\nI see the stars, I hear the rolling thunder\nThy power throughout the universe displayed",
  },
  {
    title: "Oceans (Where Feet May Fail)",
    artist: "Hillsong United",
    themes: ["faith", "trust", "courage"],
    copyright: "Hillsong Music Publishing",
    lyrics:
      "You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep, my faith will stand",
  },
  {
    title: "Way Maker",
    artist: "Sinach",
    themes: ["miracle", "promise", "worship"],
    copyright: "Integrity Music",
    lyrics:
      "You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You",
  },
  {
    title: "10,000 Reasons (Bless the Lord)",
    artist: "Matt Redman",
    themes: ["blessing", "praise", "worship"],
    copyright: "Thankyou Music",
    lyrics:
      "Bless the Lord, O my soul, O my soul\nWorship His holy name\nSing like never before, O my soul\nI'll worship Your holy name",
  },
  {
    title: "What A Beautiful Name",
    artist: "Hillsong Worship",
    themes: ["Jesus", "name", "power"],
    copyright: "Hillsong Music Publishing",
    lyrics:
      "You were the Word at the beginning\nOne with God the Lord Most High\nYour hidden glory in creation\nNow revealed in You our Christ",
  },
  {
    title: "Good Good Father",
    artist: "Chris Tomlin",
    themes: ["father", "love", "identity"],
    copyright: "Capitol CMG Publishing",
    lyrics:
      "I've heard a thousand stories\nOf what they think You're like\nBut I've heard the tender whisper\nOf love in the dead of night",
  },
  {
    title: "Reckless Love",
    artist: "Cory Asbury",
    themes: ["love", "grace", "pursuit"],
    copyright: "Bethel Music Publishing",
    lyrics:
      "Before I spoke a word, You were singing over me\nYou have been so, so good to me\nBefore I took a breath, You breathed Your life in me",
  },
  {
    title: "Build My Life",
    artist: "Housefires",
    themes: ["foundation", "worship", "devotion"],
    copyright: "Capitol CMG Publishing",
    lyrics:
      "Worthy of every song we could ever sing\nWorthy of all the praise we could ever bring\nWorthy of every breath we could ever breathe\nWe live for You",
  },
  {
    title: "Here I Am To Worship",
    artist: "Tim Hughes",
    themes: ["worship", "humility", "light"],
    copyright: "Thankyou Music",
    lyrics:
      "Light of the world\nYou stepped down into darkness\nOpened my eyes, let me see\nBeauty that made this heart adore You",
  },
  {
    title: "Holy Spirit",
    artist: "Bryan & Katie Torwalt",
    themes: ["spirit", "presence", "welcome"],
    copyright: "Capitol CMG Publishing",
    lyrics:
      "There's nothing worth more that will ever come close\nNo thing can compare You're our living hope\nYour Presence Lord",
  },
  {
    title: "Great Are You Lord",
    artist: "All Sons & Daughters",
    themes: ["praise", "breath", "creation"],
    copyright: "Integrity Music",
    lyrics:
      "You give life, You are love\nYou bring light to the darkness\nYou give hope, You restore\nEvery heart that is broken",
  },
  {
    title: "King of My Heart",
    artist: "Bethel Music",
    themes: ["kingship", "goodness", "forever"],
    copyright: "Bethel Music Publishing",
    lyrics:
      "Let the King of my heart\nBe the mountain where I run\nThe fountain I drink from\nOh He is my song",
  },
  {
    title: "Cornerstone",
    artist: "Hillsong Worship",
    themes: ["foundation", "Christ", "hope"],
    copyright: "Hillsong Music Publishing",
    lyrics:
      "My hope is built on nothing less\nThan Jesus' blood and righteousness\nI dare not trust the sweetest frame\nBut wholly trust in Jesus' name",
  },
  {
    title: "Living Hope",
    artist: "Phil Wickham",
    themes: ["hope", "resurrection", "hallelujah"],
    copyright: "Phil Wickham Music",
    lyrics:
      "How great the chasm that lay between us\nHow high the mountain I could not climb\nIn desperation I turned to heaven\nAnd spoke Your name into the night",
  },
];

/**
 * Seed arrangement data (indexed by song title)
 */
const SEED_ARRANGEMENTS: Record<
  string,
  Array<{
    name: string;
    key: string;
    tempo: number;
    timeSignature: string;
    capo: number;
    tags: string[];
    rating: number;
    favorites: number;
    chordProContent: string;
  }>
> = {
  "Amazing Grace": [
    {
      name: "Original",
      key: "G",
      tempo: 72,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.7,
      favorites: 342,
      chordProContent: `{comment: Play softly and reverently}

{start_of_verse: Verse 1}
[G]Amazing [G/B]grace, how [C]sweet the [G]sound
That [G]saved a [D/F#]wretch like [Em]me
I [G]once was [G/B]lost, but [C]now am [G]found
Was [Em]blind but [D]now I [G]see
{end_of_verse}

{start_of_verse: Verse 2}
'Twas [G]grace that [G/B]taught my [C]heart to [G]fear
And [G]grace my [D/F#]fears re[Em]lieved
How [G]precious [G/B]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved
{end_of_verse}`,
    },
    {
      name: "Alternative",
      key: "B",
      tempo: 68,
      timeSignature: "4/4",
      capo: 2,
      tags: ["alternative"],
      rating: 3.8,
      favorites: 67,
      chordProContent: `{comment: Alternative arrangement with capo on 2nd fret}

{start_of_verse}
[B]Amazing grace, how [E]sweet the [B]sound
That saved a [F#]wretch like me
I [B]once was lost, but [E]now am [B]found
Was [C#m]blind but [F#]now I [B]see
{end_of_verse}`,
    },
  ],
  "How Great Thou Art": [
    {
      name: "Traditional",
      key: "A",
      tempo: 68,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 5,
      favorites: 523,
      chordProContent: `{start_of_verse: Verse 1}
[A]O Lord my God, When I in [D]awesome wonder
Con[A]sider [E]all the [F#m]worlds Thy [E]Hands have [A]made
I see the stars, I hear the [D]rolling thunder
Thy [A]power through[E]out the [F#m]uni[E]verse dis[A]played
{end_of_verse}

{start_of_chorus}
Then sings my [D]soul, my [A]Savior God, to [E]Thee
How great Thou [F#m]art! [E]How great Thou [A]art!
{end_of_chorus}`,
    },
  ],
  "Oceans (Where Feet May Fail)": [
    {
      name: "Standard",
      key: "D",
      tempo: 66,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.2,
      favorites: 189,
      chordProContent: `{comment: Start softly and build}

{start_of_verse}
[D]You call me out upon the [A]waters
The great un[G]known where feet may [D]fail
And there I find You in the [A]mystery
In oceans [G]deep, my faith will [D]stand
{end_of_verse}

{start_of_chorus}
[D]And I will [G]call upon Your [D]name
And keep my [G]eyes above the [D]waves
When oceans [G]rise, my soul will [D]rest in Your em[A]brace
For I am [G]Yours [A]and You are [D]mine
{end_of_chorus}`,
    },
  ],
  "Way Maker": [
    {
      name: "Classic",
      key: "E",
      tempo: 68,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.5,
      favorites: 234,
      chordProContent: `{start_of_verse}
[E]You are here, moving in our midst
I [A]worship You, I worship You
[E]You are here, working in this place
I [A]worship You, I worship You
{end_of_verse}

{start_of_chorus}
(You are) [E]Way maker, miracle worker
[A]Promise keeper, light in the darkness
My [C#m]God, that is who You [B]are
{end_of_chorus}`,
    },
  ],
  "10,000 Reasons (Bless the Lord)": [
    {
      name: "Original",
      key: "G",
      tempo: 73,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.8,
      favorites: 456,
      chordProContent: `{start_of_chorus}
[G]Bless the Lord, O my soul, [D]O my soul
[Em]Worship His holy [C]name
[G]Sing like never before, [D]O my soul
I'll [Em]worship Your [C]holy [G]name
{end_of_chorus}`,
    },
  ],
  "What A Beautiful Name": [
    {
      name: "Contemporary",
      key: "D",
      tempo: 68,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 3.9,
      favorites: 78,
      chordProContent: `{start_of_verse}
[D]You were the Word at the beginning
[A]One with God the Lord Most High
[Bm]Your hidden glory in creation
[G]Now revealed in You our Christ
{end_of_verse}

{start_of_chorus}
What a [G]beautiful Name it is
What a [D]beautiful Name it is
The [A]Name of Jesus Christ my [Bm]King
{end_of_chorus}`,
    },
  ],
  "Good Good Father": [
    {
      name: "Standard",
      key: "A",
      tempo: 76,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.4,
      favorites: 234,
      chordProContent: `{start_of_verse}
[A]I've heard a thousand stories
[E]Of what they think You're like
[F#m]But I've heard the tender whisper
[D]Of love in the dead of night
{end_of_verse}

{start_of_chorus}
You're a [A]Good Good Father
[E]It's who You are, it's who You are
[F#m]And I'm loved by You
[D]It's who I am, it's who I am
{end_of_chorus}`,
    },
  ],
  "Reckless Love": [
    {
      name: "Traditional",
      key: "Eb",
      tempo: 82,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.3,
      favorites: 167,
      chordProContent: `{start_of_verse}
[Eb]Before I spoke a word, You were singing over me
[Bb]You have been so, so good to me
[Cm]Before I took a breath, You breathed Your life in me
[Ab]You have been so, so kind to me
{end_of_verse}

{start_of_chorus}
Oh, the [Eb]overwhelming, never-ending, reckless love of God
Oh, it [Bb]chases me down, fights 'til I'm found
[Cm]Leaves the ninety-[Ab]nine
{end_of_chorus}`,
    },
  ],
  "Build My Life": [
    {
      name: "Original",
      key: "C",
      tempo: 72,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.6,
      favorites: 312,
      chordProContent: `{start_of_verse}
[C]Worthy of every song we could ever sing
[G]Worthy of all the praise we could ever bring
[Am]Worthy of every breath we could ever breathe
[F]We live for You
{end_of_verse}

{start_of_chorus}
[C]Holy, there is no one like You
[G]There is none beside You
[Am]Open up my eyes in wonder
[F]Show me who You are
{end_of_chorus}`,
    },
  ],
  "Here I Am To Worship": [
    {
      name: "Classic",
      key: "E",
      tempo: 75,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 5,
      favorites: 678,
      chordProContent: `{start_of_verse}
[E]Light of the world
You [B]stepped down into [C#m]darkness
[A]Opened my eyes, let me [E]see
Beauty that made this [B]heart adore [C#m]You
[A]Hope of a life spent with [E]You
{end_of_verse}

{start_of_chorus}
[E]Here I am to [B]worship
Here I am to [C#m]bow down
Here I am to [A]say that You're my [E]God
{end_of_chorus}`,
    },
  ],
  "Holy Spirit": [
    {
      name: "Modern",
      key: "F",
      tempo: 70,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 3.7,
      favorites: 89,
      chordProContent: `{start_of_verse}
[F]There's nothing worth more that will ever come close
[C]No thing can compare You're our living hope
[Dm]Your Presence [Bb]Lord
{end_of_verse}

{start_of_chorus}
[F]Holy Spirit You are welcome here
[C]Come flood this place and fill the atmosphere
[Dm]Your glory God is what our hearts long for
[Bb]To be overcome by Your Presence Lord
{end_of_chorus}`,
    },
  ],
  "Great Are You Lord": [
    {
      name: "Standard",
      key: "D",
      tempo: 68,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.1,
      favorites: 145,
      chordProContent: `{start_of_verse}
[D]You give life, You are love
[A]You bring light to the darkness
[Bm]You give hope, You restore
[G]Every heart that is broken
{end_of_verse}

{start_of_chorus}
[D]Great are You, [A]Lord
[Bm]It's Your breath in our [G]lungs
So we [D]pour out our [A]praise
We [Bm]pour out our [G]praise
{end_of_chorus}`,
    },
  ],
  "King of My Heart": [
    {
      name: "Original",
      key: "Ab",
      tempo: 68,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.0,
      favorites: 145,
      chordProContent: `{start_of_verse}
[Ab]Let the King of my heart
[Eb]Be the mountain where I run
[Fm]The fountain I drink from
[Db]Oh He is my song
{end_of_verse}

{start_of_chorus}
[Ab]You are good, good, oh
[Eb]You are good, good, oh
[Fm]You are good, good, oh
[Db]You are good, good, oh
{end_of_chorus}`,
    },
  ],
  Cornerstone: [
    {
      name: "Traditional",
      key: "C",
      tempo: 72,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 4.5,
      favorites: 267,
      chordProContent: `{start_of_verse}
[C]My hope is built on nothing less
[G]Than Jesus' blood and righteousness
[Am]I dare not trust the sweetest frame
[F]But wholly trust in Jesus' name
{end_of_verse}

{start_of_chorus}
[C]Christ alone, [G]Cornerstone
[Am]Weak made strong in the [F]Savior's love
Through the [C]storm, He is [G]Lord
[Am]Lord of [F]all
{end_of_chorus}`,
    },
  ],
  "Living Hope": [
    {
      name: "Contemporary",
      key: "F",
      tempo: 74,
      timeSignature: "4/4",
      capo: 0,
      tags: [],
      rating: 3.6,
      favorites: 54,
      chordProContent: `{start_of_verse}
[F]How great the chasm that lay between us
[C]How high the mountain I could not climb
[Dm]In desperation I turned to heaven
[Bb]And spoke Your name into the night
{end_of_verse}

{start_of_chorus}
[F]Jesus Christ, my [C]living hope
Oh God, You [Dm]are my living [Bb]hope
{end_of_chorus}`,
    },
  ],
};

/**
 * Seed the database with initial song and arrangement data
 * Run with: npx convex run seed:seedDatabase
 */
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingSongs = await ctx.db.query("songs").take(1);
    if (existingSongs.length > 0) {
      return {
        success: false,
        message: "Database already contains songs. Skipping seed.",
      };
    }

    // Create a system user for seed data
    // First check if system user exists
    let systemUserId: Id<"users">;

    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      // Use first existing user as seed owner
      systemUserId = existingUsers[0]._id;
    } else {
      // Create a system user
      systemUserId = await ctx.db.insert("users", {
        name: "HSA Songbook",
        email: "system@hsasongbook.app",
      });
    }

    // Track song IDs for arrangement creation
    const songIdMap = new Map<string, Id<"songs">>();

    // Insert songs
    for (const song of SEED_SONGS) {
      const songId = await ctx.db.insert("songs", {
        title: song.title,
        artist: song.artist,
        themes: song.themes,
        copyright: song.copyright,
        lyrics: song.lyrics,
        slug: generateSlug(song.title),
        createdBy: systemUserId,
      });
      songIdMap.set(song.title, songId);
    }

    // Insert arrangements
    let arrangementCount = 0;
    for (const [songTitle, arrangements] of Object.entries(SEED_ARRANGEMENTS)) {
      const songId = songIdMap.get(songTitle);
      if (!songId) {
        console.warn(`Song not found for arrangements: ${songTitle}`);
        continue;
      }

      for (const arr of arrangements) {
        const slug = nanoid(6);
        await ctx.db.insert("arrangements", {
          songId,
          name: arr.name,
          key: arr.key,
          tempo: arr.tempo,
          timeSignature: arr.timeSignature,
          capo: arr.capo,
          tags: arr.tags,
          rating: arr.rating,
          favorites: arr.favorites,
          chordProContent: arr.chordProContent,
          slug,
          createdBy: systemUserId,
        });
        arrangementCount++;
      }
    }

    return {
      success: true,
      message: `Seeded ${SEED_SONGS.length} songs and ${arrangementCount} arrangements`,
      songCount: SEED_SONGS.length,
      arrangementCount,
    };
  },
});

/**
 * Clear all seed data (for development/testing)
 * Run with: npx convex run seed:clearDatabase
 */
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all arrangements
    const arrangements = await ctx.db.query("arrangements").collect();
    for (const arr of arrangements) {
      await ctx.db.delete(arr._id);
    }

    // Delete all songs
    const songs = await ctx.db.query("songs").collect();
    for (const song of songs) {
      await ctx.db.delete(song._id);
    }

    // Delete all setlists
    const setlists = await ctx.db.query("setlists").collect();
    for (const setlist of setlists) {
      await ctx.db.delete(setlist._id);
    }

    return {
      success: true,
      message: `Cleared ${songs.length} songs, ${arrangements.length} arrangements, ${setlists.length} setlists`,
    };
  },
});

// ============ PHASE 2: GROUPS & OWNERSHIP MIGRATIONS ============

/**
 * Migrate existing songs and arrangements to have ownership fields
 * Sets ownerType='user' and ownerId=createdBy for all existing content
 * Run with: npx convex run seed:migrateOwnership
 */
export const migrateOwnership = mutation({
  args: {},
  handler: async (ctx) => {
    let songCount = 0;
    let arrangementCount = 0;

    // Migrate songs
    const songs = await ctx.db.query("songs").collect();
    for (const song of songs) {
      if (!song.ownerType) {
        await ctx.db.patch(song._id, {
          ownerType: "user",
          ownerId: song.createdBy.toString(),
        });
        songCount++;
      }
    }

    // Migrate arrangements
    const arrangements = await ctx.db.query("arrangements").collect();
    for (const arr of arrangements) {
      if (!arr.ownerType) {
        await ctx.db.patch(arr._id, {
          ownerType: "user",
          ownerId: arr.createdBy.toString(),
        });
        arrangementCount++;
      }
    }

    return {
      success: true,
      message: `Migrated ${songCount} songs and ${arrangementCount} arrangements to have ownership fields`,
      songCount,
      arrangementCount,
    };
  },
});

/**
 * Seed the Public system group
 * This group is used for crowdsourced/wiki-style content
 * Run with: npx convex run seed:seedPublicGroup
 */
export const seedPublicGroup = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if Public group already exists
    const groups = await ctx.db.query("groups").collect();
    const existingPublicGroup = groups.find((g) => g.isSystemGroup);
    if (existingPublicGroup) {
      return {
        success: false,
        message: "Public group already exists",
        groupId: existingPublicGroup._id,
      };
    }

    // Get a user to be the initial owner
    // Prefer system user, but fall back to any existing user
    const existingUsers = await ctx.db.query("users").collect();
    const systemUser = existingUsers.find((u) => u.email === "system@hsasongbook.app");
    const ownerUser = systemUser ?? existingUsers[0];

    if (!ownerUser) {
      return {
        success: false,
        message: "No users found. At least one user must exist to create the Public group.",
      };
    }

    // Create the Public group
    const groupId = await ctx.db.insert("groups", {
      name: "Public",
      slug: "public",
      description:
        "The community group for crowdsourced songs and arrangements. All members can edit, with full version history for moderation.",
      createdBy: ownerUser._id,
      joinPolicy: "approval", // Require admin approval to join
      isSystemGroup: true,
    });

    // Add owner user as group owner
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: ownerUser._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    return {
      success: true,
      message: "Public group created successfully",
      groupId,
    };
  },
});
